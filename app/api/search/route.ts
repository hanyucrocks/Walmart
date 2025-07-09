import { NextRequest, NextResponse } from "next/server";

// Mock product list
const products = [
  { id: "1", name: "Milk", price: 3.68, image: "/placeholder.svg?height=60&width=60" },
  { id: "2", name: "Bread", price: 1.98, image: "/placeholder.svg?height=60&width=60" },
  { id: "3", name: "Eggs", price: 2.78, image: "/placeholder.svg?height=60&width=60" },
  { id: "4", name: "Coffee", price: 8.98, image: "/placeholder.svg?height=60&width=60" },
  { id: "5", name: "Coca-Cola 12-pack", price: 4.98, image: "/placeholder.svg?height=60&width=60" },
  { id: "6", name: "Lay's Potato Chips", price: 2.98, image: "/placeholder.svg?height=60&width=60" },
  { id: "7", name: "Tide Laundry Detergent", price: 12.97, image: "/placeholder.svg?height=60&width=60" },
  { id: "8", name: "Great Value Organic Bananas", price: 2.48, image: "/placeholder.svg?height=60&width=60" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.toLowerCase() || "";
  if (!query) {
    return NextResponse.json({ products: [] });
  }
  const results = products.filter((p) => p.name.toLowerCase().includes(query));
  return NextResponse.json({ products: results });
} 