// Shared types for voice session components

export interface ConversationContext {
  recentMessages: any[];
  userPreferences?: any;
  conversationSummary?: string;
  maxTokens: number;
}

export interface VoiceTranscript {
  sessionId: string;
  messages: VoiceMessage[];
  endedAt: Date;
  summary?: string;
}

export interface VoiceMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  widgets?: any[];
}

export interface ElevenLabsError {
  code: string;
  message: string;
  details?: any;
}