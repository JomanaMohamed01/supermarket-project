"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ActionLoader } from "@/components/ActionLoader";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setAddressError(null);
    setLoading(true);
    let keepAuthLoader = false;

    try {
      const supabase = createClient();

      if (mode === "signup") {
        if (!address.trim()) {
          setAddressError("This field must be filled");
          setLoading(false);
          return;
        }

        if (avatarFile) {
          if (!avatarFile.type.startsWith("image/")) {
            throw new Error("Profile picture must be an image.");
          }
          if (avatarFile.size > 5 * 1024 * 1024) {
            throw new Error("Profile picture must be under 5MB.");
          }
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (signUpError) throw signUpError;

        if (data.user) {
          let avatarUrl: string | null = null;

          if (avatarFile && data.session) {
            const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
            const path = `${data.user.id}/avatar.${ext}`;

            const { error: uploadError } = await supabase.storage
              .from("avatars")
              .upload(path, avatarFile, {
                upsert: true,
                contentType: avatarFile.type,
              });

            if (uploadError) throw uploadError;

            const {
              data: { publicUrl },
            } = supabase.storage.from("avatars").getPublicUrl(path);

            avatarUrl = `${publicUrl}?t=${Date.now()}`;
          }

          const { error: profileError } = await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: fullName || null,
            phone: phone || null,
            address: address.trim(),
            ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          });
          if (profileError) throw profileError;
        }

        keepAuthLoader = true;
      } else {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });
        if (signInError) throw signInError;

        const user = signInData.user;
        let welcomeName =
          (typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name.trim()
            : "") ||
          user.email?.split("@")[0] ||
          "";

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();
          if (profile?.full_name?.trim()) {
            welcomeName = profile.full_name.trim();
          }
        }

        if (welcomeName) {
          sessionStorage.setItem("freshlane_welcome_name", welcomeName);
        }

        keepAuthLoader = true;
        router.push("/categories?welcome=1");
        router.refresh();
        return;
      }

      router.push("/categories");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      if (!keepAuthLoader) {
        setLoading(false);
      }
    }
  }

  const isSignup = mode === "signup";
  const initials =
    fullName.trim().charAt(0).toUpperCase() ||
    email.trim().charAt(0).toUpperCase() ||
    "?";

  return (
    <>
      {loading && (
        <ActionLoader
          message={isSignup ? "Creating account..." : "Signing in..."}
        />
      )}

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
          {isSignup ? "Create a new account" : "Welcome back"}
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          {isSignup ? "Already shopping with us?" : "New here?"}{" "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-semibold text-leaf"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {isSignup && (
            <>
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-bg-deep text-xl font-semibold text-leaf">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-soft">
                    Profile picture
                  </p>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      setAvatarFile(e.target.files?.[0] ?? null)
                    }
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink transition hover:border-leaf/40"
                    >
                      {avatarFile ? "Change photo" : "Choose photo"}
                    </button>
                    {avatarFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarFile(null);
                          if (avatarInputRef.current) {
                            avatarInputRef.current.value = "";
                          }
                        }}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-soft transition hover:text-ink"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

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

              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-ink-soft">Phone number</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-3 outline-none ring-leaf/30 transition focus:ring-2"
                  placeholder="e.g. 05XXXXXXXX"
                  autoComplete="tel"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-ink-soft">Address</span>
                <input
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (addressError) setAddressError(null);
                  }}
                  className={`w-full rounded-xl border bg-white px-3.5 py-3 outline-none ring-leaf/30 transition focus:ring-2 ${
                    addressError ? "border-danger" : "border-line"
                  }`}
                  placeholder="Street, city"
                  autoComplete="street-address"
                />
                {addressError && (
                  <p className="text-sm font-medium text-danger">{addressError}</p>
                )}
              </label>
            </>
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-line bg-white py-3 pr-11 pl-3.5 outline-none ring-leaf/30 transition focus:ring-2"
                placeholder="At least 6 characters"
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((open) => !open)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-soft transition hover:text-ink"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" strokeWidth={2} />
                ) : (
                  <Eye className="h-5 w-5" strokeWidth={2} />
                )}
              </button>
            </div>
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
    </>
  );
}
