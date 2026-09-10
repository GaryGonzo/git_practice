import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthProvider";
import {
  getFitWalks,
  addFitWalk,
  deleteFitWalk,
  isWorkoutPlanned,
  setWorkoutPlanned,
  getFitNotificationSettings,
  updateFitNotificationSettings,
  todayISO,
  type FitWalk,
  type FitNotificationSettings,
} from "../../lib/golfableApi";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M4.5 6h11M8 6V4.5h4V6m-6.5 0 .6 9.4a1 1 0 0 0 1 .9h5.8a1 1 0 0 0 1-.9L15.5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 10a6 6 0 0 1 12 0c0 3.5 1 5 2 6H4c1-1 2-2.5 2-6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function WalkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="14" cy="4.5" r="1.7" fill="currentColor" />
      <path
        d="M11 8l2 3-1 3 3 4M13 11l3-1 2 2M10 14l-2 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Switch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 flex-none rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-brand" : "bg-neutral-300"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );
}

function DurationStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 5))}
        disabled={value <= 0}
        className="font-label flex h-8 w-8 flex-none items-center justify-center rounded-full border border-neutral-300 text-base font-semibold text-neutral-600 disabled:opacity-40"
      >
        −
      </button>
      <span className="font-display w-16 text-center text-lg">{value} min</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(180, value + 5))}
        disabled={value >= 180}
        className="font-label flex h-8 w-8 flex-none items-center justify-center rounded-full border border-neutral-300 text-base font-semibold text-neutral-600 disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

