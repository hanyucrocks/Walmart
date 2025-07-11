import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/cart?userId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  const { data: items, error } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items });
}

// POST /api/cart/add
export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    console.error("/api/cart POST: Failed to parse JSON", e);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { action, userId, item } = body;
  console.log("/api/cart POST body:", body);
  if (!userId || !action) {
    console.error("/api/cart POST: Missing userId or action", body);
    return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
  }
  if (action === "add") {
    if (!item || !item.name || typeof item.price !== "number") {
      console.error("/api/cart POST: Missing or invalid item fields", item);
      return NextResponse.json({ error: "Missing or invalid item fields" }, { status: 400 });
    }
    // Check if item already in cart
    const { data: existing, error: existingError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("name", item.name)
      .maybeSingle();
    if (existingError) {
      console.error("/api/cart POST: Error checking existing item", existingError);
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
    if (existing) {
      // Increment quantity
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + (item.quantity || 1) })
        .eq("id", existing.id);
      if (error) {
        console.error("/api/cart POST: Error updating quantity", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    } else {
      // Insert new item
      const { error } = await supabase.from("cart_items").insert({
        user_id: userId,
        product_id: item.product_id || null,
        name: item.name,
        price: item.price,
        image: item.image || null,
        quantity: item.quantity || 1,
      });
      if (error) {
        console.error("/api/cart POST: Error inserting new item", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }
  } else if (action === "remove") {
    if (!item || !item.name) {
      return NextResponse.json({ error: "Missing item name" }, { status: 400 });
    }
    // Remove or decrement quantity
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("name", item.name)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
    }
    if (existing.quantity > 1) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity - 1 })
        .eq("id", existing.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    } else {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", existing.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }
  } else if (action === "clear") {
    // Clear all items for user
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
} 