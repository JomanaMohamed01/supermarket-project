import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  return rawUrl.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "");
}

export function createAdminClient() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  if (key.startsWith("sb_secret_")) {
    throw new Error(
      "Use the Legacy service_role key (starts with eyJ...), not the new sb_secret_ key. Find it in Supabase → Project Settings → API → Legacy API Keys.",
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
