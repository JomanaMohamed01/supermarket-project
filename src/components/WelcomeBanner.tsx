"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type WelcomeBannerProps = {
  name: string | null;
};

function firstName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function WelcomeBanner({ name }: WelcomeBannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<"hidden" | "in" | "out">("hidden");
  const [displayName, setDisplayName] = useState(
    name ? firstName(name) : "",
  );

  const shouldWelcome = searchParams.get("welcome") === "1";

  useEffect(() => {
    const stored = sessionStorage.getItem("freshlane_welcome_name");
    if (stored?.trim()) {
      setDisplayName(firstName(stored));
      sessionStorage.removeItem("freshlane_welcome_name");
      return;
    }
    if (name?.trim()) {
      setDisplayName(firstName(name));
    }
  }, [name]);

  useEffect(() => {
    if (!shouldWelcome) return;

    setPhase("in");

    const exitTimer = setTimeout(() => setPhase("out"), 3500);
    const hideTimer = setTimeout(() => {
      setPhase("hidden");
      const params = new URLSearchParams(searchParams.toString());
      params.delete("welcome");
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }, 4000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [shouldWelcome, pathname, router, searchParams]);

  if (phase === "hidden" || !displayName) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[110] flex justify-center px-4 pt-4 sm:pt-5">
      <div
        role="status"
        className={`welcome-toast rounded-2xl border border-leaf/20 bg-leaf px-5 py-3 text-sm font-semibold text-cream shadow-[var(--shadow)] sm:text-base ${phase === "in" ? "welcome-toast-in" : "welcome-toast-out"
          }`}
      >
        Welcome back, {displayName}!
      </div>
    </div>
  );
}
