-- Corrected Finance Database Schema for Supabase
-- Fixed syntax errors and optimized for production use

-- 1. Create main transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Transaction Details
    merchant TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL, -- Negative for expenses, positive for income
    currency TEXT DEFAULT 'NAD',
    
    -- Namibian Banking Specific
    bank TEXT NOT NULL, -- 'FNB_Namibia', 'Standard_Bank_Namibia'
    account_type TEXT NOT NULL, -- 'FNB_Platinum_Lifestyle_EPO', 'SBN_Prestige_Banking_Bundled'
    transaction_type TEXT NOT NULL, -- 'atm_withdrawal_own', 'card_purchase_local', etc.
    
    -- Fees and Costs
    bank_fee DECIMAL(10,2) DEFAULT 0.00,
    fee_calculation JSONB, -- Store fee breakdown for transparency
    
    -- Categorization
    category TEXT, -- 'groceries', 'fuel', 'entertainment', etc.
    payment_method TEXT, -- 'swipe', 'atm', 'online', etc.
    
    -- Additional Info
    description TEXT,
    location TEXT, -- ATM location, merchant location
    
    -- Timestamps
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Monthly partition key
    month_year TEXT GENERATED ALWAYS AS (TO_CHAR(transaction_date, 'YYYY-MM')) STORED
);

-- 2. Create monthly summaries table
CREATE TABLE IF NOT EXISTS monthly_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Period
    month INTEGER NOT NULL, -- 1-12
    year INTEGER NOT NULL,
    month_year TEXT NOT NULL, -- '2025-10'
    
    -- Financial Totals
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    total_income DECIMAL(12,2) DEFAULT 0.00,
    total_bank_fees DECIMAL(12,2) DEFAULT 0.00,
    net_savings DECIMAL(12,2) DEFAULT 0.00,
    
    -- Bank-specific breakdowns
    fnb_fees DECIMAL(10,2) DEFAULT 0.00,
    sbn_fees DECIMAL(10,2) DEFAULT 0.00,
    atm_fees DECIMAL(10,2) DEFAULT 0.00,
    
    -- Bundle tracking for FNB EPO accounts
    fnb_epo_bundle_used DECIMAL(10,2) DEFAULT 0.00,
    fnb_epo_bundle_limit DECIMAL(10,2) DEFAULT 0.00,
    
    -- Transaction counts
    transaction_count INTEGER DEFAULT 0,
    atm_withdrawal_count INTEGER DEFAULT 0,
    
    -- AI-generated summary
    summary_text TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, month_year)
);

-- 3. Create Namibian bank accounts reference table
CREATE TABLE IF NOT EXISTS namibian_bank_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Account Details
    bank TEXT NOT NULL, -- 'FNB_Namibia', 'Standard_Bank_Namibia'
    account_type TEXT NOT NULL, -- Full account type key
    account_name TEXT NOT NULL, -- Display name
    pricing_option TEXT, -- 'EPO', 'PAYU', 'Bundled'
    
    -- Account Limits and Benefits
    monthly_fee DECIMAL(10,2),
    free_bundle_value DECIMAL(10,2), -- For EPO accounts
    free_withdrawal_count INTEGER, -- For CardWise Zero
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, bank, account_type)
);

-- 4. Create transaction categories with Namibian context
CREATE TABLE IF NOT EXISTS transaction_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    icon TEXT NOT NULL,
    accent_color TEXT NOT NULL,
    type TEXT NOT NULL, -- 'expense', 'income', 'fee'
    
    -- Namibian specific
    is_namibian_specific BOOLEAN DEFAULT false,
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insert Namibian-specific categories
INSERT INTO transaction_categories (name, display_name, icon, accent_color, type, is_namibian_specific, description) VALUES
-- Banking/ATM
('atm_withdrawal_fnb', 'FNB ATM Withdrawal', 'bank', '#00AFFF', 'expense', true, 'FNB ATM withdrawals'),
('atm_withdrawal_sbn', 'Standard Bank ATM', 'bank', '#00539B', 'expense', true, 'Standard Bank ATM withdrawals'),
('atm_withdrawal_other', 'Other Bank ATM', 'bank', '#9CA3AF', 'expense', true, 'Other bank ATM withdrawals'),
('cash_plus', 'CashPlus', 'dollar-sign', '#10B981', 'expense', true, 'FNB CashPlus withdrawals'),
('cashback_pos', 'Cashback at POS', 'shopping-cart', '#059669', 'expense', true, 'Cashback at point of sale'),

-- Local Retailers
('woermann_brock', 'Woermann Brock', 'shopping-cart', '#F59E0B', 'expense', true, 'Woermann Brock purchases'),
('pick_n_pay', 'Pick n Pay', 'shopping-cart', '#F59E0B', 'expense', true, 'Pick n Pay purchases'),
('shoprite', 'Shoprite', 'shopping-cart', '#F59E0B', 'expense', true, 'Shoprite purchases'),
('spar', 'SPAR', 'shopping-cart', '#F59E0B', 'expense', true, 'SPAR purchases'),

