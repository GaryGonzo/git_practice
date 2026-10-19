import { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import {
  getAllFitRoutineItems,
  saveFitRoutineItem,
  deleteFitRoutineItem,
  getActiveFitBlock,
  dayOfWeekISO,
  todayISO,
  type FitRoutineItem,
  type FitRoutineItemInput,
  type FitRoutineKind,
  type FitBlock,
} from "../../lib/golfableApi";
import { PageHeader } from "../../components/ui";

// Monday-first, matching how the week is planned; values are JS getDay().
const DAYS = [
  { value: 1, short: "Mon", letter: "M" },
  { value: 2, short: "Tue", letter: "T" },
  { value: 3, short: "Wed", letter: "W" },
  { value: 4, short: "Thu", letter: "T" },
  { value: 5, short: "Fri", letter: "F" },
  { value: 6, short: "Sat", letter: "S" },
  { value: 0, short: "Sun", letter: "S" },
];

const KINDS: { value: FitRoutineKind; label: string; color: string }[] = [
  { value: "lift", label: "Lift", color: "bg-brand" },
  { value: "golf", label: "Golf", color: "bg-gold" },
  { value: "walk", label: "Walk", color: "bg-fit-recover" },
  { value: "mobility", label: "Mobility", color: "bg-fit-recover" },
  { value: "meal", label: "Meal", color: "bg-fit-circuit" },
  { value: "work", label: "Work", color: "bg-neutral-300" },
  { value: "habit", label: "Habit", color: "bg-fit-warmup" },
  { value: "recovery", label: "Recovery", color: "bg-fit-finisher" },
  { value: "wake", label: "Wake up", color: "bg-fit-finisher" },
  { value: "sleep", label: "Sleep", color: "bg-fit-finisher" },
  { value: "checkin", label: "Check-in", color: "bg-brand" },
];

const KIND_COLOR = Object.fromEntries(KINDS.map((k) => [k.value, k.color])) as Record<FitRoutineKind, string>;

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function daysLabel(days: number[]): string {
  const set = new Set(days);
  if (set.size === 7) return "Every day";
  if (set.size === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d))) return "Weekdays";
  if (set.size === 2 && set.has(0) && set.has(6)) return "Weekends";
  if (set.size === 0) return "Not scheduled";
  return DAYS.filter((d) => set.has(d.value))
    .map((d) => d.short)
    .join(", ");
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 10a6 6 0 0 1 12 0c0 3.5 1 5 2 6H4c1-1 2-2.5 2-6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 flex-none rounded-full transition-colors ${checked ? "bg-brand" : "bg-neutral-300"}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="font-label mb-1.5 text-base font-semibold text-neutral-700">{label}</p>
      {children}
    </div>
  );
}

