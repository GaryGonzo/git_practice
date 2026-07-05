import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | undefined;

export function getStripe(): Promise<Stripe | null> {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.warn(
      "VITE_STRIPE_PUBLISHABLE_KEY is not set. Copy .env.example to .env.local and fill it in."
    );
  }
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey ?? "");
  }
  return stripePromise;
}
