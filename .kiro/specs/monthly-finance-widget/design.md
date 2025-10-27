# Design Document

## Overview

This design implements a Monthly Finance Widget that displays financial statistics, recent transactions, and monthly summaries. The widget follows the same architectural pattern as the weather widget, with N8N agent integration and React Native implementation.

## Architecture

### High-Level Flow
1. User makes finance request → N8N Agent
2. N8N Agent processes request and calls Finance API
3. N8N Agent structures response for finance widget
4. Frontend Widget Parser identifies finance widget type and renders accordingly

### Component Structure
```
Finance Widget System
├── N8N Finance Agent (Backend)
│   ├── Request Processing
│   ├── Finance API Integration
│   └── Response Structuring
├── Frontend Widget Parser
│   ├── Finance Widget Detection
│   ├── Data Validation
│   └── Widget Rendering
└── ChatKit Finance Widget
    ├── Monthly Finance Widget (finmonth)
    └── Swipe-to-Minimize Support
```

## Components and Interfaces

### N8N Agent Response Structure

#### Monthly Finance Response
```json
{
  "AIResponse": "Here's your monthly financial summary:",
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
          "value": "$4,250",
          "icon": "trending-up",
          "accent": "#10B981"
        },
        {
          "key": "expenses",
          "label": "Expenses", 
          "value": "$2,890",
          "icon": "trending-down",
          "accent": "#EF4444"
        },
        {
          "key": "savings",
          "label": "Savings",
          "value": "$1,360",
          "icon": "piggy-bank",
          "accent": "#3B82F6"
        }
      ],
      "transactions": [
        {
          "id": "tx1",
          "merchant": "Grocery Store",
          "typeLabel": "Purchase",
          "fee": "$2.50",
          "amount": "-$125.30",
          "icon": "shopping-cart",
          "accent": "#F59E0B"
        },
        {
          "id": "tx2", 
          "merchant": "Salary Deposit",
          "typeLabel": "Income",
          "fee": "$0.00",
          "amount": "+$2,500.00",
          "icon": "dollar-sign",
          "accent": "#10B981"
        }
      ],
      "summary": "You saved 32% this month compared to last month. Great job staying within budget!"
    }
  }
}
```

### Widget Parser Interface

#### Finance Widget Data Types
```typescript
interface FinanceStatItem {
  key: string;
  label: string;
  value: string;
  icon: string;
  accent: string;
}

interface FinanceTransaction {
  id: string;
  merchant: string;
  typeLabel: string;
  fee: string;
  amount: string;
  icon: string;
  accent: string;
}

interface MonthlyFinanceData {
  title: string;
  subtitle: string;
  monthLabel: string;
  stats: FinanceStatItem[];
  transactions: FinanceTransaction[];
  summary: string;
}

interface FinanceWidgetData {
  finance: boolean;
  type: 'monthly';
  widgetId: string;
  output: MonthlyFinanceData;
}
```

## Data Models

### Finance Widget Component Structure

#### Main Widget Layout
```
┌─────────────────────────────────────┐
│ Header (Title, Subtitle, Badge)     │
├─────────────────────────────────────┤
│ Stats Grid (Income, Expenses, etc.) │
├─────────────────────────────────────┤
│ Divider                             │
├─────────────────────────────────────┤
│ Transactions List                   │
├─────────────────────────────────────┤
│ Divider                             │
├─────────────────────────────────────┤
│ Monthly Summary                     │
└─────────────────────────────────────┘
```

#### Minimized Widget Layout
```
┌─────────────────────┐
│ 💰 Monthly Finance  │
│ $1,360 saved        │
└─────────────────────┘
```

## Error Handling

### Data Validation
```typescript
const validateFinanceData = (data: any): MonthlyFinanceData | null => {
  if (!data || typeof data !== 'object') return null;
  
  const requiredFields = ['title', 'subtitle', 'monthLabel', 'stats', 'transactions', 'summary'];
  if (!requiredFields.every(field => data[field] !== undefined)) return null;
  
  if (!Array.isArray(data.stats) || !Array.isArray(data.transactions)) return null;
  
  return data as MonthlyFinanceData;
};
```

### Fallback Strategies
1. **Invalid Widget Data**: Display error message with retry option
2. **Missing Stats**: Show empty stats grid with placeholder
3. **Missing Transactions**: Show "No transactions" message
4. **Network Issues**: Show cached finance data if available

## Testing Strategy

### Unit Tests
- Finance widget data validation
- Widget rendering with different data sets
- Swipe gesture handling
- Error state handling

### Integration Tests
- N8N Agent response processing
- Widget parser finance detection
- Complete finance widget flow

## Implementation Notes

### Styling Approach
- Use consistent color scheme with other widgets
- Implement proper spacing and typography
- Support both light and dark themes
- Ensure accessibility compliance

### Performance Considerations
- Lazy load transaction icons
- Optimize re-renders with React.memo
- Cache finance data for offline viewing
- Smooth animations for minimize/expand

### Widget Configuration
- Finance Widget ID: `finmonth`
- Support swipe-to-minimize like weather widget
- Consistent animation timing and easing
- Proper gesture handling for React Native

This design ensures the Monthly Finance Widget integrates seamlessly with the existing widget system while providing comprehensive financial data visualization.