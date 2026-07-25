"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ActionLoader } from "@/components/ActionLoader";
import { createClient } from "@/lib/supabase/client";

export type AccountProfile = {
  fullName: string | null;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  email: string;
  userId: string;
};

type AccountClientProps = {
  profile: AccountProfile;
};

export function AccountClient({ profile }: AccountClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [address, setAddress] = useState(profile.address ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [savingAddress, setSavingAddress] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!confirmDeleteOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [confirmDeleteOpen]);

  const initials =
    profile.fullName?.trim()?.charAt(0)?.toUpperCase() ||
    profile.email.charAt(0).toUpperCase();

  async function saveAddress(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setAddressError(null);

    if (!address.trim()) {
      setAddressError("This field must be filled");
      return;
    }

    setSavingAddress(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ address: address.trim() })
        .eq("id", profile.userId);

      if (updateError) throw updateError;

      setMessage("Address updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update address");
    } finally {
      setSavingAddress(false);
    }
  }

  async function onAvatarChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    setMessage(null);
    setError(null);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${profile.userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const nextUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: nextUrl })
        .eq("id", profile.userId);

      if (updateError) throw updateError;

      setAvatarUrl(nextUrl);
      setMessage("Profile picture updated.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not upload profile picture",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function deleteAccount() {
    setConfirmDeleteOpen(false);
    setDeletingAccount(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/account/delete", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as {
        error?: unknown;
        ok?: boolean;
      } | null;

      if (!response.ok) {
        const raw = payload?.error;
        const message =
          typeof raw === "string" && raw.trim()
            ? raw
            : raw && typeof raw === "object"
              ? JSON.stringify(raw)
              : `Could not delete account (${response.status})`;
        throw new Error(message === "{}" ? `Could not delete account (${response.status})` : message);
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/signup");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account");
      setDeletingAccount(false);
      setConfirmDeleteOpen(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      {deletingAccount && <ActionLoader message="Deleting account..." />}
      <div className="rounded-[1.5rem] border border-line bg-cream/90 p-6 shadow-[var(--shadow)] sm:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative">
            <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-full border border-line bg-bg-deep text-3xl font-semibold text-leaf">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-ink">
              {profile.fullName?.trim() || "Your profile"}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Upload a photo so it shows on your account.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-leaf px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-leaf-bright disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Change photo"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-line bg-cream/90 p-6 shadow-[var(--shadow)] sm:p-8">
        <h3 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-ink">
          Account details
        </h3>
        <dl className="mt-5 space-y-4">
          <div>
            <dt className="text-sm font-semibold text-ink-soft">Full name</dt>
            <dd className="mt-1 text-ink">{profile.fullName?.trim() || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-ink-soft">Phone</dt>
            <dd className="mt-1 text-ink">{profile.phone?.trim() || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-ink-soft">Email</dt>
            <dd className="mt-1 text-ink">{profile.email}</dd>
          </div>
        </dl>
      </div>

      <form
        onSubmit={saveAddress}
        className="rounded-[1.5rem] border border-line bg-cream/90 p-6 shadow-[var(--shadow)] sm:p-8"
      >
        <h3 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-ink">
          Delivery address
        </h3>
        <p className="mt-1 text-sm text-ink-soft">
          Update where your orders should be delivered.
        </p>

        <label className="mt-5 block space-y-1.5">
          <span className="text-sm font-semibold text-ink-soft">Address</span>
          <textarea
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (addressError) setAddressError(null);
            }}
            rows={3}
            className={`w-full resize-none rounded-xl border bg-white px-3.5 py-3 outline-none ring-leaf/30 transition focus:ring-2 ${
              addressError ? "border-danger" : "border-line"
            }`}
            placeholder="Street, city"
          />
          {addressError && (
            <p className="text-sm font-medium text-danger">{addressError}</p>
          )}
        </label>

        <button
          type="submit"
          disabled={savingAddress}
          className="mt-4 w-full rounded-xl bg-leaf px-4 py-3.5 font-semibold text-cream transition hover:bg-leaf-bright disabled:opacity-60 sm:w-auto sm:px-6"
        >
          {savingAddress ? "Saving..." : "Save address"}
        </button>
      </form>

      {message && (
        <p className="rounded-xl bg-leaf/10 px-4 py-3 text-sm font-semibold text-leaf">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="rounded-[1.5rem] border border-danger/25 bg-cream/90 p-6 shadow-[var(--shadow)] sm:p-8">
        <h3 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-danger">
          Delete account
        </h3>
        <p className="mt-2 text-sm text-ink-soft">
          Permanently delete your account, cart, and profile data. This cannot
          be undone.
        </p>
        <button
          type="button"
          disabled={deletingAccount}
          onClick={() => setConfirmDeleteOpen(true)}
          className="mt-5 w-full rounded-xl border border-danger bg-danger px-4 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60 sm:w-auto sm:px-6"
        >
          Delete my account
        </button>
      </div>

      {portalReady &&
        confirmDeleteOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-ink/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            onClick={() => {
              if (!deletingAccount) setConfirmDeleteOpen(false);
            }}
          >
            <div
              className="animate-fade w-full max-w-md rounded-[1.5rem] border border-line bg-cream p-6 shadow-[var(--shadow)] sm:p-7"
              onClick={(e) => e.stopPropagation()}
            >
              <h4
                id="delete-account-title"
                className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-ink"
              >
                Delete your account?
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                This will permanently remove your profile, cart, and account
                access. You won&apos;t be able to undo this.
              </p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={deletingAccount}
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-bg-deep disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingAccount}
                  onClick={deleteAccount}
                  className="rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {deletingAccount ? "Deleting..." : "Yes, delete account"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
