-- N0N4 Database Schema

-- 1. Users Table
-- Stores user profiles, credit balance, and discounts.
CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    credits INTEGER DEFAULT 10,
    discount INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. App Config Table
-- Stores global configuration like pricing.
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config if not exists
INSERT INTO app_config (key, value) 
VALUES ('pricing', '{"protection": 1, "verification": 1}')
ON CONFLICT (key) DO NOTHING;

-- 3. Uploads Table
-- Tracks protected files per user.
CREATE TABLE IF NOT EXISTS uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT REFERENCES users(email),
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    level INTEGER,
    style TEXT,
    lang TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Activity Logs Table
-- System wide audit log.
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT,
    user_email TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Transactions Table
-- Tracks credit purchases and revenue.
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT REFERENCES users(email),
    amount_credits INTEGER NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS)
-- NOTE: policies are needed if we access via Client Side directly.
-- Since we are using Server Actions (acting as admin/service role mostly), we might bypass RLS if using Service Key.
-- However, we are using ANON key in creation, which respects RLS.
-- FOR SIMPLICITY in this MVP migration: We will enable PUBLIC access for anon to these tables.
-- IN PRODUCTION: You must restrict this.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow Anon (our server actions) to READ/WRITE ALL for now
-- (Next.js server actions using anon key behave like an anon user)
CREATE POLICY "Allow All Access to Anon" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access to Anon" ON app_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access to Anon" ON uploads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access to Anon" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access to Anon" ON transactions FOR ALL USING (true) WITH CHECK (true);
