// Shared loading / error states for Fit panels, so a failed fetch shows a
// retry instead of silently vanishing (which reads like lost data).
export function PanelSkeleton({ className = "", label = "Loading", rows = 2 }: { className?: string; label?: string; rows?: number }) {
  return (
    <div className={`rounded-2xl bg-white p-4 ring-1 ring-black/[0.06] ${className}`} aria-busy="true" aria-label={label} role="status">
      <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-200" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="mt-3 h-10 animate-pulse rounded-xl bg-neutral-100" />
      ))}
    </div>
  );
}

export function PanelError({ className = "", message, onRetry }: { className?: string; message: string; onRetry: () => void }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06] ${className}`} role="alert">
      <p className="font-body min-w-0 text-sm text-neutral-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="font-label bg-brand/10 text-brand min-h-11 shrink-0 rounded-full px-4 text-sm font-bold"
      >
        Retry
      </button>
    </div>
  );
}

export function ScreenSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div className="mt-5 space-y-4" aria-busy="true" aria-label={label} role="status">
      <div className="h-36 animate-pulse rounded-2xl bg-neutral-200" />
      <div className="h-14 animate-pulse rounded-2xl bg-neutral-100" />
      <div className="h-28 animate-pulse rounded-2xl bg-neutral-100" />
      <div className="h-28 animate-pulse rounded-2xl bg-neutral-100" />
    </div>
  );
}
