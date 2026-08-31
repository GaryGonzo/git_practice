import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const GOLFABLE_TZ = "America/Los_Angeles";
// vercel.json schedules this at both 17:30 and 18:30 UTC -- exactly one of
// those is 10:30am Pacific depending on DST, so both fire but only the
// correctly-offset one lands inside this window (DST never needs a manual
// schedule update). The window is wide (+/-60min) to also absorb Vercel
// Cron's own trigger-time drift; the daily_notification_runs idempotency
// check below guarantees only one of these ever actually sends.
const TARGET_MINUTES_SINCE_MIDNIGHT = 10 * 60 + 30; // 10:30am
const WINDOW_MINUTES = 60;

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error(
      `send-daily-notifications: unauthorized -- CRON_SECRET is ${process.env.CRON_SECRET ? "set" : "NOT set"}, header present: ${Boolean(req.headers.authorization)}`
    );
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const { date: today, minutesSinceMidnight } = pacificNow();
  console.log(`send-daily-notifications: invoked for ${today}, ${minutesSinceMidnight} minutes since Pacific midnight`);
  if (Math.abs(minutesSinceMidnight - TARGET_MINUTES_SINCE_MIDNIGHT) > WINDOW_MINUTES) {
    res.status(200).json({ skipped: "outside send window", today, minutesSinceMidnight });
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: alreadySent } = await supabase
    .from("daily_notification_runs")
    .select("date")
    .eq("date", today)
    .maybeSingle();
  if (alreadySent) {
    console.log(`send-daily-notifications: already sent today (${today}), skipping`);
    res.status(200).json({ skipped: "already sent today", today });
    return;
  }

  const { data: daily } = await supabase.from("daily_golfable").select("drill_id, drills(name, category)").eq("date", today).maybeSingle();
  if (!daily) {
    console.log(`send-daily-notifications: no Golfable scheduled for ${today}, skipping`);
    res.status(200).json({ skipped: "no Golfable scheduled today", today });
    return;
  }
  const drill = Array.isArray(daily.drills) ? daily.drills[0] : daily.drills;
  if (!drill) {
    res.status(200).json({ skipped: "no Golfable scheduled today", today });
    return;
  }

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key, user_id");

  const { data: playedRows } = await supabase.from("scores").select("user_id").eq("drill_id", daily.drill_id).eq("date", today);
  const playedUserIds = new Set((playedRows ?? []).map((r) => r.user_id as string));

  const recipients = (subscriptions ?? []).filter((sub) => !playedUserIds.has(sub.user_id as string));

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hello@golfable.co",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const categoryLabel = String(drill.category).charAt(0).toUpperCase() + String(drill.category).slice(1);
  const payload = JSON.stringify({
    title: "New Golfable is ready!",
    body: `${categoryLabel} - ${drill.name}`,
    url: "/app/today",
  });

  const staleSubscriptionIds: string[] = [];
  await Promise.all(
    recipients.map(async (sub) => {
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

  const { error: insertError } = await supabase
    .from("daily_notification_runs")
    .insert({ date: today, recipient_count: recipients.length });
  if (insertError) console.error("send-daily-notifications: failed to record run", insertError);

  console.log(`send-daily-notifications: sent ${recipients.length}, removed ${staleSubscriptionIds.length} stale, today=${today}`);
  res.status(200).json({ sent: recipients.length, stale_removed: staleSubscriptionIds.length, today });
}
