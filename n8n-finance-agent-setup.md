# N8N Finance Agent Setup Guide

## Overview
This guide provides a comprehensive setup for your Namibian Finance Agent in N8N, designed to work with your existing system prompt and banking knowledge base.

## Architecture

```
User Message → Main Agent → Finance Agent Tool → N8N Workflow → Supabase → Widget Response
```

## 1. Finance Agent Tool Configuration

### Tool Definition for Main Agent
```json
{
  "name": "finance_agent",
  "description": "Specialized Namibian finance agent for tracking transactions, calculating bank fees, and generating financial summaries",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["record_transaction", "monthly_summary", "account_setup"],
        "description": "The action to perform"
      },
      "user_message": {
        "type": "string", 
        "description": "The original user message about the transaction or request"
      },
      "user_id": {
        "type": "string",
        "description": "The authenticated user ID"
      }
    },
    "required": ["action", "user_message", "user_id"]
  }
}
```

## 2. N8N Workflow Structure

### Workflow 1: Transaction Recording
**Trigger:** HTTP Request from Main Agent
**URL:** `https://your-n8n.domain/webhook/finance-transaction`

#### Node Flow:
```
Webhook → AI Analysis → Fee Calculation → Supabase Insert → Response
```

#### Node Details:

**1. Webhook Node**
- Method: POST
- Expected payload:
```json
{
  "action": "record_transaction",
  "user_message": "I withdrew N$300 from an FNB ATM using my Platinum EPO account",
  "user_id": "uuid-here"
}
```

**2. AI Analysis Node (OpenAI GPT-4)**
- **System Prompt:** Use your existing Finance Agent system prompt
- **User Message:** `{{ $json.user_message }}`
- **Function Calling:** Enable with this function:

```json
{
  "name": "extract_transaction_details",
  "description": "Extract structured transaction details from user message",
  "parameters": {
    "type": "object",
    "properties": {
      "merchant": {"type": "string", "description": "Business or ATM name"},
      "amount": {"type": "number", "description": "Transaction amount (positive for income, negative for expenses)"},
      "bank": {"type": "string", "enum": ["FNB_Namibia", "Standard_Bank_Namibia"]},
      "account_type": {"type": "string", "description": "Specific account type key from JSON data"},
      "pricing_option": {"type": "string", "enum": ["EPO", "PAYU", "Bundled"]},
      "transaction_type": {"type": "string", "description": "Transaction type from JSON data"},
      "category": {"type": "string", "description": "Transaction category"},
      "payment_method": {"type": "string", "description": "Payment method used"},
      "description": {"type": "string", "description": "Additional details"},
      "location": {"type": "string", "description": "ATM or merchant location"}
    },
    "required": ["merchant", "amount", "bank", "account_type", "transaction_type"]
  }
}
```

**3. Fee Calculation Node (Code - JavaScript)**
```javascript
// Get the extracted transaction details
const transaction = $input.first().json.function_call.arguments;
const bankingData = $input.first().json.banking_knowledge_base; // Your JSON data

// Calculate fee based on transaction type and account
function calculateFee(transaction, bankingData) {
  const { bank, account_type, pricing_option, transaction_type, amount } = transaction;
  
  // Get account data from banking JSON
  const accountData = bankingData.banks[bank]?.accounts[account_type];
  if (!accountData) return { fee: 0, calculation: "Unknown account type" };
  
  // Calculate fee based on transaction type
  let fee = 0;
  let calculation = {};
  
  if (transaction_type === 'atm_withdrawal_own' && bank === 'FNB_Namibia') {
    // FNB ATM withdrawal logic
    const blocks = Math.max(1, Math.ceil(Math.abs(amount) / 500));
    
    if (pricing_option === 'EPO') {
      // Check bundle usage (you'll need to query current month usage)
      const bundleLimit = accountData.pricing_options.EPO.benefits?.free_atm_withdrawal_bundle_value || 0;
      // For now, assume no bundle usage (you'll enhance this with Supabase query)
      fee = 0; // Within bundle
      calculation = { type: 'EPO_Bundle', blocks, bundleLimit, withinBundle: true };
    } else {
      fee = blocks * 14.50;
      calculation = { type: 'Standard_PAYU', blocks, feePerBlock: 14.50 };
    }
  } else if (transaction_type === 'card_purchase_local') {
    fee = 0; // Free on FNB
    calculation = { type: 'Free_Local_Swipe' };
  }
  // Add more transaction types as needed
  
  return { fee, calculation };
}

const feeResult = calculateFee(transaction, bankingData);

return [{
  json: {
    ...transaction,
    bank_fee: feeResult.fee,
    fee_calculation: feeResult.calculation,
    user_id: $input.first().json.user_id
  }
}];
```

