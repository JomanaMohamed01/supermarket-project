"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 610px)");
    function onChange() {
      if (!query.matches) setMenuOpen(false);
    }
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      setMenuVisible(true);
      return;
    }

    const timer = setTimeout(() => setMenuVisible(false), 450);
    return () => clearTimeout(timer);
  }, [menuOpen]);

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

  useEffect(() => {
    if (!confirmSignOut) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !signingOut) setConfirmSignOut(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [confirmSignOut, signingOut]);

  async function signOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setMenuOpen(false);
      setConfirmSignOut(false);
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const initials =
    fullName?.trim()?.charAt(0)?.toUpperCase() ||
    email?.charAt(0)?.toUpperCase() ||
    "U";

  function navClass(active: boolean) {
    return `font-semibold tracking-wide whitespace-nowrap transition ${active ? "text-leaf" : "text-ink hover:text-leaf"
      }`;
  }

  function itemClass(_active: boolean, divided = true) {
    return `relative block w-full bg-transparent px-3.5 py-4 text-left text-sm leading-5 font-semibold tracking-wide text-ink transition hover:bg-transparent hover:text-leaf ${divided
        ? "after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-line after:content-['']"
        : ""
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
          <div className="ml-auto flex items-center gap-2 min-[611px]:gap-10">
            <nav
              aria-label="Account"
              className="hidden items-center gap-3.5 text-[13px] min-[611px]:flex min-[611px]:gap-6"
            >
              <Link
                href="/categories"
                className={navClass(pathname.startsWith("/categories"))}
              >
                Shop
              </Link>
              <Link
                href="/cart"
                className={navClass(pathname.startsWith("/cart"))}
              >
                <span className="inline-flex items-center gap-1.5">
                  My cart
                  {cartCount > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-citrus px-1 text-[10px] font-bold text-ink">
                      {cartCount}
                    </span>
                  )}
                </span>
              </Link>
              <Link
                href="/orders"
                className={navClass(pathname.startsWith("/orders"))}
              >
                My orders
              </Link>
              <button
                type="button"
                onClick={() => setConfirmSignOut(true)}
                className={navClass(false)}
              >
                Sign out
              </button>
            </nav>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-label={menuOpen ? "Account menu" : "My profile"}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => {
                  if (window.matchMedia("(min-width: 611px)").matches) {
                    router.push("/account");
                    return;
                  }
                  setMenuOpen((open) => !open);
                }}
                className={`relative grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border transition ${
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
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-citrus px-0.5 text-[9px] font-bold text-ink min-[611px]:hidden">
                    {cartCount}
                  </span>
                )}
              </button>

              {menuVisible && (
                <div
                  role="menu"
                  className={`absolute right-0 z-20 mt-2 flex w-48 flex-col overflow-hidden rounded-2xl border border-line bg-cream shadow-[var(--shadow)] min-[611px]:hidden ${menuOpen
                      ? "animate-fade"
                      : "pointer-events-none animate-fade-out"
                    }`}
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
                      My cart
                      {cartCount > 0 && (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-citrus px-1 text-[10px] font-bold text-ink">
                          {cartCount}
                        </span>
                      )}
                    </span>
                  </Link>
                  <Link
                    href="/orders"
                    role="menuitem"
                    className={itemClass(pathname.startsWith("/orders"))}
                    onClick={() => setMenuOpen(false)}
                  >
                    My orders
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
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmSignOut(true);
                    }}
                    className={itemClass(false, false)}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {portalReady &&
        confirmSignOut &&
        createPortal(
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-ink/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-out-title"
            onClick={() => {
              if (!signingOut) setConfirmSignOut(false);
            }}
          >
            <div
              className="animate-fade w-full max-w-sm rounded-[1.5rem] border border-line bg-cream p-6 shadow-[var(--shadow)] sm:p-7"
              onClick={(event) => event.stopPropagation()}
            >
              <h2
                id="sign-out-title"
                className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-ink"
              >
                Do you want to sign out?
              </h2>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={() => setConfirmSignOut(false)}
                  className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-bg-deep disabled:opacity-60"
                >
                  No
                </button>
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={() => void signOut()}
                  className="rounded-xl bg-leaf px-4 py-3 text-sm font-semibold text-cream transition hover:bg-leaf-bright disabled:opacity-60"
                >
                  {signingOut ? "Signing out..." : "Yes"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
