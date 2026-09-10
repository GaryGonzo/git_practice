import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const GOLFABLE_TZ = "America/Los_Angeles";
// Vercel's own cron is capped at once-a-day on the Hobby plan (see
// send-daily-notifications.ts's DST workaround for why), which can't
// support a per-user chosen time. This endpoint is instead invoked every
// ~15 minutes by a GitHub Actions scheduled workflow -- outside Vercel's
// cron limits entirely -- and only actually sends to a user once their
// chosen notify_time falls inside this window of "now".
const WINDOW_MINUTES = 10;

function pacificNow(): { date: string; minutesSinceMidnight: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: GOLFABLE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutesSinceMidnight: (Number(get("hour")) % 24) * 60 + Number(get("minute")),
  };
}

function minutesFromTimeString(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const { date: today, minutesSinceMidnight: nowMinutes } = pacificNow();
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: settingsRows } = await supabase
    .from("fit_notification_settings")
    .select("user_id, notify_time")
    .eq("enabled", true);

  const dueUserIds = (settingsRows ?? [])
    .filter((row) => Math.abs(minutesFromTimeString(row.notify_time as string) - nowMinutes) <= WINDOW_MINUTES)
    .map((row) => row.user_id as string);

  if (dueUserIds.length === 0) {
    res.status(200).json({ skipped: "no users due", today, nowMinutes });
    return;
  }

  const { data: alreadySent } = await supabase
    .from("fit_notification_runs")
    .select("user_id")
    .eq("run_date", today)
    .in("user_id", dueUserIds);
  const alreadySentIds = new Set((alreadySent ?? []).map((r) => r.user_id as string));

  const pendingUserIds = dueUserIds.filter((id) => !alreadySentIds.has(id));
  if (pendingUserIds.length === 0) {
    res.status(200).json({ skipped: "already sent today for all due users", today });
    return;
  }

  const { data: plannedRows } = await supabase
    .from("fit_workout_plans")
    .select("user_id")
    .eq("planned_date", today)
    .in("user_id", pendingUserIds);
  const plannedUserIds = new Set((plannedRows ?? []).map((r) => r.user_id as string));

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key, user_id")
    .in("user_id", pendingUserIds);

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hello@golfable.co",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const WORKOUT_PLANNED_MESSAGE =
    "Don't forget - You've got a Golfable Fit workout today! And go plan your walks now so you get your steps in.";
  const NO_WORKOUT_MESSAGE = "Schedule your daily walks today to get closer to your step goal!";

  const staleSubscriptionIds: string[] = [];
  await Promise.all(
    (subscriptions ?? []).map(async (sub) => {
      const body = plannedUserIds.has(sub.user_id as string) ? WORKOUT_PLANNED_MESSAGE : NO_WORKOUT_MESSAGE;
      const payload = JSON.stringify({ title: "Golfable Fit", body, url: "/app/fit/plan" });
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint as string,
            keys: { p256dh: sub.p256dh as string, auth: sub.auth_key as string },
          },
          payload
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) staleSubscriptionIds.push(sub.id as string);
      }
    })
  );

  if (staleSubscriptionIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", staleSubscriptionIds);
  }

  // Record every due user as sent for today, even one with no push
  // subscription rows -- there's nothing more to retry for them today.
  const runs = pendingUserIds.map((userId) => ({ user_id: userId, run_date: today }));
  const { error: insertError } = await supabase.from("fit_notification_runs").insert(runs);
  if (insertError) console.error("send-fit-notifications: failed to record runs", insertError);

  res.status(200).json({
    dueUsers: pendingUserIds.length,
    sent: (subscriptions ?? []).length,
    stale_removed: staleSubscriptionIds.length,
    today,
  });
}
