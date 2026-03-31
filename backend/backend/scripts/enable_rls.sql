-- ==============================================================================
-- Supabase Row Level Security (RLS) Setup Script
-- ==============================================================================
-- This script enables RLS on all existing tables and creates basic policies 
-- where only authenticated users can perform SELECT, INSERT, UPDATE, DELETE.

-- 1. Enable Row Level Security (RLS) for all project tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies for Products
-- Allow all authenticated users full access
CREATE POLICY "Authenticated users can select products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update products" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete products" ON products FOR DELETE TO authenticated USING (true);

-- 3. Create Policies for Orders
CREATE POLICY "Authenticated users can select orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert orders" ON orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update orders" ON orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete orders" ON orders FOR DELETE TO authenticated USING (true);

-- 4. Create Policies for Customers
CREATE POLICY "Authenticated users can select customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert customers" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update customers" ON customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete customers" ON customers FOR DELETE TO authenticated USING (true);

-- 5. Create Policies for Chat Conversations
CREATE POLICY "Authenticated users can select chat_conversations" ON chat_conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert chat_conversations" ON chat_conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update chat_conversations" ON chat_conversations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete chat_conversations" ON chat_conversations FOR DELETE TO authenticated USING (true);

-- 6. Create Policies for Live Sessions
CREATE POLICY "Authenticated users can select live_sessions" ON live_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert live_sessions" ON live_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update live_sessions" ON live_sessions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete live_sessions" ON live_sessions FOR DELETE TO authenticated USING (true);

-- Verification:
-- After running this script in your Supabase SQL Editor, non-authenticated requests 
-- via the public anon key will return empty results.
