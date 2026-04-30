"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createCheckoutSession } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CartItem {
  sku?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// ---------------------------------------------------------------------------
// Mock cart store (replace with your real cart state management)
// ---------------------------------------------------------------------------

function useCartStore() {
  // In a real app this would come from Zustand / context / localStorage.
  // Here we use a simple in-memory demo cart.
  const [items] = useState<CartItem[]>([
    { sku: "FORGE-STARTER", name: "Forge Starter Site", price: 29.99, quantity: 1 },
    { sku: "FORGE-PRO",    name: "Forge Pro Plan",     price: 99.00, quantity: 1 },
  ]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return { items, subtotal };
}

// ---------------------------------------------------------------------------
// CartItemRow
// ---------------------------------------------------------------------------

function CartItemRow({ item }: { item: CartItem }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-slate-800 last:border-0">
      <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center text-2xl">
        📦
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{item.name}</p>
        <p className="text-slate-400 text-sm">{item.sku}</p>
      </div>
      <div className="text-right">
        <p className="text-white font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
        {item.quantity > 1 && (
          <p className="text-slate-400 text-xs">${item.price.toFixed(2)} × {item.quantity}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SuccessBanner / CancelBanner
// ---------------------------------------------------------------------------

function SuccessBanner() {
  return (
    <div className="bg-emerald-950/60 border border-emerald-800 rounded-xl p-5 mb-8">
      <h2 className="text-emerald-300 font-semibold text-lg mb-1">🎉 Order confirmed!</h2>
      <p className="text-emerald-400/70 text-sm">
        Thank you for your purchase. You&apos;ll receive a confirmation email shortly.
      </p>
    </div>
  );
}

function CancelBanner() {
  return (
    <div className="bg-amber-950/60 border border-amber-800 rounded-xl p-5 mb-8">
      <h2 className="text-amber-300 font-semibold text-lg mb-1">Checkout cancelled</h2>
      <p className="text-amber-400/70 text-sm">
        No worries — your cart has been saved. Ready when you are.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Cart Page
// ---------------------------------------------------------------------------

export default function CartPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "1";
  const canceled = searchParams.get("canceled") === "1";
  const demo = searchParams.get("demo") === "1";

  const { items, subtotal } = useCartStore();

  const [customer, setCustomer] = useState({ name: "", email: "" });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handleCheckout() {
    if (!customer.name || !customer.email) {
      setCheckoutError("Please enter your name and email.");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const url = await createCheckoutSession({
        items,
        customer,
        successUrl: `${window.location.origin}/cart?success=1`,
        cancelUrl:  `${window.location.origin}/cart?canceled=1`,
      });

      window.location.href = url;
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold">
            🔨
          </div>
          <span className="font-semibold text-white">Forge Builder</span>
          <span className="ml-auto text-slate-400 text-sm">Cart</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {success && <SuccessBanner />}
        {canceled && <CancelBanner />}

        <h1 className="text-2xl font-bold text-white mb-6">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-4">🛒</p>
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <>
            {/* Line Items */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 mb-6">
              {items.map((item) => (
                <CartItemRow key={item.sku ?? item.name} item={item} />
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Tax</span>
                <span className="text-slate-400 text-sm">Calculated at checkout</span>
              </div>
              <div className="border-t border-slate-800 mt-3 pt-3 flex justify-between items-center">
                <span className="text-white font-semibold">Total</span>
                <span className="text-amber-400 font-bold text-xl">${subtotal.toFixed(2)} AUD</span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
              <h2 className="text-white font-semibold mb-4">Customer Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5" htmlFor="name">
                    Name
                  </label>
                  <Input
                    id="name"
                    placeholder="Jane Smith"
                    value={customer.name}
                    onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5" htmlFor="email">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@example.com"
                    value={customer.email}
                    onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {checkoutError && (
              <div className="bg-red-950/60 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300 mb-6">
                {checkoutError}
              </div>
            )}

            <Button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold text-base py-6 rounded-xl transition-colors disabled:opacity-50"
            >
              {checkoutLoading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  Redirecting to checkout…
                </span>
              ) : (
                "Proceed to Checkout"
              )}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
