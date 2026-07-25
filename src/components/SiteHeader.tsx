"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SiteHeaderProps = {
  cartCount?: number;
  email?: string | null;
  avatarUrl?: string | null;
  fullName?: string | null;
};

export function SiteHeader({
  cartCount = 0,
  email,
  avatarUrl,
  fullName,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function signOut() {
    setMenuOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const linkClass = (href: string) =>
    `text-sm leading-5 font-semibold tracking-wide transition ${
      pathname.startsWith(href)
        ? "text-leaf"
        : "text-ink hover:text-leaf"
    }`;

  const mobileLinkClass = (href: string) =>
    `block rounded-xl px-3 py-3 text-sm leading-5 font-semibold tracking-wide transition ${
      pathname.startsWith(href)
        ? "bg-bg-deep text-leaf"
        : "text-ink hover:bg-bg-deep hover:text-leaf"
    }`;

  const initials =
    fullName?.trim()?.charAt(0)?.toUpperCase() ||
    email?.charAt(0)?.toUpperCase() ||
    "U";

  const accountAvatar = email ? (
    <Link
      href="/account"
      aria-label="My account"
      title="My account"
      className={`relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border transition ${
        pathname.startsWith("/account")
          ? "border-leaf ring-2 ring-leaf/25"
          : "border-line hover:border-leaf/40"
      }`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="grid h-full w-full place-items-center bg-bg-deep text-sm font-bold text-leaf">
          {initials}
        </span>
      )}
    </Link>
  ) : null;

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
            <a
              href="/login"
              className={linkClass("/__sign-out__")}
              onClick={(e) => {
                e.preventDefault();
                void signOut();
              }}
            >
              Sign out
            </a>
          )}
          {accountAvatar}
        </nav>

        {/* Mobile — 500px and below */}
        <div className="flex items-center gap-2 max-[500px]:flex min-[501px]:hidden">
          {accountAvatar}
          <div className="relative">
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
              <div className="absolute right-0 z-20 mt-2 flex w-44 animate-fade flex-col gap-1 rounded-2xl border border-line bg-cream p-2 shadow-[var(--shadow)]">
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
                    className="w-full rounded-xl px-3 py-3 text-left text-sm font-semibold tracking-wide text-ink transition hover:bg-bg-deep hover:text-leaf"
                  >
                    Sign out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
