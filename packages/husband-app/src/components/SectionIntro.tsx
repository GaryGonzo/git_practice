import { useEffect, useState } from "react";

interface Props {
  storageKey: string;
  emoji: string;
  title: string;
  body: string;
}

export function SectionIntro({ storageKey, emoji, title, body }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) setShow(true);
  }, [storageKey]);

  function dismiss() {
    localStorage.setItem(storageKey, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div
        className="w-full max-w-sm rounded-t-3xl bg-white p-6 text-center sm:rounded-3xl"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <p className="text-4xl">{emoji}</p>
        <p className="font-display mt-3 text-xl font-semibold">{title}</p>
        <p className="font-body mt-2 text-sm text-neutral-600">{body}</p>
        <button
          type="button"
          onClick={dismiss}
          className="font-display bg-brand mt-6 w-full rounded-full px-4 py-3 text-sm font-semibold text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
