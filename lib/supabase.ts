import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface UserProfile {
  id: string
  name: string
  email: string
  shopping_preferences: string[]
  dietary_restrictions: string[]
  household_size: number
  created_at: string
}

export interface PurchaseHistory {
  id: string
  user_id: string
  product_name: string
  product_category: string
  price: number
  quantity: number
  purchase_date: string
  frequency_score: number
}

export interface AIInsight {
  id: string
  user_id: string
  insight_type: "prediction" | "recommendation" | "deal"
  content: string
  confidence_score: number
  created_at: string
  is_active: boolean
}
