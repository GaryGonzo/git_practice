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

// Lets a member send themselves a test push, independent of the daily
// cron send below -- useful both as a feature ("did I actually turn this
// on?") and as a diagnostic: if this succeeds, the VAPID keys and
// web-push wiring are known-good, which narrows down why the cron send
// isn't showing up in daily_notification_runs. Only ever touches the
// caller's own subscriptions -- RLS on push_subscriptions already scopes
// everything here to auth.uid(), so no service-role client is needed.
// Folded into this file (dispatched by auth header below) rather than
// its own api/send-test-notification.ts to stay under Vercel Hobby's
// 12-serverless-function-per-deployment cap.
async function handleTestNotification(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!accessToken) {
    res.status(401).json({ error: "missing access token" });
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);
  if (userError || !user) {
    res.status(401).json({ error: "invalid access token" });
    return;
  }

  const { data: subscriptions, error: subError } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key");
  if (subError) {
    res.status(500).json({ error: subError.message });
    return;
  }
  if (!subscriptions || subscriptions.length === 0) {
    res.status(400).json({ error: "no push subscription on file -- enable notifications first" });
    return;
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    res.status(500).json({ error: "VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY aren't configured on the server" });
    return;
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hello@golfable.co",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const payload = JSON.stringify({
    title: "Test notification",
    body: "If you can see this, Golfable notifications are working.",
    url: "/app/profile",
  });

  const staleIds: string[] = [];
  const errors: string[] = [];
  let sent = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint as string, keys: { p256dh: sub.p256dh as string, auth: sub.auth_key as string } },
          payload
        );
        sent++;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(sub.id as string);
        } else {
          const message = err instanceof Error ? err.message : "unknown error";
          errors.push(`${statusCode ?? "?"}: ${message}`);
        }
      }
    })
  );

  if (staleIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }

  res.status(200).json({ sent, staleRemoved: staleIds.length, errors });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only Vercel Cron presents the shared CRON_SECRET -- anything else
  // hitting this endpoint is a member testing their own push setup.
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    await handleTestNotification(req, res);
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
