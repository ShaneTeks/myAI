# ElevenLabs Agent Integration Design

## Overview

This design document outlines the integration of ElevenLabs Conversational AI Agents into the existing React Native chat application. The integration provides a hybrid text/voice conversation experience where users can seamlessly switch between text-based chat (via n8n) and voice-based conversation (via ElevenLabs Agent widget) while maintaining conversation continuity and shared memory.

The solution addresses the technical constraint that ElevenLabs widgets require prebuilt development apps and cannot run in ExpoGO, requiring careful environment detection and graceful fallbacks.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Chat Interface                           │
├─────────────────────────────────────────────────────────────┤
│  Text Chat Mode          │         Voice Chat Mode         │
│  ┌─────────────────┐    │    ┌─────────────────────────┐   │
│  │   ChatInput     │    │    │  ElevenLabs Widget      │   │
│  │   MessageList   │    │    │  Container              │   │
│  │   n8n Integration│   ←→   │  Voice Controls         │   │
│  └─────────────────┘    │    └─────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                Memory Sync Layer                            │
├─────────────────────────────────────────────────────────────┤
│              Supabase Storage Layer                         │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

The integration follows the existing app architecture patterns:
- **Service Layer**: New `elevenLabsService.ts` for widget management
- **Context Layer**: Extended `ChatContext` for voice session state
- **Component Layer**: New voice-specific components with existing UI patterns
- **Hook Layer**: New `useVoiceChat.ts` for voice session management

## Components and Interfaces

### Core Components

#### 1. VoiceSessionModal
**Purpose**: Modal container for the ElevenLabs widget
**Location**: `components/VoiceSessionModal.tsx`

```typescript
interface VoiceSessionModalProps {
  visible: boolean;
  onClose: () => void;
  conversationContext: ConversationContext;
  onSessionEnd: (transcript: VoiceTranscript) => void;
}
```

**Design Rationale**: Modal approach provides clear separation between text and voice modes while maintaining the existing chat interface underneath.

#### 2. ElevenLabsWidget
**Purpose**: Wrapper component for the ElevenLabs conversational widget
**Location**: `components/ElevenLabsWidget.tsx`

```typescript
interface ElevenLabsWidgetProps {
  agentId: string;
  conversationContext: ConversationContext;
  onTranscriptUpdate: (transcript: VoiceTranscript) => void;
  onError: (error: ElevenLabsError) => void;
}
```

**Design Rationale**: Separate wrapper allows for environment detection, error handling, and consistent interface regardless of underlying widget implementation.

#### 3. VoiceButton
**Purpose**: Button to initiate voice sessions from text chat
**Location**: `components/VoiceButton.tsx`

```typescript
interface VoiceButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isSupported: boolean;
}
```

**Design Rationale**: Follows existing button patterns (like `SpeakerButton.tsx`) with clear visual states for supported/unsupported environments.

### Service Layer

#### ElevenLabsService
**Purpose**: Manages ElevenLabs widget lifecycle and integration
**Location**: `lib/elevenLabsService.ts`

```typescript
interface ElevenLabsService {
  // Environment detection
  isWidgetSupported(): boolean;
  
  // Session management
  startVoiceSession(context: ConversationContext): Promise<VoiceSession>;
  endVoiceSession(sessionId: string): Promise<VoiceTranscript>;
  
  // Memory sync
  prepareContextForAgent(messages: Message[]): ConversationContext;
  parseVoiceResponse(response: ElevenLabsResponse): ParsedVoiceMessage;
}
```

**Design Rationale**: Centralized service follows existing patterns (`chatService.ts`, `authService.ts`) and provides clean abstraction for widget management.

### Extended Context

#### ChatContext Extensions
**Purpose**: Add voice session state to existing chat context
**Location**: `contexts/ChatContext.tsx`

```typescript
interface ChatContextValue {
  // Existing properties...
  
  // Voice session state
  voiceSession: VoiceSession | null;
  isVoiceSupported: boolean;
  
  // Voice actions
  startVoiceSession: () => Promise<void>;
  endVoiceSession: () => Promise<void>;
  syncVoiceTranscript: (transcript: VoiceTranscript) => Promise<void>;
}
```

