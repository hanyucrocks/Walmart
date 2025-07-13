import { NextRequest, NextResponse } from "next/server";

// Mock product list
const products = [
  { id: "1", product_name: "Milk", price: 3.68, image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=60&h=60&fit=crop&crop=center", product_category: "Dairy" },
  { id: "2", product_name: "Bread", price: 1.98, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=60&h=60&fit=crop&crop=center", product_category: "Bakery" },
  { id: "3", product_name: "Eggs", price: 2.78, image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=60&h=60&fit=crop&crop=center", product_category: "Dairy" },
  { id: "4", product_name: "Coffee", price: 8.98, image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=60&h=60&fit=crop&crop=center", product_category: "Beverages" },
  { id: "5", product_name: "Coca-Cola 12-pack", price: 4.98, image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=60&h=60&fit=crop&crop=center", product_category: "Beverages" },
  { id: "6", product_name: "Lay's Potato Chips", price: 2.98, image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=60&h=60&fit=crop&crop=center", product_category: "Snacks" },
  { id: "7", product_name: "Tide Laundry Detergent", price: 12.97, image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=60&h=60&fit=crop&crop=center", product_category: "Household" },
  { id: "8", product_name: "Great Value Organic Bananas", price: 2.48, image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=60&h=60&fit=crop&crop=center", product_category: "Produce" },
  { id: "9", product_name: "iPhone 16", price: 999.99, image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=60&h=60&fit=crop&crop=center", product_category: "Electronics" },
  { id: "10", product_name: "iPhone Case", price: 19.99, image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=60&h=60&fit=crop&crop=center", product_category: "Electronics" },
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