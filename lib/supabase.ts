import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { config } from './config'

export const supabase = createClient(config.supabase.url, config.supabase.anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export type Message = {
  id: string
  conversation_id: string
  content: string
  is_user: boolean
  created_at: string
  user_id?: string
}

export type Conversation = {
  id: string
  title: string
  created_at: string
  updated_at: string
  user_id?: string
}