import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: userError?.message || "Unauthorized" },
        { status: 401 },
      );
    }

    const admin = createAdminClient();
    const userId = user.id;

    // Remove related data first so auth delete is not blocked by FKs
    const { data: orders } = await admin
      .from("orders")
      .select("id")
      .eq("user_id", userId);

    const orderIds = (orders ?? []).map((order) => order.id as string);
    if (orderIds.length > 0) {
      await admin.from("order_items").delete().in("order_id", orderIds);
      await admin.from("orders").delete().eq("user_id", userId);
    }

    await admin.from("cart_items").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("id", userId);

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

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("delete account: auth.admin.deleteUser", deleteError);
      return NextResponse.json(
        { error: errorMessage(deleteError) },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete account: unexpected", err);
    return NextResponse.json(
      { error: errorMessage(err) },
      { status: 500 },
    );
  }
}
