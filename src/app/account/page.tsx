import { AppShell } from "@/components/AppShell";
import { AccountClient } from "@/components/AccountClient";
import { requireUser } from "@/lib/auth";

export default async function AccountPage() {
  const { supabase, user } = await requireUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, phone, address, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm font-semibold tracking-[0.16em] text-leaf uppercase">
          Account
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-ink">
          My account
        </h1>
        <p className="mt-2 text-ink-soft">
          View your details, update your address, and add a profile picture.
        </p>
      </div>

      {error && (
        <p className="mb-6 rounded-xl bg-danger/10 px-4 py-3 text-danger">
          {error.message}
        </p>
      )}

      <AccountClient
        profile={{
          userId: user.id,
          email: user.email ?? "",
          fullName:
            profile?.full_name ??
            (typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : null),
          phone: profile?.phone ?? null,
          address: profile?.address ?? null,
          avatarUrl: profile?.avatar_url ?? null,
        }}
      />
    </AppShell>
  );
}
