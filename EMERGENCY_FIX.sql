DROP POLICY IF EXISTS "Users can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Admin View All Transactions" ON transactions;
CREATE POLICY "Allow All Access to Transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
