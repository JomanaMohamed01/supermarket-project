"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

type AddToCartButtonProps = {
  productId: string;
};

export function AddToCartButton({ productId }: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{
    text: string;
    tone: "success" | "error";
  } | null>(null);
  const [phase, setPhase] = useState<"hidden" | "in" | "out">("hidden");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function showToast(text: string, tone: "success" | "error" = "success") {
    clearTimers();
    setToast({ text, tone });
    setPhase("in");
    timersRef.current.push(setTimeout(() => setPhase("out"), 2200));
    timersRef.current.push(
      setTimeout(() => {
        setPhase("hidden");
        setToast(null);
      }, 2700),
    );
  }

  useEffect(() => {
    setMounted(true);
    return () => clearTimers();
  }, []);

  async function addToCart() {
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: existing, error: existingError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (existingError) throw existingError;

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

        // If the row already exists (unique conflict), bump quantity instead
        if (error?.code === "23505") {
          const { data: row, error: refetchError } = await supabase
            .from("cart_items")
            .select("id, quantity")
            .eq("user_id", user.id)
            .eq("product_id", productId)
            .maybeSingle();

          if (refetchError) throw refetchError;
          if (!row) throw error;

          const { error: updateError } = await supabase
            .from("cart_items")
            .update({ quantity: row.quantity + 1 })
            .eq("id", row.id);
          if (updateError) throw updateError;
        } else if (error) {
          throw error;
        }
      }

      showToast("Added to cart");
      router.refresh();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : "Could not add item";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  const toastNode =
    toast && phase !== "hidden" ? (
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[110] flex justify-center px-4 pt-5 sm:pt-6">
        <div
          role="status"
          className={`rounded-2xl border px-5 py-3 text-sm font-semibold shadow-[var(--shadow)] sm:text-base ${
            toast.tone === "success"
              ? "border-leaf/20 bg-leaf text-cream"
              : "border-danger/20 bg-danger text-cream"
          } ${phase === "in" ? "welcome-toast-in" : "welcome-toast-out"}`}
        >
          {toast.text}
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={addToCart}
        disabled={loading}
        className="w-full rounded-xl bg-leaf px-4 py-3 text-sm font-semibold text-cream transition hover:bg-leaf-bright disabled:opacity-60"
      >
        {loading ? "Adding..." : "Add to cart"}
      </button>

      {mounted && toastNode ? createPortal(toastNode, document.body) : null}
    </>
  );
}
