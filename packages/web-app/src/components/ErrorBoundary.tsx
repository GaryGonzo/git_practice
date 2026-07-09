import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// React error boundaries must be class components -- there's no hook
// equivalent yet. Wraps the whole app so an unexpected render error shows a
// recoverable message instead of unmounting to a blank white screen.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Golfable crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-sm px-6 py-24 text-center">
          <h1 className="font-display text-3xl tracking-wide">Something went wrong</h1>
          <p className="font-body mt-3 text-sm text-neutral-600">
            Golfable hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="font-label bg-brand mt-6 rounded-md px-5 py-2.5 text-sm font-semibold text-white"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
