-- ==========================================
-- Migration: Add Multiple LINE OA Support
-- ==========================================

-- 1. Create line_accounts table
CREATE TABLE IF NOT EXISTS public.line_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    channel_secret TEXT NOT NULL,
    access_token TEXT NOT NULL,
    picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add line_account_id to chat_conversations
ALTER TABLE public.chat_conversations
ADD COLUMN IF NOT EXISTS line_account_id UUID REFERENCES public.line_accounts(id) ON DELETE SET NULL;

-- 3. Enable RLS on line_accounts
ALTER TABLE public.line_accounts ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for line_accounts
-- Allow authenticated users to perform all operations
CREATE POLICY "Authenticated users can select line_accounts" ON public.line_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert line_accounts" ON public.line_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update line_accounts" ON public.line_accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete line_accounts" ON public.line_accounts FOR DELETE TO authenticated USING (true);

-- 5. Force update existing chat conversations to use a placeholder or leave NULL
-- Since we do not know the account yet, leaving it NULL is fine.
-- The UI will handle NULL as "ร้านทั่วไป (Default)"

-- 6. Trigger for updated_at (Optional but recommended)
-- CREATE OR REPLACE FUNCTION update_modified_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--    NEW.updated_at = now(); 
--    RETURN NEW;
-- END;
-- $$ language 'plpgsql';
-- CREATE TRIGGER update_line_accounts_modtime BEFORE UPDATE ON public.line_accounts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
