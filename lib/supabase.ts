import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { config } from './config'

// Generated database types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
      }
      messages: {
        Row: {
          audio_url: string | null
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          is_user: boolean
          message_type: string | null
          user_id: string | null
          voice_session_id: string | null
        }
        Insert: {
          audio_url?: string | null
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_user: boolean
          message_type?: string | null
          user_id?: string | null
          voice_session_id?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_user?: boolean
          message_type?: string | null
          user_id?: string | null
          voice_session_id?: string | null
        }
      }
      voice_sessions: {
        Row: {
          agent_id: string
          conversation_id: string | null
          created_at: string | null
          ended_at: string | null
          id: string
          started_at: string | null
          status: string | null
          transcript: Json | null
          user_id: string | null
        }
        Insert: {
          agent_id: string
          conversation_id?: string | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          transcript?: Json | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          conversation_id?: string | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          transcript?: Json | null
          user_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export const supabase = createClient(config.supabase.url, config.supabase.anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Type aliases for easier usage
export type Message = Database['public']['Tables']['messages']['Row']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type MessageUpdate = Database['public']['Tables']['messages']['Update']

export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update']

export type VoiceSession = Database['public']['Tables']['voice_sessions']['Row']
export type VoiceSessionInsert = Database['public']['Tables']['voice_sessions']['Insert']
export type VoiceSessionUpdate = Database['public']['Tables']['voice_sessions']['Update']

// Enums for type safety
export type MessageType = 'text' | 'voice'
export type VoiceSessionStatus = 'active' | 'ended' | 'error'