import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import type { Category } from "@/lib/types";

export default async function CategoriesPage() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  const categories = (data ?? []) as Category[];

  return (
    <AppShell>
      <div className="animate-rise mb-10 max-w-2xl">
        <p className="text-sm font-semibold tracking-[0.16em] text-leaf uppercase">
          Aisles
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-ink sm:text-5xl">
          FreshLane
        </h1>
        <p className="mt-3 text-ink-soft">
          Pick a category to start filling your cart.
        </p>
      </div>

      {error && (
        <p className="mb-6 rounded-xl bg-danger/10 px-4 py-3 text-danger">
          Could not load categories: {error.message}
        </p>
      )}

      <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.id}`}
            className="group relative overflow-hidden rounded-[1.5rem] border border-line bg-cream/85 p-6 shadow-[var(--shadow)] transition duration-300 hover:-translate-y-1 hover:border-leaf/30"
          >
            <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-leaf transition duration-300 group-hover:scale-x-100" />
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-deep font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-leaf">
              {category.name.slice(0, 1)}
            </div>
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-ink">
              {category.name}
            </h2>
            <p className="mt-2 text-sm text-ink-soft">Browse items →</p>
          </Link>
        ))}
      </div>

      {categories.length === 0 && !error && (
        <p className="text-ink-soft">No categories yet. Seed them in Supabase.</p>
      )}
    </AppShell>
  );
}