**4. Supabase Insert Node**
- **Operation:** Insert
- **Table:** transactions
- **Data:**
```json
{
  "user_id": "{{ $json.user_id }}",
  "merchant": "{{ $json.merchant }}",
  "amount": "{{ $json.amount }}",
  "bank": "{{ $json.bank }}",
  "account_type": "{{ $json.account_type }}",
  "transaction_type": "{{ $json.transaction_type }}",
  "bank_fee": "{{ $json.bank_fee }}",
  "fee_calculation": "{{ $json.fee_calculation }}",
  "category": "{{ $json.category }}",
  "payment_method": "{{ $json.payment_method }}",
  "description": "{{ $json.description }}",
  "location": "{{ $json.location }}"
}
```

**5. Response Node (Code - JavaScript)**
```javascript
const transaction = $input.first().json;

// Generate response with fee information and suggestions
let response = `Transaction recorded: ${transaction.merchant} - N$${Math.abs(transaction.amount)}`;

if (transaction.bank_fee > 0) {
  response += ` (Fee: N$${transaction.bank_fee})`;
  
  // Add suggestions for cheaper alternatives
  if (transaction.transaction_type === 'atm_withdrawal_own' && transaction.bank === 'FNB_Namibia') {
    response += `\n\n💡 Tip: CashPlus costs only N$3.50, and Cashback at POS is free on EPO accounts.`;
  }
}

return [{
  json: {
    success: true,
    message: response,
    transaction_id: transaction.id,
    fee_breakdown: transaction.fee_calculation
  }
}];
```

### Workflow 2: Monthly Summary Widget
**Trigger:** HTTP Request from Main Agent  
**URL:** `https://your-n8n.domain/webhook/finance-summary`

#### Node Flow:
```
Webhook → Supabase Query → Data Processing → Widget Response
```

**1. Webhook Node**
- Expected payload:
```json
{
  "action": "monthly_summary",
  "user_message": "Show me my monthly finances",
  "user_id": "uuid-here"
}
```

**2. Supabase Function Call Node**
- **Operation:** Execute SQL
- **Query:** 
```sql
SELECT get_monthly_finance_widget_data('{{ $json.user_id }}');
```

**3. Widget Response Node (Code - JavaScript)**
```javascript
const widgetData = $input.first().json[0].get_monthly_finance_widget_data;
const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

return [{
  json: {
    AIResponse: `Here is your financial summary for ${currentMonth}:`,
    financeAgent: {
      financeWidget: true,
      type: "monthly_summary",
      output: widgetData
    }
  }
}];
```

## 3. Enhanced Banking Fee Logic

### FNB EPO Bundle Tracking
Add this to your fee calculation node:

```javascript
// Query current month bundle usage
async function getCurrentBundleUsage(userId, accountType) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const query = `
    SELECT COALESCE(SUM(ABS(amount)), 0) as bundle_used
    FROM transactions 
    WHERE user_id = $1 
    AND account_type = $2 
    AND transaction_type = 'atm_withdrawal_own'
    AND month_year = $3
  `;
  
  // Execute query (you'll need to set up Supabase connection)
  const result = await supabase.rpc('execute_sql', { 
    query, 
    params: [userId, accountType, currentMonth] 
  });
  
  return result.data[0]?.bundle_used || 0;
}
```

## 4. Account Setup Workflow

### Initial Account Configuration
When a user first mentions their account, store it:

**Supabase Insert - Bank Accounts:**
```sql
INSERT INTO namibian_bank_accounts (
  user_id, bank, account_type, account_name, pricing_option, 
  monthly_fee, free_bundle_value, is_primary
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, true
) ON CONFLICT (user_id, bank, account_type) 
DO UPDATE SET 
  is_active = true,
  updated_at = NOW();
```

## 5. Error Handling & Validation

### Transaction Validation
```javascript
function validateTransaction(transaction) {
  const errors = [];
  
  if (!transaction.amount || transaction.amount === 0) {
    errors.push("Amount is required and cannot be zero");
  }
  
  if (!transaction.bank || !['FNB_Namibia', 'Standard_Bank_Namibia'].includes(transaction.bank)) {
    errors.push("Valid bank is required (FNB_Namibia or Standard_Bank_Namibia)");
  }
  
  if (!transaction.account_type) {
    errors.push("Account type is required");
  }
  
  return errors;
}
```

## 6. Testing Scenarios

### Test Messages:
1. **ATM Withdrawal:** "I withdrew N$500 from FNB ATM using my Platinum EPO account"
2. **Purchase:** "I bought groceries at Woermann Brock for N$250 with my FNB card"
3. **International:** "Netflix charged my DigiPlus card N$150"
4. **Summary Request:** "Show me my monthly financial summary"

### Expected Responses:
- Transaction confirmations with fee calculations
- Proactive suggestions for cheaper alternatives
- Monthly widget with stats and recent transactions

## 7. Monitoring & Analytics

### Key Metrics to Track:
- Transaction processing success rate
- Fee calculation accuracy
- Widget generation performance
- User engagement with financial insights

This setup provides a robust, Namibian-banking-aware finance agent that integrates seamlessly with your existing chat application!