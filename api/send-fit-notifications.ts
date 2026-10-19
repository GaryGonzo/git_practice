import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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


// Times are 12h "3:30 PM" style for the notification title.
function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supabase = SupabaseClient<any, "public", any>;

// Routine reminders: every fit_routine_items row flagged remind=true pushes
// once a day at its own time (lift, shutdown, dog walk, wind-down). A
// Supabase pg_cron job calls this every 5 minutes, so an item counts as due
// from 2 minutes ahead of its time until 15 minutes after (covering a late
// or skipped run); fit_routine_reminder_runs keeps it to one push per item
// per day however many runs overlap.
async function sendRoutineReminders(
  supabase: Supabase,
  today: string,
  nowMinutes: number
): Promise<{ due: number; sent: number; staleIds: string[]; errors: string[] }> {
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
  const { data: itemRows } = await supabase
    .from("fit_routine_items")
    .select("id, user_id, time_of_day, title, detail")
    .eq("remind", true)
    .not("time_of_day", "is", null)
    .contains("days_of_week", [dow]);

  const dueItems = (itemRows ?? []).filter((row) => {
    const itemMinutes = minutesFromTimeString(row.time_of_day as string);
    return itemMinutes >= nowMinutes - 15 && itemMinutes <= nowMinutes + 2;
  });
  if (dueItems.length === 0) return { due: 0, sent: 0, staleIds: [], errors: [] };

  const { data: sentRows } = await supabase
    .from("fit_routine_reminder_runs")
    .select("item_id")
    .eq("run_date", today)
    .in(
      "item_id",
      dueItems.map((i) => i.id as string)
    );
  const sentIds = new Set((sentRows ?? []).map((r) => r.item_id as string));
  const pending = dueItems.filter((i) => !sentIds.has(i.id as string));
  if (pending.length === 0) return { due: dueItems.length, sent: 0, staleIds: [], errors: [] };

  const userIds = [...new Set(pending.map((i) => i.user_id as string))];
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key, user_id")
    .in("user_id", userIds);

  const staleIds: string[] = [];
  const errors: string[] = [];
  let sent = 0;
  await Promise.all(
    pending.flatMap((item) =>
      (subscriptions ?? [])
        .filter((sub) => sub.user_id === item.user_id)
        .map(async (sub) => {
          const payload = JSON.stringify({
            title: `${item.title} · ${formatTime12h(item.time_of_day as string)}`,
            body: (item.detail as string | null) ?? "Open today's plan.",
            url: "/app/fit/today",
          });
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint as string, keys: { p256dh: sub.p256dh as string, auth: sub.auth_key as string } },
              payload
            );
            sent += 1;
          } catch (err) {
            const statusCode = (err as { statusCode?: number }).statusCode;
            if (statusCode === 404 || statusCode === 410) staleIds.push(sub.id as string);
            errors.push(`${item.title}: ${statusCode ?? ""} ${err instanceof Error ? err.message : String(err)}`.slice(0, 300));
          }
        })
    )
  );

  const { error } = await supabase
    .from("fit_routine_reminder_runs")
    .upsert(
      pending.map((i) => ({ item_id: i.id as string, run_date: today })),
      { onConflict: "item_id,run_date", ignoreDuplicates: true }
    );
  if (error) errors.push(`record runs: ${error.message}`);

  return { due: dueItems.length, sent, staleIds, errors };
}

// Called every 5 minutes by a Supabase pg_cron job (Bearer FIT_CRON_SECRET)
// and, as a backup, by the GitHub Actions workflow (Bearer CRON_SECRET).
// Every call is written to fit_cron_log -- result or error -- so whether a
// reminder fired is always answerable from the database.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization;
  const accepted = [process.env.CRON_SECRET, process.env.FIT_CRON_SECRET].filter(Boolean).map((s) => `Bearer ${s}`);
  if (!auth || !accepted.includes(auth)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const source = process.env.FIT_CRON_SECRET && auth === `Bearer ${process.env.FIT_CRON_SECRET}` ? "supabase" : "github";
  let result: Record<string, unknown>;
  let failed = false;
  try {
    result = await run(supabase);
  } catch (err) {
    failed = true;
    result = { error: err instanceof Error ? `${err.message}\n${err.stack ?? ""}`.slice(0, 2000) : String(err) };
  }

  const { error: logError } = await supabase.from("fit_cron_log").insert({ source, ok: !failed, result });
  if (logError) console.error("send-fit-notifications: failed to write fit_cron_log", logError);
  // Keep three days of history.
  await supabase.from("fit_cron_log").delete().lt("ran_at", new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString());

  res.status(failed ? 500 : 200).json(result);
}

async function run(supabase: Supabase): Promise<Record<string, unknown>> {
  const { date: today, minutesSinceMidnight: nowMinutes } = pacificNow();

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hello@golfable.co",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  // Routine reminders run first and independently -- the once-a-day
  // reminder below returns early on most runs.
  const routine = await sendRoutineReminders(supabase, today, nowMinutes);
  if (routine.staleIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", routine.staleIds);
  }

  const { data: settingsRows } = await supabase
    .from("fit_notification_settings")
    .select("user_id, notify_time")
    .eq("enabled", true);

  const dueUserIds = (settingsRows ?? [])
    .filter((row) => Math.abs(minutesFromTimeString(row.notify_time as string) - nowMinutes) <= WINDOW_MINUTES)
    .map((row) => row.user_id as string);

  if (dueUserIds.length === 0) {
    return { daily: "no users due", today, nowMinutes, routine };
  }

  const { data: alreadySent } = await supabase
    .from("fit_notification_runs")
    .select("user_id")
    .eq("run_date", today)
    .in("user_id", dueUserIds);
  const alreadySentIds = new Set((alreadySent ?? []).map((r) => r.user_id as string));

  const pendingUserIds = dueUserIds.filter((id) => !alreadySentIds.has(id));
  if (pendingUserIds.length === 0) {
    return { daily: "already sent today", today, nowMinutes, routine };
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

  return {
    daily: { dueUsers: pendingUserIds.length, sent: (subscriptions ?? []).length, staleRemoved: staleSubscriptionIds.length },
    today,
    nowMinutes,
    routine,
  };
}
