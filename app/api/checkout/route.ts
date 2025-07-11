import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { userId, cartItems } = await request.json();

    // Enhanced input validation
    if (!userId || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: "Missing or invalid userId or cartItems" }, { status: 400 });
    }
    for (const item of cartItems) {
      if (
        !item.name ||
        typeof item.price !== "number" || item.price <= 0 ||
        typeof (item.quantity ?? 1) !== "number" || (item.quantity ?? 1) < 1
      ) {
        return NextResponse.json({ error: "Invalid product fields in cartItems" }, { status: 400 });
      }
    }

    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0);

    // Start transaction (using Supabase's RPC for atomicity)
    // Supabase JS does not support multi-table transactions directly, so we use a workaround
    // 1. Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({ user_id: userId, total })
      .select()
      .single();
    if (orderError || !order) {
      console.error("Order creation failed:", orderError);
      return NextResponse.json({ error: "Failed to create order", details: orderError?.message }, { status: 500 });
    }

    // 2. Insert purchase_history rows
    const purchases = cartItems.map((item) => ({
      user_id: userId,
      product_name: item.name || item.product_name, // Accept both
      product_category: item.product_category || "Unknown",
      price: item.price,
      quantity: item.quantity ?? 1,
      image: item.image || null,
      purchase_date: new Date().toISOString(),
      order_id: order.id,
    }));
    const { error: purchaseError } = await supabase.from("purchase_history").insert(purchases);
    if (purchaseError) {
      // Rollback: delete the order if purchases fail
      await supabase.from("orders").delete().eq("id", order.id);
      console.error("Purchase history insert failed:", purchaseError);
      return NextResponse.json({ error: "Failed to record purchases", details: purchaseError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Order placed successfully!",
      order: {
        id: order.id,
        total: order.total,
        status: order.status,
        created_at: order.created_at,
        items: purchases,
      },
    });
  } catch (err) {
    let errorMessage = "";
    if (err && typeof err === "object" && "message" in err) {
      errorMessage = (err as any).message;
    } else {
      errorMessage = String(err);
    }
    console.error("Checkout API error:", errorMessage);
    return NextResponse.json({ error: "Invalid request or server error", details: errorMessage }, { status: 500 });
  }
} 