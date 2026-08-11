// Triggered by a Supabase Database Webhook on INSERT into public.notifications.
// Looks up the recipient's push subscriptions and sends a Web Push message to
// each one. JWT verification should be disabled for this function (it's only
// ever called by Supabase's own webhook system, not end users) -- see the
// project README for the exact dashboard steps.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:noreply@example.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const URL_BY_KIND: Record<string, string> = {
  request_created: "/app/requests",
  request_done: "/app/requests",
  request_declined: "/app/requests",
  task_created: "/app/tasks",
  task_done: "/app/tasks",
  task_declined: "/app/tasks",
  bonus_points: "/app/rewards",
  reward_redeemed: "/app/rewards",
};

Deno.serve(async (req) => {
  const payload = await req.json();
  const record = payload.record;
  if (!record) return new Response("no record", { status: 400 });

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("member_id", record.recipient_id);

  if (error) return new Response(error.message, { status: 500 });
  if (!subscriptions || subscriptions.length === 0) return new Response("no subscriptions", { status: 200 });

  const notificationPayload = JSON.stringify({
    title: record.title,
    body: record.body ?? "",
    url: URL_BY_KIND[record.kind] ?? "/app",
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          notificationPayload
        );
      } catch (err) {
        const statusCode = err?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error("push send failed", statusCode, err);
        }
      }
    })
  );

  return new Response("ok", { status: 200 });
});
