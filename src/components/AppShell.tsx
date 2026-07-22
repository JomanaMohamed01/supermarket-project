import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let cartCount = 0;
  if (user) {
    const { data } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("user_id", user.id);
    cartCount = (data ?? []).reduce((sum, row) => sum + (row.quantity ?? 0), 0);
  }

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <SiteHeader cartCount={cartCount} email={user?.email} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      <footer className="border-t border-line/70 py-6 text-center text-sm text-ink-soft">
        FreshLane Market — shop by aisle, checkout in minutes.
      </footer>
    </div>
  );
}
