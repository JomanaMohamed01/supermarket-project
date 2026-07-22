import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CategoryProductsPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!category) notFound();

  const typedCategory = category as Category;

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", id)
    .order("name", { ascending: true });

  const list = (products ?? []) as Product[];

  return (
    <AppShell>
      <div className="animate-rise mb-8">
        <Link
          href="/categories"
          className="text-sm font-semibold text-leaf hover:underline"
        >
          ← All aisles
        </Link>
        <h1 className="mt-3 font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-ink">
          {typedCategory.name}
        </h1>
        <p className="mt-2 text-ink-soft">
          Choose items to add to your shopping cart.
        </p>
      </div>

      {error && (
        <p className="mb-6 rounded-xl bg-danger/10 px-4 py-3 text-danger">
          {error.message}
        </p>
      )}

      <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((product) => (
          <article
            key={product.id}
            className="flex flex-col justify-between border-b border-line pb-5"
          >
            <div>
              <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-ink">
                {product.name}
              </h2>
              {product.description && (
                <p className="mt-2 text-sm text-ink-soft">{product.description}</p>
              )}
              <p className="mt-4 text-lg font-semibold text-leaf">
                {formatMoney(Number(product.price))}
                {product.unit ? (
                  <span className="ml-1 text-sm font-medium text-ink-soft">
                    / {product.unit}
                  </span>
                ) : null}
              </p>
            </div>
            <div className="mt-5">
              <AddToCartButton productId={product.id} />
            </div>
          </article>
        ))}
      </div>

      {list.length === 0 && !error && (
        <p className="text-ink-soft">No products in this aisle yet.</p>
      )}
    </AppShell>
  );
}
