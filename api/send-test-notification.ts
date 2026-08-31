import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Lets a member send themselves a test push, independent of the daily
// cron job -- useful both as a feature ("did I actually turn this on?")
// and as a diagnostic: if this succeeds, the VAPID keys and web-push
// wiring are known-good, which narrows down why the cron send
// (api/send-daily-notifications.ts) isn't showing up in
// daily_notification_runs. Only ever touches the caller's own
// subscriptions -- RLS on push_subscriptions already scopes everything
// here to auth.uid(), so no service-role client is needed.
export default async function handler(req: VercelRequest, res: VercelResponse) {
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
