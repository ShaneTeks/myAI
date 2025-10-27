# Simplified N8N Finance Agent Setup

## Architecture Overview
```
App Message → N8N Main Agent → N8N Finance Sub-Agent → Supabase → Response
```

**Why this approach:**
- **Simplicity:** No complex code nodes, let AI handle calculations
- **Maintainability:** Easy to modify prompts vs debugging code
- **Reliability:** AI is better at handling edge cases than hardcoded logic
- **Scalability:** Easy to add new banks/accounts by updating prompts

## 1. Main N8N Workflow Structure

### Node Flow:
```
Webhook → Main Agent (OpenAI) → Finance Sub-Agent (OpenAI) → Supabase → Response
```

**Why this flow:**
- **Single entry point:** All messages come through one webhook
- **Agent delegation:** Main agent decides when to use finance sub-agent
- **Data persistence:** Supabase handles all storage automatically
- **Clean responses:** Direct response back to app

## 2. Node Configuration

### Node 1: Webhook Trigger
**Purpose:** Receive messages from your app
**Configuration:**
- Method: POST
- Path: `/webhook/chat`

**Expected Payload:**
```json
{
  "conversationId": "uuid",
  "messages": [...],
  "newMessage": "I withdrew N$500 from FNB ATM",
  "systemInstruction": "...",
  "user_id": "uuid"
}
```

**Why webhook:** Direct integration with your existing chat service without changes

### Node 2: Main Agent (OpenAI GPT-4)
**Purpose:** Determine if message needs finance handling and delegate accordingly

**System Prompt:**
```
You are the main chat agent. When users mention financial transactions, banking, or request financial summaries, use the finance_agent tool. For all other messages, respond normally.

Available tools:
- finance_agent: For financial transactions, banking questions, and financial summaries
```

**Tool Definition:**
```json
{
  "name": "finance_agent",
  "description": "Handle financial transactions and banking requests",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["record_transaction", "monthly_summary"],
        "description": "Type of financial action needed"
      },
      "user_message": {
        "type": "string",
        "description": "The user's message about finance"
      }
    },
    "required": ["action", "user_message"]
  }
}
```

**Why main agent:** 
- **Smart routing:** Only finance messages go to finance sub-agent
- **Context preservation:** Maintains conversation flow
- **Tool-based:** Clean separation of concerns

### Node 3: Finance Sub-Agent (OpenAI GPT-4)
**Purpose:** Handle all financial calculations and generate responses

**System Prompt:** (Use your existing Finance Agent system prompt exactly as is)

**Additional Instructions for Sub-Agent:**
```
When recording transactions:
1. Extract all transaction details using your banking knowledge
2. Calculate exact fees using the provided fee structures
3. Always suggest cheaper alternatives when applicable
4. Return structured data for database storage

When generating monthly summaries:
1. Request data from database
2. Calculate statistics and insights
3. Return widget-formatted response

For widget responses, always use this exact format:
{
  "AIResponse": "Your summary message here",
  "financeAgent": {
    "financeWidget": true,
    "type": "monthly_summary",
    "output": {
      "title": "Monthly Finance",
      "subtitle": "Month Year Report", 
      "monthLabel": "Month",
      "stats": [...],
      "transactions": [...],
      "summary": "Your insights here"
    }
  }
}
```

**Why sub-agent:**
- **Specialized knowledge:** Your banking expertise in one place
- **Accurate calculations:** AI handles complex fee logic better than code
- **Consistent responses:** Same agent ensures consistent behavior

### Node 4: Supabase Operations
**Purpose:** Store transactions and retrieve monthly data

**Configuration:** Split into two operations based on action type

#### For Transaction Recording:
**Operation:** Insert into `transactions` table
**Data Mapping:** Let the Finance Sub-Agent provide the exact structure

#### For Monthly Summary:
**Operation:** Execute SQL function
**Query:** 
```sql
SELECT get_monthly_finance_widget_data('{{ $json.user_id }}');
```

**Why Supabase:**
- **Automatic scaling:** Handles growing transaction data
- **ACID compliance:** Ensures data integrity
- **Built-in functions:** Complex calculations in database
- **RLS security:** User data automatically isolated

