"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AddToCartButtonProps = {
  productId: string;
};

export function AddToCartButton({ productId }: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function addToCart() {
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: productId,
          quantity: 1,
        });
        if (error) throw error;
      }

      setMessage("Added to cart");
      router.refresh();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : "Could not add item";
      setMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={addToCart}
        disabled={loading}
        className="w-full rounded-xl bg-leaf px-4 py-3 text-sm font-semibold text-cream transition hover:bg-leaf-bright disabled:opacity-60"
      >
        {loading ? "Adding..." : "Add to cart"}
      </button>
      {message && <p className="text-xs text-ink-soft">{message}</p>}
    </div>
  );
}
