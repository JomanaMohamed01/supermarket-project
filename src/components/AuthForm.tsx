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

const SIGNUP_DRAFT_KEY = "freshlane_signup_draft";

type SignupDraft = {
  fullName: string;
  phone: string;
  address: string;
  email: string;
  avatarDataUrl?: string | null;
  avatarName?: string | null;
  avatarType?: string | null;
};

function dataUrlToFile(dataUrl: string, name: string, type: string) {
  const [header, base64] = dataUrl.split(",");
  if (!header || !base64) return null;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], name, { type });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read file"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

const ALLOWED_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "ymail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "zoho.com",
]);

const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.con": "gmail.com",
  "outlok.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outloook.com": "outlook.com",
  "outlo0k.com": "outlook.com",
  "outlokk.com": "outlook.com",
  "outlook.co": "outlook.com",
  "outlook.cm": "outlook.com",
  "outlook.con": "outlook.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
};

function getEmailDomain(value: string) {
  const at = value.lastIndexOf("@");
  if (at < 0) return "";
  return value.slice(at + 1).trim().toLowerCase();
}

function getEmailValidationError(value: string): string | null {
  const email = value.trim();
  const invalidMessage = "Email must be written correctly";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return invalidMessage;
  }

  const domain = getEmailDomain(email);
  if (!domain) {
    return invalidMessage;
  }

  if (COMMON_DOMAIN_TYPOS[domain]) {
    return invalidMessage;
  }

  if (!ALLOWED_EMAIL_DOMAINS.has(domain)) {
    return invalidMessage;
  }

  return null;
}

type PasswordStrength = "weak" | "medium" | "strong";

function getPasswordStrength(password: string): PasswordStrength | null {
  if (!password) return null;

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}