-- Fuel Stations
('engen', 'Engen', 'car', '#EF4444', 'expense', true, 'Engen fuel stations'),
('shell', 'Shell', 'car', '#EF4444', 'expense', true, 'Shell fuel stations'),
('caltex', 'Caltex', 'car', '#EF4444', 'expense', true, 'Caltex fuel stations'),
('puma', 'Puma Energy', 'car', '#EF4444', 'expense', true, 'Puma Energy fuel stations'),

-- Dining & Entertainment
('mugg_bean', 'Mugg & Bean', 'utensils', '#F97316', 'expense', true, 'Mugg & Bean coffee shops'),
('kfc', 'KFC', 'utensils', '#F97316', 'expense', true, 'KFC restaurants'),
('steers', 'Steers', 'utensils', '#F97316', 'expense', true, 'Steers restaurants'),
('wimpy', 'Wimpy', 'utensils', '#F97316', 'expense', true, 'Wimpy restaurants'),

-- Utilities & Services
('nampower', 'NamPower', 'zap', '#6B7280', 'expense', true, 'NamPower electricity'),
('namwater', 'NamWater', 'droplets', '#3B82F6', 'expense', true, 'NamWater services'),
('telecom', 'Telecom Namibia', 'phone', '#8B5CF6', 'expense', true, 'Telecom Namibia services'),
('mtc', 'MTC', 'smartphone', '#EC4899', 'expense', true, 'MTC mobile services'),

-- International
('netflix', 'Netflix', 'film', '#E50914', 'expense', false, 'Netflix subscription'),
('spotify', 'Spotify', 'music', '#1DB954', 'expense', false, 'Spotify subscription'),
('amazon', 'Amazon', 'package', '#FF9900', 'expense', false, 'Amazon purchases'),

-- Income
('salary', 'Salary', 'dollar-sign', '#10B981', 'income', false, 'Monthly salary'),
('freelance', 'Freelance', 'briefcase', '#059669', 'income', false, 'Freelance income'),
('investment', 'Investment', 'trending-up', '#0D9488', 'income', false, 'Investment returns'),

-- Fees
('bank_fee', 'Bank Fee', 'alert-circle', '#F59E0B', 'fee', true, 'Banking fees'),
('atm_fee', 'ATM Fee', 'alert-circle', '#F59E0B', 'fee', true, 'ATM transaction fees'),
('international_fee', 'International Fee', 'globe', '#F59E0B', 'fee', true, 'International transaction fees')