// Bottom sheet for adding or editing one item. Edits apply to every day the
// item is on.
function ItemEditor({
  initial,
  block,
  defaultDay,
  onSave,
  onDelete,
  onClose,
}: {
  initial: FitRoutineItem | null;
  block: FitBlock | null;
  defaultDay: number;
  onSave: (input: FitRoutineItemInput) => Promise<void>;
  onDelete: (() => Promise<void>) | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [detail, setDetail] = useState(initial?.detail ?? "");
  const [anytime, setAnytime] = useState(initial ? initial.timeOfDay === null : false);
  const [time, setTime] = useState(initial?.timeOfDay ?? "12:00");
  const [days, setDays] = useState<number[]>(initial?.daysOfWeek ?? [defaultDay]);
  const [kind, setKind] = useState<FitRoutineKind>(initial?.kind ?? "habit");
  const [templateIndex, setTemplateIndex] = useState<number>(initial?.templateIndex ?? 0);
  const [remind, setRemind] = useState(initial?.remind ?? false);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Give it a name.");
      return;
    }
    if (days.length === 0) {
      setError("Pick at least one day.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title,
        detail: detail || null,
        timeOfDay: anytime ? null : time,
        daysOfWeek: days,
        kind,
        templateIndex: kind === "lift" ? templateIndex : null,
        remind: !anytime && remind,
      });
    } catch {
      setError("Couldn't save that. Try again.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setSaving(true);
    try {
      await onDelete();
    } catch {
      setError("Couldn't delete that. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/50" onClick={onClose}>
      <div
        role="dialog"
        aria-label={initial ? `Edit ${initial.title}` : "Add to your schedule"}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-neutral-200" aria-hidden="true" />
        <h2 className="font-display mt-3 text-3xl tracking-wide">{initial ? "Edit" : "Add to your schedule"}</h2>

        <Field label="Name">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Evening dog walk"
            className="font-body focus:border-brand w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base outline-none"
          />
        </Field>

        <Field label="When">
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={time}
              disabled={anytime}
              onChange={(e) => setTime(e.target.value)}
              aria-label="Time"
              className="font-display focus:border-brand flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-2xl outline-none disabled:opacity-40"
            />
            <label className="font-label flex items-center gap-2 text-base font-semibold text-neutral-700">
              <Toggle checked={anytime} onChange={setAnytime} label="Anytime" />
              Anytime
            </label>
          </div>
        </Field>

        <Field label="Days">
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((d) => {
              const on = days.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  aria-pressed={on}
                  aria-label={d.short}
                  className={`font-label h-11 rounded-xl text-base font-bold ${on ? "bg-brand-dark text-white" : "bg-neutral-100 text-neutral-500"}`}
                >
                  {d.letter}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex gap-1.5">
            {[
              { label: "Every day", days: [0, 1, 2, 3, 4, 5, 6] },
              { label: "Weekdays", days: [1, 2, 3, 4, 5] },
              { label: "Weekends", days: [0, 6] },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setDays(preset.days)}
                className="font-label rounded-full bg-black/[0.04] px-3 py-1 text-sm font-semibold text-neutral-600"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Type">
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => setKind(k.value)}
                aria-pressed={kind === k.value}
                className={`font-label inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                  kind === k.value ? "bg-brand-dark text-white" : "bg-neutral-100 text-neutral-600"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${k.color}`} aria-hidden="true" />
                {k.label}
              </button>
            ))}
          </div>
        </Field>

        {kind === "lift" && block && block.templates.length > 0 && (
          <Field label="Which session">
            <div className="grid grid-cols-2 gap-1.5">
              {block.templates.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateIndex(i)}
                  aria-pressed={templateIndex === i}
                  className={`font-label rounded-xl px-3 py-2 text-left text-sm font-semibold ${
                    templateIndex === i ? "bg-brand text-white" : "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <p className="font-body mt-1 text-xs text-neutral-500">Today's plan shows a Start button for this session.</p>
          </Field>
        )}

        <Field label="Details">
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={2}
            placeholder="Optional: what to do or remember"
            className="font-body focus:border-brand w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base outline-none"
          />
        </Field>

        <div className={`mt-4 flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-3 ${anytime ? "opacity-50" : ""}`}>
          <span className="flex items-center gap-2">
            <BellIcon className="text-brand h-5 w-5" />
            <span>
              <span className="font-label block text-base font-semibold">Push reminder</span>
              <span className="font-body block text-xs text-neutral-500">{anytime ? "Needs a set time" : "Sent at this time"}</span>
            </span>
          </span>
          <Toggle checked={!anytime && remind} onChange={(v) => !anytime && setRemind(v)} label="Push reminder" />
        </div>

        {error && <p className="font-body mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="font-label rounded-full bg-neutral-100 px-5 py-3.5 text-base font-semibold text-neutral-700">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="font-label bg-brand flex-1 rounded-full px-4 py-3.5 text-base font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : initial ? "Save changes" : "Add it"}
          </button>
        </div>

        {onDelete &&
          (confirmingDelete ? (
            <div className="mt-3 rounded-xl bg-red-50 p-3">
              <p className="font-body text-sm text-red-700">Delete "{initial?.title}" from every day it's on?</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setConfirmingDelete(false)} className="font-label flex-1 rounded-full bg-white px-3 py-2 text-sm font-semibold text-neutral-700">
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="font-label flex-1 rounded-full bg-red-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmingDelete(true)} className="font-label mt-3 w-full py-2 text-base font-semibold text-red-600">
              Delete
            </button>
          ))}
      </div>
    </div>
  );
}

export function FitScheduleScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const [items, setItems] = useState<FitRoutineItem[] | null>(null);
  const [block, setBlock] = useState<FitBlock | null>(null);
  const [day, setDay] = useState(dayOfWeekISO(todayISO()));
  const [editing, setEditing] = useState<FitRoutineItem | "new" | null>(null);

  async function reload() {
    setItems(await getAllFitRoutineItems(userId));
  }

  useEffect(() => {
    getAllFitRoutineItems(userId).then(setItems);
    getActiveFitBlock(userId).then(setBlock);
  }, [userId]);

  const dayItems = (items ?? [])
    .filter((i) => i.daysOfWeek.includes(day))
    .sort((a, b) => {
      if (a.timeOfDay === null && b.timeOfDay !== null) return -1;
      if (b.timeOfDay === null && a.timeOfDay !== null) return 1;
      return (a.timeOfDay ?? "").localeCompare(b.timeOfDay ?? "") || a.orderIndex - b.orderIndex;
    });
  const unscheduled = (items ?? []).filter((i) => i.daysOfWeek.length === 0);
  const dayName = DAYS.find((d) => d.value === day)?.short ?? "";

  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      <PageHeader
        kicker="Golfable Fit"
        title="Your schedule"
        sub="Tap anything to change it. Today's plan and reminders follow this."
        back={{ to: "/app/fit", label: "Program" }}
      />

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {DAYS.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => setDay(d.value)}
            aria-pressed={day === d.value}
            className={`font-label rounded-xl py-2 text-sm font-bold ${
              day === d.value ? "bg-brand-dark text-white" : "bg-white text-neutral-500 ring-1 ring-black/[0.06]"
            }`}
          >
            {d.short}
          </button>
        ))}
      </div>

      {items === null ? (
        <p className="font-body mt-6 text-sm text-neutral-500">Loading your schedule…</p>
      ) : (
        <>
          <div className="mt-4 divide-y divide-neutral-100 overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06]">
            {dayItems.length === 0 && <p className="font-body px-4 py-4 text-sm text-neutral-500">Nothing on {dayName} yet.</p>}
            {dayItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setEditing(item)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-neutral-50"
              >
                <span className="font-display w-[4.2rem] flex-none text-right text-lg leading-none text-neutral-800">
                  {item.timeOfDay ? formatTime12h(item.timeOfDay).replace(" ", " ") : <span className="font-label text-sm text-neutral-400">Any</span>}
                </span>
                <span className={`h-8 w-1 flex-none rounded-full ${KIND_COLOR[item.kind]}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="font-label block truncate text-[1.05rem] leading-tight font-semibold">{item.title}</span>
                  <span className="font-body block truncate text-sm text-neutral-500">{daysLabel(item.daysOfWeek)}</span>
                </span>
                {item.remind && <BellIcon className="text-brand h-4 w-4 flex-none" />}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setEditing("new")}
            className="font-label bg-brand mt-4 w-full rounded-full px-4 py-3.5 text-base font-bold text-white"
          >
            Add to {dayName}
          </button>

          {unscheduled.length > 0 && (
            <section className="mt-7">
              <h2 className="font-label mb-2 px-1 text-xl font-semibold">Not on any day</h2>
              <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06]">
                {unscheduled.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEditing(item)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-neutral-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="font-label block truncate text-[1.05rem] font-semibold text-neutral-500">{item.title}</span>
                      <span className="font-body block text-sm text-neutral-400">Tap to schedule or delete</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {editing && (
        <ItemEditor
          initial={editing === "new" ? null : editing}
          block={block}
          defaultDay={day}
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            await saveFitRoutineItem(userId, input, editing === "new" ? undefined : editing.id);
            setEditing(null);
            await reload();
          }}
          onDelete={
            editing === "new"
              ? null
              : async () => {
                  await deleteFitRoutineItem(userId, editing.id);
                  setEditing(null);
                  await reload();
                }
          }
        />
      )}
    </div>
  );
}
