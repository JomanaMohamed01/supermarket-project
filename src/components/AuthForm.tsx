"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (signUpError) throw signUpError;

        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: fullName || null,
          });
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      router.push("/categories");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const isSignup = mode === "signup";

  return (
    <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:px-6">
      <section className="animate-rise relative overflow-hidden rounded-[2rem] bg-leaf px-8 py-12 text-cream shadow-[var(--shadow)] sm:px-12">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-citrus/30 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-cream/10 blur-3xl" />
        <p className="brand-mark mb-6 inline-flex rounded-full bg-cream/15 px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase">
          FreshLane
        </p>
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl leading-tight font-semibold sm:text-5xl">
          Groceries from every aisle, ready for your cart.
        </h1>
        <p className="mt-4 max-w-md text-base text-cream/85">
          Sign {isSignup ? "up" : "in"} to browse meat, produce, dairy, pantry
          staples, and more — then checkout when you&apos;re ready.
        </p>
      </section>

      <section className="animate-fade mx-auto w-full max-w-md rounded-[1.75rem] border border-line bg-cream/90 p-8 shadow-[var(--shadow)] backdrop-blur">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-ink">
          {isSignup ? "Create account" : "Welcome back"}
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          {isSignup ? "Already shopping with us?" : "New here?"}{" "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-semibold text-leaf underline-offset-2 hover:underline"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {isSignup && (
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-ink-soft">Full name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-3.5 py-3 outline-none ring-leaf/30 transition focus:ring-2"
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink-soft">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3.5 py-3 outline-none ring-leaf/30 transition focus:ring-2"
              placeholder="you@email.com"
              autoComplete="email"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink-soft">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3.5 py-3 outline-none ring-leaf/30 transition focus:ring-2"
              placeholder="At least 6 characters"
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
          </label>

          {error && (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-leaf px-4 py-3.5 font-semibold text-cream transition hover:bg-leaf-bright disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : isSignup
                ? "Create account"
                : "Sign in"}
          </button>
        </form>
      </section>
    </div>
  );
}
