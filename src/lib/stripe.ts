/**
 * Stripe client-side instance
 *
 * Environment variables (add to .env.local):
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
 *   STRIPE_SECRET_KEY=sk_test_...          (server-only)
 *   STRIPE_WEBHOOK_SECRET=whsec_...        (server-only)
 */

import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key || key === "pk_test_placeholder") {
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise!;
}

/**
 * Create a Stripe Checkout session from the client side.
 * Returns the checkout URL to redirect to.
 *
 * Usage:
 *   const url = await createCheckoutSession({
 *     items: [{ sku: 'SKU1', name: 'Product', price: 29.99, quantity: 1 }],
 *     customer: { name: 'Jane', email: 'jane@example.com' },
 *     successUrl: '/cart?success=1',
 *     cancelUrl:  '/cart?canceled=1',
 *   });
 */
export async function createCheckoutSession(payload: {
  items: Array<{
    sku?: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  customer?: { name?: string; email?: string };
  successUrl?: string;
  cancelUrl?: string;
}): Promise<string> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error ?? "Failed to create checkout session");
  }

  // Demo mode returns { demo: true, checkoutUrl: '/cart' }
  if (data.demo) {
    return data.checkoutUrl ?? "/cart";
  }

  return data.checkoutUrl;
}
