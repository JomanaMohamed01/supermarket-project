import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function OrderSuccessPage({ searchParams }: PageProps) {
  const { order: orderId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let total: number | null = null;
  if (orderId) {
    const { data } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();
    total = data ? Number(data.total_amount) : null;
  }

  return (
    <AppShell>
      <div className="animate-rise mx-auto max-w-xl rounded-[2rem] border border-line bg-cream/90 px-8 py-14 text-center shadow-[var(--shadow)]">
        <p className="text-sm font-semibold tracking-[0.16em] text-leaf uppercase">
          Order placed
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-ink">
          Thanks for shopping FreshLane
        </h1>
        <p className="mt-4 text-ink-soft">
          Your order is saved in Supabase. You can keep browsing the aisles
          whenever you&apos;re ready.
        </p>
        {total !== null && (
          <p className="mt-6 font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-leaf">
            {formatMoney(total)}
          </p>
        )}
        <Link
          href="/categories"
          className="mt-8 inline-flex rounded-xl bg-leaf px-6 py-3.5 font-semibold text-cream transition hover:bg-leaf-bright"
        >
          Back to aisles
        </Link>
      </div>
    </AppShell>
  );
}
