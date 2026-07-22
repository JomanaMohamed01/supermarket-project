"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

type CartRow = {
  id: string;
  quantity: number;
  product: Product;
};

export function CartClient({ items }: { items: CartRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function supabase() {
    return createClient();
  }

  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  async function updateQuantity(id: string, quantity: number) {
    setBusyId(id);
    setError(null);
    try {
      if (quantity < 1) {
        const { error: deleteError } = await supabase()
          .from("cart_items")
          .delete()
          .eq("id", id);
        if (deleteError) throw deleteError;
      } else {
        const { error: updateError } = await supabase()
          .from("cart_items")
          .update({ quantity })
          .eq("id", id);
        if (updateError) throw updateError;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update cart");
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const { error: deleteError } = await supabase()
        .from("cart_items")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove item");
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="animate-rise rounded-[1.5rem] border border-dashed border-line bg-cream/60 px-6 py-16 text-center">
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold">
          Your cart is empty
        </h2>
        <p className="mt-2 text-ink-soft">Browse an aisle and add a few items.</p>
        <button
          type="button"
          onClick={() => router.push("/categories")}
          className="mt-6 rounded-xl bg-leaf px-5 py-3 font-semibold text-cream"
        >
          Start shopping
        </button>
      </div>
    );
  }

  return (
    <div className="animate-rise space-y-8">
      <ul className="space-y-6">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-ink">
                {item.product.name}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {formatMoney(Number(item.product.price))}
                {item.product.unit ? ` / ${item.product.unit}` : ""}
              </p>
              <p className="mt-2 font-semibold text-leaf">
                Line: {formatMoney(Number(item.product.price) * item.quantity)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-line bg-cream">
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="px-3 py-2 font-bold text-ink-soft hover:text-ink disabled:opacity-50"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="min-w-8 text-center font-semibold">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="px-3 py-2 font-bold text-ink-soft hover:text-ink disabled:opacity-50"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => removeItem(item.id)}
                className="text-sm font-semibold text-danger hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-ink-soft">Cart subtotal</p>
          <p className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-ink">
            {formatMoney(total)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/checkout")}
          className="rounded-xl bg-leaf px-6 py-3.5 font-semibold text-cream transition hover:bg-leaf-bright"
        >
          Go to checkout
        </button>
      </div>
    </div>
  );
}