### Node 5: Response Handler
**Purpose:** Save conversation and send response back to app

**Operations:**
1. **Insert Message (User):** Save user's original message
2. **Insert Message (AI):** Save AI response
3. **HTTP Response:** Send formatted response back to app

**Why separate storage:**
- **Conversation history:** Maintains chat context
- **Audit trail:** Track all financial interactions
- **App compatibility:** Matches your existing message format

## 3. Simplified Database Schema

### Core Tables (Minimal Setup):
```sql
-- Transactions (main financial data)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    merchant TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    bank TEXT NOT NULL,
    account_type TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    bank_fee DECIMAL(10,2) DEFAULT 0,
    category TEXT,
    description TEXT,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    month_year TEXT GENERATED ALWAYS AS (TO_CHAR(transaction_date, 'YYYY-MM')) STORED
);

-- Monthly summaries (cached calculations)
CREATE TABLE monthly_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    month_year TEXT NOT NULL,
    total_spent DECIMAL(12,2) DEFAULT 0,
    total_fees DECIMAL(12,2) DEFAULT 0,
    summary_data JSONB,
    UNIQUE(user_id, month_year)
);
```

**Why minimal schema:**
- **Essential data only:** Focus on what's actually needed
- **JSON flexibility:** Store complex data as JSONB for easy updates
- **Generated columns:** Automatic month partitioning
- **Simple relationships:** Easy to understand and maintain

## 4. Finance Sub-Agent Prompt Enhancement

### Add these instructions to your existing prompt:

```
IMPORTANT: Database Integration Instructions

When recording transactions, provide response in this format:
{
  "action": "store_transaction",
  "transaction_data": {
    "merchant": "extracted_merchant",
    "amount": calculated_amount,
    "bank": "FNB_Namibia or Standard_Bank_Namibia", 
    "account_type": "specific_account_type",
    "transaction_type": "transaction_type_from_json",
    "bank_fee": calculated_fee,
    "category": "determined_category",
    "description": "additional_details"
  },
  "user_response": "Transaction recorded message with fee info and suggestions"
}

When generating monthly summaries, first request current data, then provide widget format response.
```

**Why enhanced prompt:**
- **Structured output:** Ensures consistent data format
- **Clear instructions:** AI knows exactly what to return
- **Database ready:** Output maps directly to table structure

## 5. Testing Flow

### Test Scenario 1: Transaction Recording
```
User Input: "I withdrew N$500 from FNB ATM using my Platinum EPO account"

Flow:
1. Webhook receives message
2. Main Agent detects financial content → calls finance_agent tool
3. Finance Sub-Agent:
   - Identifies: FNB, Platinum EPO, ATM withdrawal
   - Calculates: Fee based on bundle usage
   - Suggests: CashPlus alternative
   - Returns: Structured transaction data
4. Supabase stores transaction
5. Response sent to app with confirmation and suggestions
```

### Test Scenario 2: Monthly Summary
```
User Input: "Show me my monthly finances"

Flow:
1. Webhook receives message  
2. Main Agent → finance_agent tool (monthly_summary)
3. Finance Sub-Agent requests monthly data
4. Supabase returns aggregated data
5. Finance Sub-Agent formats widget response
6. App receives widget-ready JSON
```

**Why this testing approach:**
- **End-to-end validation:** Tests complete user journey
- **Real scenarios:** Uses actual user language
- **Error detection:** Catches integration issues early

## 6. Benefits of This Approach

### Simplicity Benefits:
- **No code maintenance:** AI handles all logic
- **Easy updates:** Change prompts instead of debugging code
- **Self-documenting:** Prompts explain the logic
- **Flexible:** AI adapts to new scenarios automatically

### Reliability Benefits:
- **AI error handling:** Better at edge cases than hardcoded logic
- **Consistent calculations:** Same AI ensures same results
- **Natural language:** Handles varied user input naturally
- **Graceful degradation:** AI provides helpful responses even with incomplete data

### Scalability Benefits:
- **New banks:** Just update the banking JSON in prompt
- **New features:** Add to prompt instructions
- **Complex scenarios:** AI handles without code changes
- **User variations:** Natural language processing handles different phrasings

This simplified approach leverages AI strengths while maintaining clean, maintainable architecture!