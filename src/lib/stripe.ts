import "server-only";
import Stripe from "stripe";

/**
 * Stripe, on the server only. The secret key lives in Vercel's environment variables
 * (STRIPE_SECRET_KEY) and is never sent to visitors' browsers.
 */
const key = (process.env.STRIPE_SECRET_KEY ?? "").trim();

export const isStripeConfigured = /^(sk|rk)_(live|test)_/.test(key);

let client: Stripe | null = null;

export function getStripe() {
  if (!isStripeConfigured) throw new Error("Payments aren't set up yet.");
  client ??= new Stripe(key);
  return client;
}