function addDays(date: string, delta: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function formatDateLong(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function WalkRow({ walk, onDelete }: { walk: FitWalk; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3">
      <div className="bg-fit-warmup/10 text-fit-warmup flex h-9 w-9 flex-none items-center justify-center rounded-full">
        <WalkIcon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-label text-sm font-semibold">{formatTime12h(walk.timeOfDay)}</p>
        <p className="font-body text-sm text-neutral-500">{walk.durationMinutes} min walk</p>
      </div>
      <button type="button" onClick={onDelete} className="flex-none p-1 text-neutral-400 active:text-red-600">
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function AddWalkForm({ onAdd, onCancel }: { onAdd: (time: string, duration: number) => Promise<void>; onCancel: () => void }) {
  const [time, setTime] = useState("07:00");
  const [duration, setDuration] = useState(15);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onAdd(time, duration);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-neutral-200 bg-white p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="font-body mt-1 block rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="font-label block text-xs font-semibold tracking-wide text-neutral-500 uppercase">Duration</label>
          <div className="mt-1">
            <DurationStepper value={duration} onChange={setDuration} />
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="font-label flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="font-label bg-brand flex-1 rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add Walk"}
        </button>
      </div>
    </form>
  );
}

function NotificationCard({ userId }: { userId: string }) {
  const [settings, setSettings] = useState<FitNotificationSettings | null>(null);

  useEffect(() => {
    getFitNotificationSettings(userId).then(setSettings);
  }, [userId]);

  if (!settings) return null;

  async function handleToggle(enabled: boolean) {
    setSettings((s) => (s ? { ...s, enabled } : s));
    await updateFitNotificationSettings(userId, { enabled });
  }

  async function handleTimeChange(time: string) {
    setSettings((s) => (s ? { ...s, notifyTime: time } : s));
    await updateFitNotificationSettings(userId, { notifyTime: time });
  }

  return (
    <div className="border-l-fit-finisher mt-3 rounded-lg border border-l-4 border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="bg-fit-finisher/10 text-fit-finisher flex h-9 w-9 flex-none items-center justify-center rounded-full">
          <BellIcon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-label text-sm font-semibold tracking-widest text-neutral-500 uppercase">
            Daily Reminder
          </p>
          <p className="font-body text-sm text-neutral-600">
            {settings.enabled
              ? `On at ${formatTime12h(settings.notifyTime.slice(0, 5))}`
              : "Off"}
          </p>
        </div>
        <Switch checked={settings.enabled} onChange={handleToggle} />
      </div>
      {settings.enabled && (
        <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
          <label className="font-label text-sm font-semibold text-neutral-600">Remind me at</label>
          <input
            type="time"
            value={settings.notifyTime.slice(0, 5)}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="font-body rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
          />
        </div>
      )}
      <p className="font-body mt-2 text-xs text-neutral-500">
        One reminder a day -- what it says depends on whether you've planned a workout for that day. Separate
        from the daily Golfable notification.
      </p>
    </div>
  );
}

export function FitPlanScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const [date, setDate] = useState(todayISO());
  const [walks, setWalks] = useState<FitWalk[]>([]);
  const [workoutPlanned, setWorkoutPlannedState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddWalk, setShowAddWalk] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getFitWalks(userId, date), isWorkoutPlanned(userId, date)]).then(([w, planned]) => {
      setWalks(w);
      setWorkoutPlannedState(planned);
      setLoading(false);
    });
  }, [userId, date]);

  async function handleToggleWorkout(planned: boolean) {
    setWorkoutPlannedState(planned);
    await setWorkoutPlanned(userId, date, planned);
  }

  async function handleAddWalk(time: string, duration: number) {
    await addFitWalk(userId, date, time, duration);
    setWalks(await getFitWalks(userId, date));
    setShowAddWalk(false);
  }

  async function handleDeleteWalk(walkId: string) {
    setWalks((w) => w.filter((x) => x.id !== walkId));
    await deleteFitWalk(walkId);
  }

  const isToday = date === todayISO();

  return (
    <div className="mx-auto max-w-md px-4 pt-4 pb-24">
      <Link to="/app/fit" className="font-label inline-flex items-center gap-1 text-sm font-semibold text-neutral-500">
        <BackIcon className="h-4 w-4" />
        Golfable Fit
      </Link>

      <h1 className="font-display mt-3 text-2xl tracking-wide">Plan Your Day</h1>

      <div className="mt-3 flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-2">
        <button type="button" onClick={() => setDate((d) => addDays(d, -1))} className="p-2 text-neutral-500">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="font-label text-sm font-semibold">{formatDateLong(date)}</p>
          {isToday && <p className="font-label text-brand text-xs font-semibold uppercase">Today</p>}
        </div>
        <button type="button" onClick={() => setDate((d) => addDays(d, 1))} className="p-2 text-neutral-500">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {!loading && (
        <>
          <div className="border-l-fit-circuit mt-3 flex items-center justify-between rounded-lg border border-l-4 border-neutral-200 bg-white p-4">
            <div>
              <p className="font-label text-sm font-semibold tracking-widest text-neutral-500 uppercase">
                Workout Day
              </p>
              <p className="font-body text-sm text-neutral-600">
                {workoutPlanned ? "Planned -- no set time, just today" : "Not planned"}
              </p>
            </div>
            <Switch checked={workoutPlanned} onChange={handleToggleWorkout} />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="font-label text-xs font-semibold tracking-wide text-neutral-500 uppercase">Walks</p>
            {!showAddWalk && (
              <button type="button" onClick={() => setShowAddWalk(true)} className="font-label text-brand text-sm font-semibold underline">
                + Add a Walk
              </button>
            )}
          </div>

          <div className="mt-2 space-y-2">
            {showAddWalk && <AddWalkForm onAdd={handleAddWalk} onCancel={() => setShowAddWalk(false)} />}
            {walks.length === 0 && !showAddWalk && (
              <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-center">
                <p className="font-body text-sm text-neutral-500">No walks scheduled for this day.</p>
              </div>
            )}
            {walks.map((walk) => (
              <WalkRow key={walk.id} walk={walk} onDelete={() => handleDeleteWalk(walk.id)} />
            ))}
          </div>
        </>
      )}

      <NotificationCard userId={userId} />
    </div>
  );
}