**Design Rationale**: Extends existing context rather than creating separate voice context to maintain unified chat state management.

## Data Models

### Voice Session Models

```typescript
interface VoiceSession {
  id: string;
  userId: string;
  conversationId: string;
  startedAt: Date;
  status: 'active' | 'ended' | 'error';
  agentId: string;
}

interface VoiceTranscript {
  sessionId: string;
  messages: VoiceMessage[];
  endedAt: Date;
  summary?: string;
}

interface VoiceMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  widgets?: ParsedWidget[];
}

interface ConversationContext {
  recentMessages: Message[];
  userPreferences: UserPreferences;
  conversationSummary?: string;
  maxTokens: number;
}
```

**Design Rationale**: Models align with existing `Message` and `Conversation` types while adding voice-specific metadata. Reuses existing widget parsing infrastructure.

### Database Schema Extensions

```sql
-- Voice sessions table
CREATE TABLE voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'error')),
  transcript JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extend messages table for voice messages
ALTER TABLE messages ADD COLUMN voice_session_id UUID REFERENCES voice_sessions(id);
ALTER TABLE messages ADD COLUMN audio_url TEXT;
ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice'));
```

**Design Rationale**: Minimal schema changes that extend existing tables rather than creating parallel structures. Maintains RLS policies and existing query patterns.

## Error Handling

### Environment Detection Strategy

```typescript
class EnvironmentDetector {
  static isExpoGO(): boolean {
    return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  }
  
  static isPrebuiltApp(): boolean {
    return Constants.executionEnvironment === ExecutionEnvironment.Standalone;
  }
  
  static canUseElevenLabsWidget(): boolean {
    return this.isPrebuiltApp() && Platform.OS !== 'web';
  }
}
```

**Design Rationale**: Proactive environment detection prevents runtime errors and provides clear user feedback about feature availability.

### Graceful Degradation

1. **ExpoGO Environment**: Show informational message about prebuilt app requirement
2. **Web Environment**: Disable voice features with clear messaging
3. **Network Errors**: Fallback to text mode with error notification
4. **Widget Errors**: Graceful session termination with transcript preservation

## Testing Strategy

### Unit Testing Focus
- Environment detection logic
- Memory sync functionality
- Voice message parsing and storage
- Context preparation for ElevenLabs agent

### Integration Testing Focus
- Voice session lifecycle (start → active → end)
- Message synchronization between text and voice modes
- Widget error handling and recovery
- Database operations for voice sessions

### Manual Testing Requirements
- Voice session functionality in prebuilt app
- Graceful fallbacks in ExpoGO and web environments
- Audio playback and widget interactions
- Memory continuity across mode switches

**Design Rationale**: Testing strategy focuses on integration points and error conditions since ElevenLabs widget itself is a third-party component.

## Implementation Phases

### Phase 1: Foundation
- Environment detection and service setup
- Basic widget container and modal components
- Database schema extensions

### Phase 2: Core Integration
- Voice session management
- Memory sync implementation
- Basic UI for voice mode switching

### Phase 3: Enhanced Experience
- Smooth transitions and animations
- Advanced error handling and recovery
- Voice message display and playback

### Phase 4: Polish
- Performance optimizations
- Comprehensive testing
- Documentation and deployment

**Design Rationale**: Phased approach allows for iterative development and testing, with each phase building on the previous foundation while maintaining app stability.

## Security Considerations

### Authentication
- Voice sessions inherit existing Supabase RLS policies
- ElevenLabs agent authentication via secure API keys
- User context limited to conversation participants

### Data Privacy
- Voice transcripts stored with same encryption as text messages
- Audio URLs use secure, time-limited access tokens
- Conversation context filtered to exclude sensitive information

### API Security
- ElevenLabs API keys stored in secure environment variables
- Rate limiting for voice session creation
- Input validation for all voice-related data

**Design Rationale**: Security approach builds on existing Supabase security model while addressing voice-specific concerns like audio storage and API access.