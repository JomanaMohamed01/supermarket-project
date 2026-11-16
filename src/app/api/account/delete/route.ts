import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders });
}

function errorMessage(err: unknown) {
  if (!err) return "Could not delete account";
  if (typeof err === "string") return err;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object") {
    const record = err as Record<string, unknown>;
    if (typeof record.message === "string" && record.message) return record.message;
    if (typeof record.msg === "string" && record.msg) return record.msg;
    if (typeof record.error === "string" && record.error) return record.error;
    try {
      const text = JSON.stringify(record);
      if (text && text !== "{}") return text;
    } catch {
      // ignore
    }
  }
  return "Could not delete account";
}

function getSupabaseUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  return rawUrl.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "");
}

async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  if (bearer) {
    const url = getSupabaseUrl();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
    if (!url || !anonKey) {
      throw new Error("Missing Supabase env for bearer auth");
    }

    const supabase = createSupabaseClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.auth.getUser(bearer);
    return { data: { user: data.user }, error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { data: { user: data.user }, error };
}

/** Remove DB rows that block auth.users deletion (FK: order_items → orders → auth.users). */
async function deleteUserData(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: orders, error: ordersError } = await admin
    .from("orders")
    .select("id")
    .eq("user_id", userId);
  if (ordersError) throw ordersError;

  const orderIds = (orders ?? []).map((order) => order.id as string);
  if (orderIds.length > 0) {
    const { error: orderItemsError } = await admin
      .from("order_items")
      .delete()
      .in("order_id", orderIds);
    if (orderItemsError) throw orderItemsError;

    const { error: deleteOrdersError } = await admin
      .from("orders")
      .delete()
      .eq("user_id", userId);
    if (deleteOrdersError) throw deleteOrdersError;
  }

  const { error: cartError } = await admin
    .from("cart_items")
    .delete()
    .eq("user_id", userId);
  if (cartError) throw cartError;

  const { error: profileError } = await admin
    .from("profiles")
    .delete()
    .eq("id", userId);
  if (profileError) throw profileError;

  try {
    const { data: files } = await admin.storage.from("avatars").list(userId);
    if (files && files.length > 0) {
      await admin.storage
        .from("avatars")
        .remove(files.map((file) => `${userId}/${file.name}`));
    }
  } catch (storageError) {
    console.error("delete account: storage", storageError);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const {
      data: { user },
      error: userError,
    } = await getAuthenticatedUser(request);

    if (userError || !user) {
      return json({ error: userError?.message || "Unauthorized" }, 401);
    }

    const admin = createAdminClient();
    const userId = user.id;

    await deleteUserData(admin, userId);

    const { error: deleteError } = await admin.auth.admin.deleteUser(
      userId,
      false,
    );
    if (deleteError) {
      console.error("delete account: auth.admin.deleteUser", deleteError);
      return json({ error: errorMessage(deleteError) }, 500);
    }

    const { data: stillThere, error: verifyError } =
      await admin.auth.admin.getUserById(userId);
    if (
      verifyError &&
      !/not\s*found|User not found/i.test(verifyError.message)
    ) {
      console.error("delete account: verify", verifyError);
      return json({ error: errorMessage(verifyError) }, 500);
    }
    if (stillThere?.user) {
      return json(
        {
          error:
            "Related data was removed, but the auth user is still present.",
        },
        500,
      );
    }

    return json({ ok: true });
  } catch (err) {
    console.error("delete account: unexpected", err);
    return json({ error: errorMessage(err) }, 500);
  }
}
