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

export function CheckoutClient({ items }: { items: CartRow[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  async function placeOrder() {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (items.length === 0) {
        setError("Your cart is empty.");
        return;
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          status: "pending",
          total_amount: total,
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => {
        const unitPrice = Number(item.product.price);
        return {
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name,
          unit_price: unitPrice,
          quantity: item.quantity,
          line_total: unitPrice * item.quantity,
        };
      });

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      const { error: clearError } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (clearError) throw clearError;

      router.push(`/order-success?order=${order.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-line bg-cream/60 px-6 py-14 text-center">
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold">
          Nothing to checkout
        </h2>
        <button
          type="button"
          onClick={() => router.push("/categories")}
          className="mt-6 rounded-xl bg-leaf px-5 py-3 font-semibold text-cream"
        >
          Browse aisles
        </button>
      </div>
    );
  }

  return (
    <div className="animate-rise mx-auto max-w-2xl space-y-8">
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-4 border-b border-line pb-4"
          >
            <div>
              <p className="font-semibold text-ink">{item.product.name}</p>
              <p className="text-sm text-ink-soft">
                {item.quantity} × {formatMoney(Number(item.product.price))}
              </p>
            </div>
            <p className="font-semibold text-ink">
              {formatMoney(Number(item.product.price) * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="rounded-[1.25rem] bg-cream/90 px-5 py-5 shadow-[var(--shadow)]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-ink-soft">Order total</p>
            <p className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-ink">
              {formatMoney(total)}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={placeOrder}
        disabled={loading}
        className="w-full rounded-xl bg-leaf px-6 py-4 text-lg font-semibold text-cream transition hover:bg-leaf-bright disabled:opacity-60"
      >
        {loading ? "Placing order..." : "Proceed payment"}
      </button>
    </div>
  );
}
