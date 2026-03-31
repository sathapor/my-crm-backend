-- =====================================================
-- E-Commerce SaaS - Supabase Database Setup
-- รันไฟล์นี้ใน Supabase SQL Editor เพื่อสร้าง Schema
-- =====================================================

-- =====================================================
-- การป้องกัน Error: ลบตารางเก่าที่มีชื่อซ้ำแต่อาจมี Schema ไม่ตรงกัน
-- =====================================================
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.chat_conversations CASCADE;
DROP TABLE IF EXISTS public.live_sessions CASCADE;

-- 1. ตาราง orders (ออเดอร์)
CREATE TABLE public.orders (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id    TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'รอชำระเงิน'
              CHECK (status IN ('รอชำระเงิน','ชำระแล้ว','จัดส่งแล้ว','ยกเลิก')),
  payment_method TEXT DEFAULT 'โอนเงินสลิป',
  shipping_status TEXT DEFAULT 'รอจัดส่ง',
  tracking_number TEXT,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  address     TEXT DEFAULT 'กรุงเทพมหานคร',
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตาราง products (สินค้า/คลังสินค้า)
CREATE TABLE public.products (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku         TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  category    TEXT DEFAULT 'ทั่วไป',
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock       INTEGER NOT NULL DEFAULT 0,
  image_url   TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตาราง customers (ลูกค้า CRM)
CREATE TABLE public.customers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT,
  tags        TEXT[] DEFAULT ARRAY['NEW'],
  total_spent NUMERIC(12,2) DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  avatar_color TEXT DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ตาราง chat_conversations (แชทลูกค้า)
CREATE TABLE public.chat_conversations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_user_id TEXT UNIQUE,
  customer    TEXT NOT NULL,
  avatar      TEXT DEFAULT 'NN',
  is_vip      BOOLEAN DEFAULT FALSE,
  messages    JSONB DEFAULT '[]'::jsonb,
  last_message TEXT,
  unread_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตาราง live_sessions (การไลฟ์สด)
CREATE TABLE public.live_sessions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT DEFAULT 'Live Session',
  is_active   BOOLEAN DEFAULT FALSE,
  viewer_count INTEGER DEFAULT 0,
  orders      JSONB DEFAULT '[]'::jsonb,
  comments    JSONB DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ปิด RLS (สำหรับ development) - Production ควรเปิด
-- =====================================================
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- Seed Data ตัวอย่าง (ข้อมูลทดสอบ)
-- =====================================================

-- สินค้า
INSERT INTO public.products (sku, name, category, price, stock, description) VALUES
  ('LIP-001', 'ลิปสติกเนื้อแมท สีแดง', 'ลิปสติก', 290, 45, 'สีแดงสดเนื้อแมทติดทน 12 ชั่วโมง'),
  ('LIP-002', 'ลิปสติกเนื้อกลอส สีชมพูนู้ด', 'ลิปสติก', 250, 28, 'เนื้อกลอสเพิ่มความอวบอิ่ม'),
  ('LIP-003', 'ลิปทินท์ สีแดงเลือดหมู', 'ลิปสติก', 199, 8, 'ลิปทินท์ติดทนหลายชั่วโมง'),
  ('FOU-001', 'รองพื้นปกปิดขั้นเทพ SPF50', 'รองพื้น', 590, 15, 'รองพื้นปกปิดสูง กันแดด SPF50'),
  ('FOU-002', 'คุชชั่นสุขภาพดี กลอว์ฟินิช', 'รองพื้น', 480, 3, 'คุชชั่นให้ผิวเปล่งปลั่ง'),
  ('EYE-001', 'อายไลเนอร์กันน้ำ ดำสนิท', 'ตา', 199, 32, 'กันน้ำ กันเหงื่อ 24 ชั่วโมง'),
  ('EYE-002', 'มาสคาร่ายาว เส้นหนา', 'ตา', 239, 0, 'ยาวเส้นมากขึ้น 60%')
  ON CONFLICT (sku) DO NOTHING;

-- ลูกค้า
INSERT INTO public.customers (name, phone, email, tags, total_spent, order_count) VALUES
  ('นันทิดา โรสโกลด์', '081-234-5678', 'nantida@email.com', ARRAY['VIP','LOYAL'], 14500, 6),
  ('ตานี เจริญทรง', '089-999-1111', 'tanee.c@email.com', ARRAY['NEW'], 850, 1),
  ('สมชาย รักดี', '090-000-0000', null, ARRAY['REGULAR'], 4500, 3),
  ('มาลี สุขสวัสดิ์', '086-555-4321', 'malee@gmail.com', ARRAY['VIP'], 22000, 9),
  ('กิตติพงศ์ วงศ์ใหม่', '091-234-5678', null, ARRAY['NEW'], 299, 1)
  ON CONFLICT DO NOTHING;

-- ออเดอร์
INSERT INTO public.orders (order_id, customer_name, status, payment_method, total_amount, address) VALUES
  ('ORD-1001', 'นันทิดา โรสโกลด์', 'ชำระแล้ว', 'โอนเงินสลิป', 1400.00, 'กรุงเทพมหานคร 10110'),
  ('ORD-1002', 'ตานี เจริญทรง', 'รอชำระเงิน', 'โอนเงินสลิป', 855.00, 'เชียงใหม่ 50200'),
  ('ORD-1003', 'สมชาย รักดี', 'จัดส่งแล้ว', 'บัตรเครดิต', 590.00, 'นนทบุรี 11000'),
  ('ORD-1004', 'มาลี สุขสวัสดิ์', 'ชำระแล้ว', 'โอนเงินสลิป', 3200.00, 'กรุงเทพมหานคร 10250'),
  ('ORD-1005', 'กิตติพงศ์ วงศ์ใหม่', 'รอชำระเงิน', 'โอนเงินสลิป', 299.00, 'สมุทรปราการ 10540')
  ON CONFLICT (order_id) DO NOTHING;

-- แชท
INSERT INTO public.chat_conversations (customer, avatar, is_vip, messages, last_message) VALUES
  ('นันทิดา โรสโกลด์', 'NR', TRUE,
    '[
      {"text":"สวัสดีค่ะ สอบถามลิปสติกเนื้อแมทยังมีของอยู่ไหมคะ?","type":"received","time":"10:40"},
      {"text":"สวัสดีครับคุณนันทิดา! เราเช็คสต็อคให้แล้ว ยังมีเหลือ 5 ชิ้นครับ","type":"sent","time":"10:41"},
      {"text":"ขอยืนยันออเดอร์ลิปสติก 2 แท่งค๊า","type":"received","time":"10:42"}
    ]'::jsonb,
    'ขอยืนยันออเดอร์ลิปสติก 2 แท่งค๊า'),
  ('ตานี เจริญทรง', 'ตจ', FALSE,
    '[
      {"text":"ราคานี้ลดอีกได้ไหมคะ โอนเลย?","type":"received","time":"09:00"}
    ]'::jsonb,
    'ราคานี้ลดอีกได้ไหมคะ โอนเลย?')
  ON CONFLICT DO NOTHING;

-- =====================================================
-- Function สำหรับ Auto Update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS customers_updated_at ON public.customers;
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
