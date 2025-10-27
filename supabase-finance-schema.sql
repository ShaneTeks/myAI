-- Finance Database Schema for Supabase
-- Run these commands in your Supabase SQL editor

-- 1. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL, -- Positive for income, negative for expenses
    currency TEXT DEFAULT 'NAD',
    transaction_type TEXT NOT NULL, -- 'expense', 'income', 'transfer'
    category TEXT, -- 'groceries', 'salary', 'entertainment', etc.
    payment_method TEXT, -- 'swipe', 'cash', 'transfer', etc.
    fee DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create monthly_summaries table (for caching monthly calculations)
CREATE TABLE IF NOT EXISTS monthly_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL, -- 1-12
    year INTEGER NOT NULL,
    total_income DECIMAL(10,2) DEFAULT 0.00,
    total_expenses DECIMAL(10,2) DEFAULT 0.00,
    total_fees DECIMAL(10,2) DEFAULT 0.00,
    net_savings DECIMAL(10,2) DEFAULT 0.00,
    transaction_count INTEGER DEFAULT 0,
    summary_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month, year)
);

-- 3. Create categories table (for consistent categorization)
CREATE TABLE IF NOT EXISTS transaction_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL, -- Icon name for the widget
    accent_color TEXT NOT NULL, -- Hex color for the widget
    type TEXT NOT NULL, -- 'expense', 'income'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert default categories
INSERT INTO transaction_categories (name, icon, accent_color, type) VALUES
-- Expense categories
('groceries', 'shopping-cart', '#F59E0B', 'expense'),
('fuel', 'car', '#EF4444', 'expense'),
('entertainment', 'film', '#8B5CF6', 'expense'),
('dining', 'utensils', '#F97316', 'expense'),
('shopping', 'shopping-bag', '#EC4899', 'expense'),
('utilities', 'zap', '#6B7280', 'expense'),
('transport', 'truck', '#3B82F6', 'expense'),
('healthcare', 'heart', '#EF4444', 'expense'),
('education', 'book', '#10B981', 'expense'),
-- Income categories
('salary', 'dollar-sign', '#10B981', 'income'),
('freelance', 'briefcase', '#059669', 'income'),
('investment', 'trending-up', '#0D9488', 'income'),
('gift', 'gift', '#8B5CF6', 'income'),
('other_income', 'plus-circle', '#6B7280', 'income')
ON CONFLICT (name) DO NOTHING;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_month ON transactions(user_id, EXTRACT(YEAR FROM transaction_date), EXTRACT(MONTH FROM transaction_date));
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_user_period ON monthly_summaries(user_id, year DESC, month DESC);

-- 6. Create RLS (Row Level Security) policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;

-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Users can only see their own monthly summaries
CREATE POLICY "Users can view own monthly summaries" ON monthly_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly summaries" ON monthly_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly summaries" ON monthly_summaries
    FOR UPDATE USING (auth.uid() = user_id);

-- Everyone can read categories (they're shared)
CREATE POLICY "Anyone can view categories" ON transaction_categories
    FOR SELECT USING (true);

-- 7. Create functions for monthly calculations
CREATE OR REPLACE FUNCTION calculate_monthly_summary(p_user_id UUID, p_year INTEGER, p_month INTEGER)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_income', COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
        'total_expenses', COALESCE(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)), 0),
        'total_fees', COALESCE(SUM(fee), 0),
        'net_savings', COALESCE(SUM(amount) - SUM(fee), 0),
        'transaction_count', COUNT(*)
    ) INTO result
    FROM transactions
    WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM transaction_date) = p_year
    AND EXTRACT(MONTH FROM transaction_date) = p_month;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to get recent transactions for widget
CREATE OR REPLACE FUNCTION get_recent_transactions_for_widget(p_user_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'id', t.id::text,
                'merchant', t.merchant,
                'typeLabel', CASE 
                    WHEN t.amount > 0 THEN 'Income'
                    ELSE INITCAP(t.transaction_type)
                END,
                'fee', CASE 
                    WHEN t.fee > 0 THEN 'N$' || t.fee::text
                    ELSE 'N$0.00'
                END,
                'amount', CASE 
                    WHEN t.amount > 0 THEN '+N$' || t.amount::text
                    ELSE 'N$' || t.amount::text
                END,
                'icon', COALESCE(c.icon, 'circle'),
                'accent', COALESCE(c.accent_color, '#6B7280')
            )
        )
        FROM transactions t
        LEFT JOIN transaction_categories c ON c.name = t.category
        WHERE t.user_id = p_user_id
        ORDER BY t.transaction_date DESC
        LIMIT p_limit
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;