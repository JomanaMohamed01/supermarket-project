import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ProductImage } from "@/components/ProductImage";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";

type OrderItemRow = {
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

type OrderRow = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItemRow[] | null;
};

function formatOrderDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status: string) {
  const trimmed = status.trim();
  if (!trimmed) return "Saved";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export default async function OrdersPage() {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, total_amount, created_at, order_items(product_id, product_name, unit_price, quantity, line_total)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as OrderRow[];
  const productIds = [
    ...new Set(
      orders.flatMap((order) =>
        (order.order_items ?? [])
          .map((item) => item.product_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ),
  ];

  const imageByProductId = new Map<string, string | null>();
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, image_url")
      .in("id", productIds);

    for (const product of products ?? []) {
      imageByProductId.set(product.id, product.image_url);
    }
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm font-semibold tracking-[0.16em] text-leaf uppercase">
          Orders
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-ink">
          My orders
        </h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          Every order you have placed since you created your account.
        </p>
      </div>

      {error && (
        <p className="mb-6 rounded-xl bg-danger/10 px-4 py-3 text-danger">
          {error.message}
        </p>
      )}

      {!error && orders.length === 0 && (
        <div className="rounded-[1.5rem] border border-dashed border-line bg-cream/60 px-6 py-14 text-center">
          <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-ink">
            No orders yet
          </h2>
          <p className="mt-2 text-ink-soft">
            When you check out, your orders will be kept here.
          </p>
          <Link
            href="/categories"
            className="mt-6 inline-flex rounded-xl bg-leaf px-5 py-3 font-semibold text-cream transition hover:bg-leaf-bright"
          >
            Browse aisles
          </Link>
        </div>
      )}

      {orders.length > 0 && (
        <div className="space-y-5">
          {orders.map((order) => {
            const items = order.order_items ?? [];
            return (
              <article
                key={order.id}
                className="rounded-[1.5rem] border border-line bg-cream/90 p-5 shadow-[var(--shadow)] sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <p className="text-sm text-ink-soft">
                      {formatOrderDate(order.created_at)}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-ink">
                      {formatMoney(Number(order.total_amount))}
                    </p>
                  </div>
                  <span className="rounded-full bg-bg-deep px-3 py-1 text-xs font-semibold tracking-wide text-leaf uppercase">
                    {statusLabel(order.status)}
                  </span>
                </div>

                {items.length > 0 ? (
                  <ul className="mt-4 space-y-4">
                    {items.map((item, index) => (
                      <li
                        key={`${order.id}-${item.product_id ?? index}`}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <ProductImage
                            name={item.product_name}
                            imageUrl={
                              item.product_id
                                ? imageByProductId.get(item.product_id)
                                : null
                            }
                            size="row"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-ink">
                              {item.product_name}
                            </p>
                            <p className="text-sm text-ink-soft">
                              {item.quantity} × {formatMoney(Number(item.unit_price))}
                            </p>
                          </div>
                        </div>
                        <p className="shrink-0 font-semibold text-ink">
                          {formatMoney(Number(item.line_total))}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-ink-soft">
                    This order has no saved items.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
