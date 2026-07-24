import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { WelcomeBanner } from "@/components/WelcomeBanner";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let cartCount = 0;
  let fullName: string | null = null;

  if (user) {
    const [{ data: cartRows }, { data: profile }] = await Promise.all([
      supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", user.id),
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    cartCount = (cartRows ?? []).reduce(
      (sum, row) => sum + (row.quantity ?? 0),
      0,
    );
    fullName =
      profile?.full_name?.trim() ||
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name.trim()
        : "") ||
      user.email?.split("@")[0] ||
      null;
  }

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <SiteHeader cartCount={cartCount} email={user?.email} />
      <Suspense fallback={null}>
        <WelcomeBanner name={fullName} />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      <footer className="border-t border-line/70 py-6 text-center text-sm text-ink-soft">
        FreshLane Market — shop by aisle, checkout in minutes.
      </footer>
    </div>
  );
}
