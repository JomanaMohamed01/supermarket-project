"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { ProductImage } from "@/components/ProductImage";

export type OrderCardItem = {
  key: string;
  name: string;
  detail: string;
  lineTotal: string;
  imageUrl: string | null;
};

export type OrderCard = {
  id: string;
  date: string;
  status: string;
  total: string;
  items: OrderCardItem[];
};

export function OrdersList({ orders }: { orders: OrderCard[] }) {
  const [openIds, setOpenIds] = useState<string[]>([]);

  function toggle(id: string) {
    setOpenIds((current) =>
      current.includes(id)
        ? current.filter((openId) => openId !== id)
        : [...current, id],
    );
  }

  return (
    <div className="space-y-5">
      {orders.map((order) => {
        const open = openIds.includes(order.id);
        return (
          <article
            key={order.id}
            className="rounded-[1.5rem] border border-line bg-cream/90 shadow-[var(--shadow)]"
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() => toggle(order.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
            >
              <div className="min-w-0">
                <p className="text-sm text-ink-soft">{order.date}</p>
                <p className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-ink">
                  {order.total}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-3">
                <span className="rounded-full bg-bg-deep px-3 py-1 text-xs font-semibold tracking-wide text-leaf uppercase">
                  {order.status}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-ink transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </span>
            </button>

            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <div className="px-5 pt-1 pb-5 sm:px-6">
                  {order.items.length > 0 ? (
                    <ul className="space-y-4">
                      {order.items.map((item) => (
                        <li
                          key={item.key}
                          className="flex items-center justify-between gap-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <ProductImage
                              name={item.name}
                              imageUrl={item.imageUrl}
                              size="row"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-ink">{item.name}</p>
                              <p className="text-sm text-ink-soft">{item.detail}</p>
                            </div>
                          </div>
                          <p className="shrink-0 font-semibold text-ink">
                            {item.lineTotal}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink-soft">
                      This order has no saved items.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
