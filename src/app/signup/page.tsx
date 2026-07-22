import { AuthForm } from "@/components/AuthForm";
import { redirectIfAuthenticated } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/server";

export default async function SignupPage() {
  await redirectIfAuthenticated();

  if (!hasSupabaseEnv()) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4">
        <div className="w-full rounded-2xl border border-line bg-cream p-8 shadow-[var(--shadow)]">
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-ink">
            Setup needed
          </h1>
          <p className="mt-3 text-ink-soft">
            Supabase environment variables are missing on Vercel. Add{" "}
            <code className="text-leaf">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-leaf">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,
            then redeploy.
          </p>
        </div>
      </main>
    );
  }

  return <AuthForm mode="signup" />;
}
