import { AppShell } from "@/components/AppShell";
import { CheckoutClient } from "@/components/CheckoutClient";
import { requireUser } from "@/lib/auth";
import type { Product } from "@/lib/types";

export default async function CheckoutPage() {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("cart_items")
    .select("id, quantity, product:products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const items =
    data
      ?.map((row) => ({
        id: row.id as string,
        quantity: row.quantity as number,
        product: row.product as unknown as Product,
      }))
      .filter((row) => row.product) ?? [];

  return (
    <AppShell>
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-semibold tracking-[0.16em] text-leaf uppercase">
          Checkout
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-ink">
          Review & pay
        </h1>
        <p className="mt-2 text-ink-soft">
          Confirm your items. The total appears below, right before payment.
        </p>
      </div>

      {error && (
        <p className="mb-6 rounded-xl bg-danger/10 px-4 py-3 text-danger">
          {error.message}
        </p>
      )}

      <CheckoutClient items={items} />
    </AppShell>
  );
}
