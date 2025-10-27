# Requirements Document

## Introduction

The application needs a Monthly Finance Widget that displays financial data including monthly statistics, recent transactions, and financial summaries. This widget should follow the same pattern as the weather widget, with support for N8N agent integration and swipe-to-minimize functionality.

## Glossary

- **Monthly Finance Widget**: ChatKit widget (finmonth) designed for displaying monthly financial data and transactions
- **Finance API**: Backend service providing financial data including transactions, statistics, and summaries
- **N8N Finance Agent**: The backend agent that processes finance requests and returns structured financial data
- **Widget Parser**: The application component that processes widget data and renders appropriate UI components

## Requirements

### Requirement 1

**User Story:** As a user, I want to see my monthly financial summary displayed in a dedicated finance widget, so that I can quickly review my financial status.

#### Acceptance Criteria

1. WHEN the N8N Agent receives a finance request, THE Finance API SHALL return monthly financial data
2. WHEN finance data is processed, THE Widget Parser SHALL use the finance widget (finmonth) for rendering
3. THE Monthly Finance Widget SHALL display title, subtitle, and month label
4. THE Monthly Finance Widget SHALL show financial statistics with icons, labels, and values

### Requirement 2

**User Story:** As a user, I want to see my recent transactions in the finance widget, so that I can track my spending patterns.

#### Acceptance Criteria

1. THE Monthly Finance Widget SHALL display a list of recent transactions
2. WHEN displaying transactions, THE Widget SHALL show merchant name, transaction type, fee, and amount
3. THE Widget SHALL display appropriate icons and accent colors for each transaction
4. THE Widget SHALL support multiple transaction entries in a scrollable format

### Requirement 3

**User Story:** As a user, I want to see financial statistics in an organized layout, so that I can understand my financial metrics at a glance.

#### Acceptance Criteria

1. THE Monthly Finance Widget SHALL display statistics in a grid layout
2. WHEN showing statistics, THE Widget SHALL include icons, labels, values, and accent colors
3. THE Widget SHALL support multiple statistics items with consistent formatting
4. THE Statistics SHALL be visually distinct from transactions

### Requirement 4

**User Story:** As a user, I want the finance widget to have the same interaction capabilities as other widgets, so that I have a consistent user experience.

#### Acceptance Criteria

1. THE Monthly Finance Widget SHALL support swipe-to-minimize functionality
2. WHEN minimized, THE Widget SHALL show a compact representation with key financial data
3. THE Widget SHALL support tap-to-expand from minimized state
4. THE Widget SHALL use consistent styling with other application widgets

### Requirement 5

**User Story:** As a developer, I want the finance data structure to be properly validated and processed, so that the widget displays accurate financial information.

#### Acceptance Criteria

1. THE N8N Agent SHALL structure finance responses to match the finance widget requirements
2. THE Widget Parser SHALL validate finance data structure before rendering
3. IF finance data structure is invalid, THEN THE Widget Parser SHALL display an error message
4. THE System SHALL support the financeAgent response format with type and output fields