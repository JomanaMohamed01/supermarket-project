"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  async function signOut() {
    setMenuOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials =
    fullName?.trim()?.charAt(0)?.toUpperCase() ||
    email?.charAt(0)?.toUpperCase() ||
    "U";

  function itemClass(active: boolean) {
    return `block w-full rounded-xl px-3 py-2.5 text-left text-sm leading-5 font-semibold tracking-wide transition ${
      active
        ? "bg-bg-deep text-ink"
        : "text-ink hover:bg-bg-deep hover:text-leaf"
    }`;
  }

  return (
    <header className="relative z-10 border-b border-line/80 bg-cream">
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

        {email && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full border transition ${
                menuOpen || pathname.startsWith("/account")
                  ? "border-leaf ring-2 ring-leaf/25"
                  : "border-line hover:border-leaf/40"
              }`}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center rounded-full bg-bg-deep text-sm font-bold text-leaf">
                  {initials}
                </span>
              )}
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-citrus px-0.5 text-[9px] font-bold text-ink">
                  {cartCount}
                </span>
              )}
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-2 w-48 animate-fade rounded-2xl border border-line bg-cream p-2 shadow-[var(--shadow)]"
              >
                <Link
                  href="/categories"
                  role="menuitem"
                  className={itemClass(pathname.startsWith("/categories"))}
                  onClick={() => setMenuOpen(false)}
                >
                  Shop
                </Link>
                <Link
                  href="/cart"
                  role="menuitem"
                  className={itemClass(pathname.startsWith("/cart"))}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="flex items-center justify-between gap-3">
                    Cart
                    {cartCount > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-citrus px-1 text-[10px] font-bold text-ink">
                        {cartCount}
                      </span>
                    )}
                  </span>
                </Link>
                <Link
                  href="/account"
                  role="menuitem"
                  className={itemClass(pathname.startsWith("/account"))}
                  onClick={() => setMenuOpen(false)}
                >
                  My profile
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void signOut()}
                  className={itemClass(false)}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
