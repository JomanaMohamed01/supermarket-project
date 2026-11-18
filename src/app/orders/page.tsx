import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { OrdersList, type OrderCard } from "@/components/OrdersList";
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
        <OrdersList
          orders={orders.map((order) => {
            const items = order.order_items ?? [];
            const card: OrderCard = {
              id: order.id,
              date: formatOrderDate(order.created_at),
              status: statusLabel(order.status),
              total: formatMoney(Number(order.total_amount)),
              items: items.map((item, index) => ({
                key: `${order.id}-${item.product_id ?? index}`,
                name: item.product_name,
                detail: `${item.quantity} × ${formatMoney(Number(item.unit_price))}`,
                lineTotal: formatMoney(Number(item.line_total)),
                imageUrl: item.product_id
                  ? (imageByProductId.get(item.product_id) ?? null)
                  : null,
              })),
            };
            return card;
          })}
        />
      )}
    </AppShell>
  );
}
