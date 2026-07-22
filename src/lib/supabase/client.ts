import { createBrowserClient } from "@supabase/ssr";

function getSupabaseEnv() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  // Users sometimes paste the REST path — the client needs the project root only.
  const url = rawUrl.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "");

  return { url, key };
}

export function createClient() {
  const { url, key } = getSupabaseEnv();

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them in Vercel → Settings → Environment Variables, then Redeploy.",
    );
  }

  return createBrowserClient(url, key);
}
