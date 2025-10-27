# N8N Finance Workflow Guide

## Overview
This guide explains how to set up the N8N workflow to handle finance transactions and generate monthly finance widgets.

## Database Setup in Supabase
1. Run the SQL commands from `supabase-finance-schema.sql` in your Supabase SQL editor
2. This creates the necessary tables: `transactions`, `monthly_summaries`, `transaction_categories`
3. Sets up RLS policies and helper functions

## N8N Workflow Structure

### 1. Transaction Processing Workflow
When user sends a message like: "I just did a swipe payment at Woermann Brock for N$250, I bought groceries"

#### Workflow Steps:
1. **Webhook Trigger** - Receives the user message
2. **AI Analysis Node** - Extract transaction details using AI
3. **Category Mapping** - Map to predefined categories
4. **Supabase Insert** - Save transaction to database
5. **Response Generation** - Send confirmation back

#### AI Prompt for Transaction Extraction:
```
Extract transaction details from this message: "{user_message}"

Return JSON with:
- merchant: string (business name)
- amount: number (positive for income, negative for expenses)
- transaction_type: "expense" | "income" | "transfer"
- category: string (groceries, fuel, entertainment, etc.)
- payment_method: string (swipe, cash, transfer, etc.)
- description: string (optional details)

Example response:
{
  "merchant": "Woermann Brock",
  "amount": -250.00,
  "transaction_type": "expense", 
  "category": "groceries",
  "payment_method": "swipe",
  "description": "Grocery shopping"
}
```

#### Supabase Insert Query:
```sql
INSERT INTO transactions (
  user_id, merchant, amount, transaction_type, 
  category, payment_method, description, fee
) VALUES (
  '{{ $json.user_id }}',
  '{{ $json.merchant }}',
  {{ $json.amount }},
  '{{ $json.transaction_type }}',
  '{{ $json.category }}',
  '{{ $json.payment_method }}',
  '{{ $json.description }}',
  {{ $json.fee || 2.50 }}  -- Default bank fee
);
```

### 2. Monthly Finance Widget Workflow
When user asks: "Show me my monthly finances" or "Monthly finance summary"

#### Workflow Steps:
1. **Webhook Trigger** - Receives the finance request
2. **Date Calculation** - Get current month/year
3. **Supabase Queries** - Get monthly data and recent transactions
4. **Data Processing** - Format for widget
5. **Widget Response** - Return structured response

#### Supabase Queries:

**Get Monthly Stats:**
```sql
SELECT 
  COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_income,
  COALESCE(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)), 0) as total_expenses,
  COALESCE(SUM(fee), 0) as total_fees,
  COALESCE(SUM(amount) - SUM(fee), 0) as net_savings,
  COUNT(*) as transaction_count
FROM transactions 
WHERE user_id = '{{ $json.user_id }}'
AND EXTRACT(YEAR FROM transaction_date) = {{ new Date().getFullYear() }}
AND EXTRACT(MONTH FROM transaction_date) = {{ new Date().getMonth() + 1 }};
```

**Get Recent Transactions:**
```sql
SELECT 
  t.id::text,
  t.merchant,
  CASE WHEN t.amount > 0 THEN 'Income' ELSE INITCAP(t.transaction_type) END as type_label,
  CASE WHEN t.fee > 0 THEN 'N$' || t.fee::text ELSE 'N$0.00' END as fee,
  CASE WHEN t.amount > 0 THEN '+N$' || t.amount::text ELSE 'N$' || t.amount::text END as amount,
  COALESCE(c.icon, 'circle') as icon,
  COALESCE(c.accent_color, '#6B7280') as accent
FROM transactions t
LEFT JOIN transaction_categories c ON c.name = t.category
WHERE t.user_id = '{{ $json.user_id }}'
ORDER BY t.transaction_date DESC
LIMIT 5;
```

## Widget Response Format

### Example N8N Response for Monthly Finance Widget:
```json
{
  "AIResponse": "Here's your monthly financial summary for October 2025:",
  "financeAgent": {
    "finance": true,
    "type": "monthly",
    "widgetId": "finmonth",
    "output": {
      "title": "Monthly Finance",
      "subtitle": "October 2025", 
      "monthLabel": "Oct 2025",
      "stats": [
        {
          "key": "income",
          "label": "Income",
          "value": "N$4,250",
          "icon": "trending-up",
          "accent": "#10B981"
        },
        {
          "key": "expenses", 
          "label": "Expenses",
          "value": "N$2,890",
          "icon": "trending-down", 
          "accent": "#EF4444"
        },
        {
          "key": "savings",
          "label": "Savings", 
          "value": "N$1,360",
          "icon": "piggy-bank",
          "accent": "#3B82F6"
        }
      ],
      "transactions": [
        {
          "id": "tx1",
          "merchant": "Woermann Brock",
          "typeLabel": "Expense",
          "fee": "N$2.50", 
          "amount": "N$-250.00",
          "icon": "shopping-cart",
          "accent": "#F59E0B"
        },
        {
          "id": "tx2",
          "merchant": "Salary Deposit", 
          "typeLabel": "Income",
          "fee": "N$0.00",
          "amount": "+N$2,500.00",
          "icon": "dollar-sign",
          "accent": "#10B981"
        }
      ],
      "summary": "You saved 32% this month compared to last month. Great job staying within budget!"
    }
  }
}
```

## N8N Node Configuration

### 1. AI Transaction Extraction Node
- **Node Type**: OpenAI GPT-4
- **System Prompt**: Use the transaction extraction prompt above
- **Input**: User message from webhook
- **Output**: Structured transaction data

### 2. Supabase Insert Node  
- **Node Type**: Supabase
- **Operation**: Insert
- **Table**: transactions
- **Data**: Mapped from AI extraction output

### 3. Monthly Stats Query Node
- **Node Type**: Supabase  
- **Operation**: Execute SQL
- **Query**: Monthly stats query above
- **Parameters**: user_id, current month/year

### 4. Recent Transactions Query Node
- **Node Type**: Supabase
- **Operation**: Execute SQL  
- **Query**: Recent transactions query above
- **Parameters**: user_id

### 5. Response Formatter Node
- **Node Type**: Code (JavaScript)
- **Purpose**: Format data into widget response structure
- **Input**: Stats and transactions from Supabase
- **Output**: Complete widget response JSON

## Testing the Workflow

### Test Transaction Messages:
1. "I paid N$150 at Pick n Pay for groceries"
2. "Received salary of N$5000 today"
3. "Fuel at Engen for N$800"
4. "Coffee at Mugg & Bean N$45"

### Test Finance Request:
1. "Show my monthly finances"
2. "What's my financial summary?"
3. "Monthly finance report"

## Error Handling
- Invalid transaction data → Save with default category
- Missing user_id → Return error message
- Database connection issues → Return cached data if available
- Invalid finance request → Return helpful message

This setup provides a complete finance tracking system integrated with your chat app!