ON CONFLICT (name) DO NOTHING;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_month ON transactions(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_bank_account ON transactions(user_id, bank, account_type);
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_user_period ON monthly_summaries(user_id, year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_active ON namibian_bank_accounts(user_id, is_active);

-- 7. Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE namibian_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
-- Transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Monthly summaries
CREATE POLICY "Users can view own summaries" ON monthly_summaries
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own summaries" ON monthly_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own summaries" ON monthly_summaries
    FOR UPDATE USING (auth.uid() = user_id);

-- Bank accounts
CREATE POLICY "Users can view own bank accounts" ON namibian_bank_accounts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own bank accounts" ON namibian_bank_accounts
    FOR ALL USING (auth.uid() = user_id);

-- Categories (public read)
CREATE POLICY "Anyone can view categories" ON transaction_categories
    FOR SELECT USING (true);

-- 9. Helper functions for Namibian banking calculations

-- Calculate FNB ATM fee based on amount and account type
CREATE OR REPLACE FUNCTION calculate_fnb_atm_fee(
    p_amount DECIMAL,
    p_account_type TEXT,
    p_pricing_option TEXT,
    p_monthly_bundle_used DECIMAL DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
    fee_result JSONB;
    base_fee DECIMAL := 14.50;
    blocks INTEGER;
    total_fee DECIMAL;
    bundle_limit DECIMAL;
    over_bundle_fee DECIMAL := 16.50;
    over_amount DECIMAL;
    over_blocks INTEGER;
BEGIN
    -- Calculate N$500 blocks (minimum 1 block)
    blocks := GREATEST(1, CEIL(p_amount / 500.0));
    
    -- Get bundle limit based on account type
    bundle_limit := CASE 
        WHEN p_account_type LIKE '%Platinum%' AND p_pricing_option = 'EPO' THEN 5000.00
        WHEN p_account_type LIKE '%Gold%' AND p_pricing_option = 'EPO' THEN 2000.00
        WHEN p_account_type LIKE '%Private_Clients%' THEN 8000.00
        WHEN p_account_type LIKE '%Private_Wealth%' THEN 999999.00 -- Unlimited
        WHEN p_account_type LIKE '%BankWise%' AND p_pricing_option = 'EPO' THEN 1000.00
        WHEN p_account_type LIKE '%LifeStart%' THEN 1000.00
        WHEN p_account_type LIKE '%Future%' THEN 1000.00
        ELSE 0.00
    END;
    
    -- Calculate fee
    IF p_pricing_option = 'EPO' AND bundle_limit > 0 THEN
        IF (p_monthly_bundle_used + p_amount) <= bundle_limit THEN
            total_fee := 0.00;
        ELSE
            -- Calculate over-bundle amount
            over_amount := (p_monthly_bundle_used + p_amount) - bundle_limit;
            over_blocks := CEIL(over_amount / 500.0);
            total_fee := over_blocks * over_bundle_fee;
        END IF;
    ELSE
        total_fee := blocks * base_fee;
    END IF;
    
    fee_result := jsonb_build_object(
        'total_fee', total_fee,
        'blocks', blocks,
        'base_fee_per_block', CASE WHEN p_pricing_option = 'EPO' THEN over_bundle_fee ELSE base_fee END,
        'bundle_limit', bundle_limit,
        'bundle_used_before', p_monthly_bundle_used,
        'bundle_used_after', LEAST(bundle_limit, p_monthly_bundle_used + p_amount),
        'calculation_method', CASE WHEN p_pricing_option = 'EPO' THEN 'EPO_Bundle' ELSE 'Standard_PAYU' END
    );
    
    RETURN fee_result;
END;
$$ LANGUAGE plpgsql;

-- Get monthly finance widget data
CREATE OR REPLACE FUNCTION get_monthly_finance_widget_data(
    p_user_id UUID,
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    p_month INTEGER DEFAULT EXTRACT(MONTH FROM NOW())
) RETURNS JSONB AS $$
DECLARE
    month_year TEXT := p_year || '-' || LPAD(p_month::TEXT, 2, '0');
    stats_data JSONB;
    transactions_data JSONB;
    summary_text TEXT;
    total_spent DECIMAL;
    total_fees DECIMAL;
    atm_fees DECIMAL;
BEGIN
    -- Calculate monthly stats
    SELECT 
        COALESCE(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)), 0) as spent,
        COALESCE(SUM(bank_fee), 0) as fees,
        COALESCE(SUM(CASE WHEN transaction_type LIKE '%atm%' THEN bank_fee ELSE 0 END), 0) as atm_fee_total
    INTO total_spent, total_fees, atm_fees
    FROM transactions 
    WHERE user_id = p_user_id AND month_year = month_year;
    
    -- Build stats array
    stats_data := jsonb_build_array(
        jsonb_build_object(
            'key', 'total_spent',
            'label', 'Total Spent',
            'value', 'N$ ' || total_spent::TEXT,
            'icon', 'arrow-down',
            'accent', '#EF4444'
        ),
        jsonb_build_object(
            'key', 'total_fees',
            'label', 'Total Bank Fees',
            'value', 'N$ ' || total_fees::TEXT,
            'icon', 'alert-circle',
            'accent', '#F59E0B'
        ),
        jsonb_build_object(
            'key', 'atm_fees',
            'label', 'ATM Fees',
            'value', 'N$ ' || atm_fees::TEXT,
            'icon', 'bank',
            'accent', '#3B82F6'
        )
    );
    
    -- Get recent transactions
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', t.id::TEXT,
            'merchant', t.merchant,
            'typeLabel', COALESCE(c.display_name, INITCAP(REPLACE(t.transaction_type, '_', ' '))),
            'fee', 'N$ ' || t.bank_fee::TEXT,
            'amount', CASE 
                WHEN t.amount > 0 THEN '+N$ ' || t.amount::TEXT
                ELSE 'N$ ' || t.amount::TEXT
            END,
            'icon', COALESCE(c.icon, 'circle'),
            'accent', COALESCE(c.accent_color, '#6B7280')
        )
    ) INTO transactions_data
    FROM transactions t
    LEFT JOIN transaction_categories c ON c.name = t.category
    WHERE t.user_id = p_user_id AND t.month_year = month_year
    ORDER BY t.transaction_date DESC
    LIMIT 5;
    
    -- Generate summary
    summary_text := 'You spent N$ ' || total_spent::TEXT || ' this month with N$ ' || total_fees::TEXT || ' in bank fees.';
    
    RETURN jsonb_build_object(
        'title', 'Monthly Finance',
        'subtitle', TO_CHAR(DATE(p_year || '-' || p_month || '-01'), 'Month YYYY') || ' Report',
        'monthLabel', TO_CHAR(DATE(p_year || '-' || p_month || '-01'), 'Month'),
        'stats', stats_data,
        'transactions', COALESCE(transactions_data, '[]'::jsonb),
        'summary', summary_text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;