function passwordHasNumberAndSpecialChar(password: string) {
  return /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

const PASSWORD_STRENGTH_COPY: Record<
  PasswordStrength,
  { label: string; className: string }
> = {
  weak: { label: "Weak password", className: "text-danger" },
  medium: { label: "Medium password", className: "text-citrus" },
  strong: { label: "Strong password", className: "text-leaf" },
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
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [draftReady, setDraftReady] = useState(mode !== "signup");

  useEffect(() => {
    if (mode !== "signup") return;

    try {
      const raw = sessionStorage.getItem(SIGNUP_DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as SignupDraft;
        setFullName(draft.fullName ?? "");
        setPhone(draft.phone ?? "");
        setAddress(draft.address ?? "");
        setEmail(draft.email ?? "");

        if (draft.avatarDataUrl && draft.avatarName && draft.avatarType) {
          const file = dataUrlToFile(
            draft.avatarDataUrl,
            draft.avatarName,
            draft.avatarType,
          );
          if (file) setAvatarFile(file);
        }
      }
    } catch {
      sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
    } finally {
      setDraftReady(true);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "signup" || !draftReady) return;

    let cancelled = false;

    async function persistDraft() {
      const draft: SignupDraft = {
        fullName,
        phone,
        address,
        email,
        avatarDataUrl: null,
        avatarName: null,
        avatarType: null,
      };

      if (avatarFile) {
        try {
          draft.avatarDataUrl = await fileToDataUrl(avatarFile);
          draft.avatarName = avatarFile.name;
          draft.avatarType = avatarFile.type;
        } catch {
          // Keep text fields even if the avatar cannot be serialized.
        }
      }

      if (cancelled) return;

      const hasContent =
        Boolean(draft.fullName.trim()) ||
        Boolean(draft.phone.trim()) ||
        Boolean(draft.address.trim()) ||
        Boolean(draft.email.trim()) ||
        Boolean(draft.avatarDataUrl);

      if (hasContent) {
        sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft));
      } else {
        sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
      }
    }

    void persistDraft();

    return () => {
      cancelled = true;
    };
  }, [mode, draftReady, fullName, phone, address, email, avatarFile]);

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
    setFullNameError(null);
    setPhoneError(null);
    setAddressError(null);
    setEmailError(null);
    setPasswordError(null);
    setLoading(true);
    let keepAuthLoader = false;

    const requiredMessage = "This field needs to be filled";

    try {
      const supabase = createClient();

      if (mode === "signup") {
        let hasEmptyField = false;

        if (!fullName.trim()) {
          setFullNameError(requiredMessage);
          hasEmptyField = true;
        }
        if (!phone.trim()) {
          setPhoneError(requiredMessage);
          hasEmptyField = true;
        }
        if (!address.trim()) {
          setAddressError(requiredMessage);
          hasEmptyField = true;
        }
        if (!email.trim()) {
          setEmailError(requiredMessage);
          hasEmptyField = true;
        }
        if (!password) {
          setPasswordError(requiredMessage);
          hasEmptyField = true;
        }

        if (hasEmptyField) {
          setLoading(false);
          return;
        }

        const emailValidationError = getEmailValidationError(email);
        if (emailValidationError) {
          setEmailError(emailValidationError);
          setLoading(false);
          return;
        }

        if (!passwordHasNumberAndSpecialChar(password)) {
          setPasswordError(
            "The password must contain characters and numbers (ex: /, _, *, etc..)",
          );
          setLoading(false);
          return;
        }

        if (getPasswordStrength(password) !== "strong") {
          setPasswordError("Please choose a strong password");
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
            full_name: fullName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          });
          if (profileError) throw profileError;
        }

        sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
        keepAuthLoader = true;
      } else {
        let hasEmptyField = false;
        if (!email.trim()) {
          setEmailError(requiredMessage);
          hasEmptyField = true;
        }
        if (!password) {
          setPasswordError(requiredMessage);
          hasEmptyField = true;
        }
        if (hasEmptyField) {
          setLoading(false);
          return;
        }

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
  const passwordStrength = isSignup ? getPasswordStrength(password) : null;
  const passwordStrengthUi = passwordStrength
    ? PASSWORD_STRENGTH_COPY[passwordStrength]
    : null;
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
              className="font-semibold text-leaf underline-offset-2 hover:underline"
            >
              {isSignup ? "Sign in" : "Sign up"}
            </Link>
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
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
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fullNameError) setFullNameError(null);
                    }}
                    className={`w-full rounded-xl border bg-white px-3.5 py-3 outline-none ring-leaf/30 transition focus:ring-2 ${fullNameError ? "border-danger" : "border-line"
                      }`}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                  {fullNameError && (
                    <p className="text-sm font-medium text-danger">{fullNameError}</p>
                  )}
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-ink-soft">Phone number</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError(null);
                    }}
                    className={`w-full rounded-xl border bg-white px-3.5 py-3 outline-none ring-leaf/30 transition focus:ring-2 ${phoneError ? "border-danger" : "border-line"
                      }`}
                    placeholder="e.g. 05XXXXXXXX"
                    autoComplete="tel"
                  />
                  {phoneError && (
                    <p className="text-sm font-medium text-danger">{phoneError}</p>
                  )}
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-ink-soft">Address</span>
                  <input
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (addressError) setAddressError(null);
                    }}
                    className={`w-full rounded-xl border bg-white px-3.5 py-3 outline-none ring-leaf/30 transition focus:ring-2 ${addressError ? "border-danger" : "border-line"
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
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                className={`w-full rounded-xl border bg-white px-3.5 py-3 outline-none ring-leaf/30 transition focus:ring-2 ${emailError ? "border-danger" : "border-line"
                  }`}
                placeholder="you@email.com"
                autoComplete="email"
              />
              {emailError && (
                <p className="text-sm font-medium text-danger">{emailError}</p>
              )}
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-ink-soft">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                    if (error) setError(null);
                  }}
                  className={`w-full rounded-xl border bg-white py-3 pr-11 pl-3.5 outline-none ring-leaf/30 transition focus:ring-2 ${passwordError ? "border-danger" : "border-line"
                    }`}
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
              {passwordError && (
                <p className="text-sm font-medium text-danger">{passwordError}</p>
              )}
              {!passwordError && passwordStrengthUi && (
                <p className={`text-sm font-medium ${passwordStrengthUi.className}`}>
                  {passwordStrengthUi.label}
                </p>
              )}
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
