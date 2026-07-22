import { AppShell } from "@/components/AppShell";
import { CartClient } from "@/components/CartClient";
import { requireUser } from "@/lib/auth";
import type { Product } from "@/lib/types";

export default async function CartPage() {
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
      <div className="mb-8">
        <p className="text-sm font-semibold tracking-[0.16em] text-leaf uppercase">
          Cart
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-ink">
          Your shopping cart
        </h1>
        <p className="mt-2 text-ink-soft">
          Adjust quantities or remove items before checkout.
        </p>
      </div>

      {error && (
        <p className="mb-6 rounded-xl bg-danger/10 px-4 py-3 text-danger">
          {error.message}
        </p>
      )}

      <CartClient items={items} />
    </AppShell>
  );
}
