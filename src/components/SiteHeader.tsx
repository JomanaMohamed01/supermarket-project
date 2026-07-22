"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SiteHeaderProps = {
  cartCount?: number;
  email?: string | null;
};

export function SiteHeader({ cartCount = 0, email }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function signOut() {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const linkClass = (href: string) =>
    `text-sm font-semibold tracking-wide transition ${
      pathname.startsWith(href)
        ? "text-leaf"
        : "text-ink-soft hover:text-ink"
    }`;

  const mobileLinkClass = (href: string) =>
    `block rounded-xl px-3 py-3 text-sm font-semibold transition ${
      pathname.startsWith(href)
        ? "bg-bg-deep text-leaf"
        : "text-ink-soft hover:bg-bg-deep hover:text-ink"
    }`;

  return (
    <header className="relative z-10 border-b border-line/80 bg-cream/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/categories" className="group flex items-center gap-3">
          <span className="brand-mark grid h-10 w-10 place-items-center rounded-2xl bg-leaf text-lg font-bold text-cream shadow-[var(--shadow)]">
            F
          </span>
          <div>
            <p className="font-[family-name:var(--font-fraunces)] text-xl font-semibold leading-none text-ink">
              FreshLane
            </p>
            <p className="mt-1 text-xs text-ink-soft">Market aisle, online</p>
          </div>
        </Link>

        {/* Desktop / tablet nav — above 500px */}
        <nav className="hidden items-center gap-4 min-[501px]:flex sm:gap-6">
          <Link href="/categories" className={linkClass("/categories")}>
            Shop
          </Link>
          <Link href="/cart" className={`${linkClass("/cart")} relative`}>
            Cart
            {cartCount > 0 && (
              <span className="absolute -right-3 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-citrus px-1 text-[10px] font-bold text-ink">
                {cartCount}
              </span>
            )}
          </Link>
          {email && (
            <button
              type="button"
              onClick={signOut}
              className="text-sm font-semibold text-ink-soft transition hover:text-ink"
            >
              Sign out
            </button>
          )}
        </nav>

        {/* Mobile menu — 500px and below */}
        <div className="relative max-[500px]:block min-[501px]:hidden">
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-cream text-ink transition hover:border-leaf/40"
          >
            <span className="sr-only">Menu</span>
            <span className="flex w-4 flex-col gap-1">
              <span
                className={`h-0.5 w-full rounded-full bg-ink transition ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`}
              />
              <span
                className={`h-0.5 w-full rounded-full bg-ink transition ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`h-0.5 w-full rounded-full bg-ink transition ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`}
              />
            </span>
            {cartCount > 0 && !menuOpen && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-citrus px-0.5 text-[9px] font-bold text-ink">
                {cartCount}
              </span>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-44 animate-fade rounded-2xl border border-line bg-cream p-2 shadow-[var(--shadow)]">
              <Link
                href="/categories"
                className={mobileLinkClass("/categories")}
                onClick={() => setMenuOpen(false)}
              >
                Shop
              </Link>
              <Link
                href="/cart"
                className={mobileLinkClass("/cart")}
                onClick={() => setMenuOpen(false)}
              >
                Cart
                {cartCount > 0 ? ` (${cartCount})` : ""}
              </Link>
              {email && (
                <button
                  type="button"
                  onClick={signOut}
                  className="mt-1 w-full rounded-xl px-3 py-3 text-left text-sm font-semibold text-ink-soft transition hover:bg-bg-deep hover:text-ink"
                >
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
