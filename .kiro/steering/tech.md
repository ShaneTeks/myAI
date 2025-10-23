# Technology Stack

## Framework & Platform
- **Expo SDK 54**: React Native development platform with managed workflow
- **React Native 0.81.4**: Cross-platform mobile development
- **React 19.1.0**: Latest React with concurrent features
- **TypeScript 5.9.2**: Strict typing enabled for better code quality

## Navigation & UI
- **Expo Router 6.0**: File-based routing system
- **React Navigation**: Drawer and bottom tab navigation
- **React Native Reanimated 4.1**: Smooth animations and gestures
- **Expo Linear Gradient**: Native gradient backgrounds

## Backend & Services
- **Supabase**: Backend-as-a-Service for authentication, database, and storage
- **n8n Integration**: AI workflow automation and external API orchestration
- **AsyncStorage**: Local data persistence
- **SQLite**: Local database via expo-sqlite

## Audio & Media
- **Expo AV**: Audio playback for text-to-speech features
- **React Native WebView**: For any web content integration

## Development Tools
- **ESLint**: Code linting with Expo configuration
- **TypeScript**: Strict mode enabled with path aliases (@/*)

## Common Commands

### Development
```bash
# Start development server
npm start
# or
npx expo start

# Platform-specific development
npm run android    # Android emulator
npm run ios        # iOS simulator  
npm run web        # Web browser

# Code quality
npm run lint       # Run ESLint
```

### Project Management
```bash
# Install dependencies
npm install

# Reset to clean project structure
npm run reset-project

# Build for production (requires EAS CLI)
eas build --platform all
```

## Configuration Files
- `app.json`: Expo configuration with plugins and platform settings
- `tsconfig.json`: TypeScript configuration with strict mode and path aliases
- `eslint.config.js`: ESLint configuration
- `lib/config.ts`: App-specific configuration (Supabase, n8n URLs)

## Key Dependencies
- **@supabase/supabase-js**: Supabase client with auth and database
- **@react-navigation/***: Navigation components and utilities
- **expo-***: Expo SDK modules for native functionality
- **react-native-gesture-handler**: Touch and gesture handling
- **react-native-safe-area-context**: Safe area management