import { Link } from "react-router-dom";

export function SignupChooserScreen() {
  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-3xl">Create your account</h1>
      <p className="font-body mt-1 text-sm text-neutral-600">
        Each partner gets their own account, then you link up as a household.
      </p>

      <div className="mt-6 space-y-3">
        <Link
          to="/signup/wife"
          className="font-display block rounded-xl border border-neutral-200 bg-white p-4 text-left active:scale-[0.99]"
        >
          <p className="text-base font-semibold">👰 I'm the wife</p>
          <p className="font-body mt-0.5 text-sm text-neutral-500">Create a wife account</p>
        </Link>
        <Link
          to="/signup/husband"
          className="font-display block rounded-xl border border-neutral-200 bg-white p-4 text-left active:scale-[0.99]"
        >
          <p className="text-base font-semibold">🤵 I'm the husband</p>
          <p className="font-body mt-0.5 text-sm text-neutral-500">Create a husband account</p>
        </Link>
      </div>

      <p className="font-body mt-4 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link to="/login" className="text-brand underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
