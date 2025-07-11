import { NextRequest, NextResponse } from "next/server";

// Mock product list
const products = [
  { id: "1", product_name: "Milk", price: 3.68, image: "/placeholder.svg?height=60&width=60", product_category: "Dairy" },
  { id: "2", product_name: "Bread", price: 1.98, image: "/placeholder.svg?height=60&width=60", product_category: "Bakery" },
  { id: "3", product_name: "Eggs", price: 2.78, image: "/placeholder.svg?height=60&width=60", product_category: "Dairy" },
  { id: "4", product_name: "Coffee", price: 8.98, image: "/placeholder.svg?height=60&width=60", product_category: "Beverages" },
  { id: "5", product_name: "Coca-Cola 12-pack", price: 4.98, image: "/placeholder.svg?height=60&width=60", product_category: "Beverages" },
  { id: "6", product_name: "Lay's Potato Chips", price: 2.98, image: "/placeholder.svg?height=60&width=60", product_category: "Snacks" },
  { id: "7", product_name: "Tide Laundry Detergent", price: 12.97, image: "/placeholder.svg?height=60&width=60", product_category: "Household" },
  { id: "8", product_name: "Great Value Organic Bananas", price: 2.48, image: "/placeholder.svg?height=60&width=60", product_category: "Produce" },
  { id: "9", product_name: "iPhone 16", price: 999.99, image: "/placeholder-iphone16.jpg", product_category: "Electronics" },
  { id: "10", product_name: "iPhone Case", price: 19.99, image: "/placeholder-case.jpg", product_category: "Electronics" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.toLowerCase() || "";
  if (!query) {
    return NextResponse.json({ products: [] });
  }
  const results = products.filter((p) => p.product_name.toLowerCase().includes(query));
  return NextResponse.json({ products: results });
} 