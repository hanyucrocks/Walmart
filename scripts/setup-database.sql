-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  shopping_preferences TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}',
  household_size INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase history table
CREATE TABLE IF NOT EXISTS purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  frequency_score DECIMAL(3,2) DEFAULT 0.0
);

-- Create AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  insight_type TEXT CHECK (insight_type IN ('prediction', 'recommendation', 'deal')),
  content JSONB NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Add location to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS location TEXT;

-- Create favorites table for user-product favorites
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_history_user_date ON purchase_history(user_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_type ON ai_insights(user_id, insight_type, is_active);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- Insert sample data
INSERT INTO user_profiles (id, name, email, shopping_preferences, dietary_restrictions, household_size) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Sarah Johnson',
  'sarah@example.com',
  ARRAY['organic', 'healthy', 'quick-meals'],
  ARRAY['gluten-free'],
  3
) ON CONFLICT (email) DO NOTHING;

-- Insert sample purchase history
INSERT INTO purchase_history (user_id, product_name, product_category, price, quantity, purchase_date, frequency_score) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Great Value Organic Bananas', 'Produce', 2.48, 1, NOW() - INTERVAL '3 days', 0.95),
('550e8400-e29b-41d4-a716-446655440000', 'Tide Laundry Detergent', 'Household', 12.97, 1, NOW() - INTERVAL '2 weeks', 0.75),
('550e8400-e29b-41d4-a716-446655440000', 'Honey Nut Cheerios', 'Breakfast', 4.98, 1, NOW() - INTERVAL '1 week', 0.85),
('550e8400-e29b-41d4-a716-446655440000', 'Whole Milk', 'Dairy', 3.68, 1, NOW() - INTERVAL '4 days', 0.90),
('550e8400-e29b-41d4-a716-446655440000', 'Wonder Bread', 'Bakery', 1.98, 1, NOW() - INTERVAL '5 days', 0.80);

-- Table to map anchor products to recommended accessories
CREATE TABLE IF NOT EXISTS product_accessories (
  id SERIAL PRIMARY KEY,
  anchor_product_name TEXT NOT NULL,         -- e.g., 'iPhone'
  accessory_name TEXT NOT NULL,              -- e.g., 'iPhone Case'
  accessory_product_id TEXT,                 -- (optional) link to product catalog
  image_url TEXT,                            -- (optional) for display
  price NUMERIC                              -- (optional) for display
);

-- Example data
INSERT INTO product_accessories (anchor_product_name, accessory_name, image_url, price)
VALUES
  ('iPhone', 'iPhone Case', '/placeholder-case.jpg', 19.99),
  ('iPhone', 'Wireless Headphones', '/placeholder-headphones.jpg', 99.99),
  ('iPhone', 'Screen Protector', '/placeholder-screen.jpg', 12.99),
  ('iPhone', 'Wireless Charger', '/placeholder-charger.jpg', 29.99),
  ('PlayStation', 'Extra Controller', '/placeholder-controller.jpg', 59.99),
  ('PlayStation', 'Popular Game', '/placeholder-game.jpg', 69.99);

-- Create orders table to group purchases
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  total DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add order_id to purchase_history if not exists
ALTER TABLE purchase_history
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id);
