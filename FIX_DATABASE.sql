CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT,
    amount_credits INTEGER NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All Access to Transactions" ON transactions;

CREATE POLICY "Allow All Access to Transactions"
ON transactions
FOR ALL
USING (true)
WITH CHECK (true);
