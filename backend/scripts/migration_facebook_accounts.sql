-- ==========================================
-- Migration: Add Facebook Page Support
-- รันไฟล์นี้ใน Supabase SQL Editor
-- ==========================================

-- 1. Create facebook_accounts table
CREATE TABLE IF NOT EXISTS public.facebook_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    page_id TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    verify_token TEXT NOT NULL,
    app_secret TEXT,
    picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add facebook columns to chat_conversations
ALTER TABLE public.chat_conversations
ADD COLUMN IF NOT EXISTS facebook_user_id TEXT;

ALTER TABLE public.chat_conversations
ADD COLUMN IF NOT EXISTS facebook_account_id UUID REFERENCES public.facebook_accounts(id) ON DELETE SET NULL;

-- 3. channel column: 'line' | 'facebook' | null = legacy
ALTER TABLE public.chat_conversations
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'line';

-- 4. Enable RLS on facebook_accounts
ALTER TABLE public.facebook_accounts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Authenticated users can select facebook_accounts"
  ON public.facebook_accounts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert facebook_accounts"
  ON public.facebook_accounts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update facebook_accounts"
  ON public.facebook_accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete facebook_accounts"
  ON public.facebook_accounts FOR DELETE TO authenticated USING (true);
