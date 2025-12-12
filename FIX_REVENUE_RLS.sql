-- FIX REVENUE VISIBILITY
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS (if not already)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies (optional, but effectively cleans slate)
DROP POLICY IF EXISTS "Users can only access their own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow All Access to Anon" ON transactions;

-- 3. Create a policy that allows:
--    a) Users to see their own data
--    b) The Admin (marcpedrero@gmail.com) to see EVERYTHING
CREATE POLICY "Admin View All Transactions" 
ON transactions 
FOR SELECT 
USING (
  (auth.jwt() ->> 'email')::text = 'marcpedrero@gmail.com' 
  OR 
  user_email = (auth.jwt() ->> 'email')::text
);

-- 4. Allow Insert for authenticated users (so buying works)
CREATE POLICY "Users can insert transactions"
ON transactions
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);
