# Project Structure

## Root Directory Organization

### Core App Structure
- **`app/`**: File-based routing with Expo Router
  - `_layout.tsx`: Root layout with providers and navigation setup
  - `index.tsx`: Main chat screen
  - `(tabs)/`: Tab-based navigation screens
  - Individual screens: `settings.tsx`, `personalize.tsx`, `modal.tsx`, etc.

### Component Architecture
- **`components/`**: Reusable UI components
  - Authentication: `AuthProvider.tsx`, `LoginScreen.tsx`
  - Chat: `ChatInput.tsx`, `AnimatedMessageList.tsx`, `MessageWithWidgets.tsx`
  - Widgets: `WeatherCard.tsx`, `ChatKitWidget.tsx`, `SimpleWeatherDisplay.tsx`
  - UI Elements: `LoadingDots.tsx`, `SpeakerButton.tsx`, `MinimalTextInput.tsx`
  - Navigation: `custom-drawer.tsx`, `haptic-tab.tsx`
  - `ui/`: Shared UI components directory

### Business Logic
- **`lib/`**: Core services and utilities
  - `supabase.ts`: Database client and type definitions
  - `authService.ts`: Authentication operations
  - `chatService.ts`: Chat operations and n8n integration
  - `textToSpeechService.ts`: Audio generation and playback
  - `widgetParser.ts`: Structured response parsing
  - `config.ts`: App configuration and environment variables
  - `database.ts`: Database operations
  - `personalizationService.ts`: User preferences

### State Management
- **`contexts/`**: React Context providers
  - `ChatContext.tsx`: Chat state and operations
- **`hooks/`**: Custom React hooks
  - `useAuth.ts`: Authentication state management
  - `useChat.ts`: Chat functionality hooks
  - `use-color-scheme.ts`: Theme management
  - `use-theme-color.ts`: Color utilities

### Configuration & Assets
- **`constants/`**: App constants and theme definitions
- **`assets/`**: Static assets (images, icons)
- **`supabase/migrations/`**: Database schema migrations

## File Naming Conventions

### Components
- PascalCase for component files: `WeatherCard.tsx`, `ChatInput.tsx`
- Descriptive names indicating functionality
- Test components prefixed with "Test": `TestWeatherMessage.tsx`

### Services & Utilities
- camelCase for service files: `authService.ts`, `chatService.ts`
- Descriptive names ending with "Service" for service classes

### Hooks
- camelCase starting with "use": `useAuth.ts`, `useChat.ts`

### Types & Interfaces
- Defined in service files or separate `.types.ts` files
- PascalCase for type names

## Key Architectural Patterns

### Provider Pattern
- Root layout wraps app with multiple providers:
  - `AuthProvider`: Authentication state
  - `ChatProvider`: Chat functionality
  - `ThemeProvider`: UI theming

### Service Layer
- Business logic separated into service files
- Services handle external API calls (Supabase, n8n)
- Centralized configuration in `lib/config.ts`

### Widget System
- Structured responses from n8n parsed into native components
- `widgetParser.ts` handles response transformation
- Native widgets preferred over web-based solutions

### File-Based Routing
- Expo Router handles navigation automatically
- Screen files in `app/` directory map to routes
- Layout files (`_layout.tsx`) define navigation structure

## Documentation Files
- **Feature Guides**: `TTS_FEATURE_GUIDE.md`, `WIDGET_INTEGRATION.md`
- **Setup Instructions**: `SETUP.md`, `README.md`
- **API Examples**: `N8N_*.md` and `N8N_*.json` files
- **Test Data**: `TEST_*.json` files for development

## Development Workflow
- Use TypeScript strict mode for type safety
- Path aliases (`@/*`) for clean imports
- ESLint for code quality
- Expo development tools for debugging and testing