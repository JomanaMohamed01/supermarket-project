/**
 * Cleanup: remove related rows, then hard-delete an auth user by id or email.
 *
 * Usage (from supermarket-project folder):
 *   node scripts/delete-auth-user.mjs 55fa74e1-bb42-4aa2-b725-5da55a8532ee
 *   node scripts/delete-auth-user.mjs hala@gmail.com
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve("c:/Github/supermarket-project", ".env.local");
  const text = readFileSync(path, "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const target = process.argv[2];
if (!target) {
  console.error("Pass a user id or email.");
  process.exit(1);
}

const env = loadEnvLocal();
const url = (env.NEXT_PUBLIC_SUPABASE_URL || "")
  .replace(/\/rest\/v1\/?$/i, "")
  .replace(/\/$/, "");
const key = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId = target;

if (target.includes("@")) {
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) {
    console.error(error);
    process.exit(1);
  }
  const match = data.users.find(
    (u) => u.email?.toLowerCase() === target.toLowerCase(),
  );
  if (!match) {
    console.error("No auth user found with that email.");
    process.exit(1);
  }
  userId = match.id;
  console.log(`Found ${match.email} → ${userId}`);
}

const { data: orders, error: ordersError } = await admin
  .from("orders")
  .select("id")
  .eq("user_id", userId);
if (ordersError) {
  console.error(ordersError);
  process.exit(1);
}

const orderIds = (orders ?? []).map((o) => o.id);
console.log(`Orders to clear: ${orderIds.length}`);

if (orderIds.length > 0) {
  const { error: oiError } = await admin
    .from("order_items")
    .delete()
    .in("order_id", orderIds);
  if (oiError) {
    console.error("order_items delete failed:", oiError);
    process.exit(1);
  }

  const { error: oError } = await admin
    .from("orders")
    .delete()
    .eq("user_id", userId);
  if (oError) {
    console.error("orders delete failed:", oError);
    process.exit(1);
  }
}

await admin.from("cart_items").delete().eq("user_id", userId);
await admin.from("profiles").delete().eq("id", userId);

const { error: deleteError } = await admin.auth.admin.deleteUser(userId, false);
if (deleteError) {
  console.error("deleteUser failed:", deleteError);
  process.exit(1);
}

const { data: check } = await admin.auth.admin.getUserById(userId);
if (check?.user) {
  console.error("User still exists after delete.");
  process.exit(1);
}

console.log(`Hard-deleted auth user ${userId}`);
