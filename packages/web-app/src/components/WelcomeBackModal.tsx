import { GolfableMark } from "./GolfableMark";

interface WelcomeBackModalProps {
  firstName: string;
  onDismiss: () => void;
}

export function WelcomeBackModal({ firstName, onDismiss }: WelcomeBackModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 px-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
        <div className="bg-brand/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          <GolfableMark className="h-10 w-10" />
        </div>
        <h2 className="font-display mt-4 text-2xl tracking-wide">Welcome to your Golfable, {firstName}</h2>
        <p className="font-body mt-2 text-sm text-neutral-600">Let's get started.</p>
        <button
          type="button"
          onClick={onDismiss}
          className="font-label bg-brand mt-6 w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white"
        >
          Let's go
        </button>
      </div>
    </div>
  );
}
