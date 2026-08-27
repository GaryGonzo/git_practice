import { useEffect, useState } from "react";
import { useAuth, type Profile } from "../lib/AuthProvider";
import { PUSH_ENABLED_KEY, isIOS, isStandalone, notificationPermission, pushSupported, subscribeToPush } from "../lib/push";
import { sendTestNotification } from "../lib/golfableApi";

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 10a6 6 0 1 1 12 0c0 3.2 1 4.8 1.6 5.6a1 1 0 0 1-.8 1.6H5.2a1 1 0 0 1-.8-1.6C5 14.8 6 13.2 6 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9.5 19.5a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

type PushState = "unsupported" | "subscribed" | "denied" | "not-installed" | "ready";

function getPushState(): PushState {
  if (localStorage.getItem(PUSH_ENABLED_KEY) === "true") return "subscribed";
  // On iOS, PushManager doesn't exist in window at all until the app has
  // been added to the Home Screen -- pushSupported() would report "false"
  // (indistinguishable from a browser that truly can't do push) for every
  // first-time visitor, before they've had a chance to install. Check
  // iOS's install state first so the "add to Home Screen" instructions
  // actually reach them instead of the prompt silently rendering nothing.
  if (isIOS() && !isStandalone()) return "not-installed";
  if (!pushSupported()) return "unsupported";
  if (notificationPermission() === "denied") return "denied";
  if (!isStandalone()) return "not-installed";
  return "ready";
}

interface NotificationPromptProps {
  profile: Profile;
  onSubscribed?: () => void;
}

// The core benefit-plus-instructions block, reused as-is inside the Profile
// prompt card and inside a walkthrough step -- both callers decide their
// own outer wrapper/background.
export function NotificationPrompt({ profile, onSubscribed }: NotificationPromptProps) {
  const { session } = useAuth();
  const [state, setState] = useState<PushState>("unsupported");
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    setState(getPushState());
  }, []);

  if (state === "unsupported") return null;

  async function handleEnable() {
    setError(null);
    setSubscribing(true);
    try {
      await subscribeToPush(profile.id);
      setState("subscribed");
      onSubscribed?.();
    } catch {
      setError("Couldn't enable notifications -- try again.");
    }
    setSubscribing(false);
  }

  async function handleTest() {
    if (!session) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await sendTestNotification(session.access_token);
      if (result.sent > 0) {
        setTestResult(
          `Sent -- check your device.${result.staleRemoved ? ` (removed ${result.staleRemoved} stale subscription)` : ""}`
        );
      } else if (result.errors.length > 0) {
        setTestResult(`Failed: ${result.errors[0]}`);
      } else {
        setTestResult("No active subscription to send to -- try enabling notifications again.");
      }
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : "Couldn't send a test notification.");
    }
    setTesting(false);
  }

  if (state === "subscribed") {
    return (
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BellIcon className="text-brand h-5 w-5" />
            <p className="font-label text-sm font-semibold">Notifications are on</p>
          </div>
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !session}
            className="font-label text-brand flex-none text-sm font-semibold underline disabled:opacity-60"
          >
            {testing ? "Sending…" : "Send test"}
          </button>
        </div>
        {testResult && <p className="font-body mt-2 text-sm text-neutral-600">{testResult}</p>}
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="bg-brand/10 flex h-9 w-9 flex-none items-center justify-center rounded-full">
        <BellIcon className="text-brand h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-label text-sm font-semibold">Turn on notifications</p>
        <p className="font-body mt-0.5 text-sm text-neutral-600">
          Players who enable notifications are more consistent and see better results -- we'll give you a nudge when
          a new Golfable drops.
        </p>

        {state === "denied" && (
          <p className="font-body mt-2 text-sm text-neutral-500">
            Notifications are blocked for Golfable. Enable them for this site in your device or browser settings to
            get daily reminders.
          </p>
        )}

        {state === "not-installed" &&
          (isIOS() ? (
            <p className="font-body mt-2 text-sm text-neutral-500">
              First, add Golfable to your Home Screen: tap the Share icon in Safari, then "Add to Home Screen." Open
              Golfable from that icon, then come back here to turn on notifications.
            </p>
          ) : (
            <p className="font-body mt-2 text-sm text-neutral-500">
              First, add Golfable to your Home Screen: open your browser menu and choose "Install app" (or "Add to
              Home Screen"). Open Golfable from that icon, then come back here to turn on notifications.
            </p>
          ))}

        {state === "ready" && (
          <button
            type="button"
            onClick={handleEnable}
            disabled={subscribing}
            className="font-label bg-brand mt-2 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {subscribing ? "Enabling…" : "Enable Notifications"}
          </button>
        )}

        {error && <p className="font-body mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
