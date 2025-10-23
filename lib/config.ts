// Configuration for the app
export const config = {
  supabase: {
    url: 'https://nzybisigsdwpekepbvfk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56eWJpc2lnc2R3cGVrZXBidmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTMyNDUsImV4cCI6MjA3NjUyOTI0NX0.xTkzwL8_slqbO-QnAb1tJTU7LioWP7HoyAAelyzJAE8'
  },
  n8n: {
    webhookUrl: 'https://n8n.shanetechtools.online/webhook-test/196c293b-915d-4b4e-b70c-35a4f1bad4ae'
  },
  elevenLabs: {
    // ElevenLabs API configuration
    apiKey: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || 'dev-test-key',
    // Agent ID for conversational AI
    agentId: process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID || 'dev-test-agent-id',
    // Base API URL for ElevenLabs
    apiUrl: 'https://api.elevenlabs.io/v1',
    // Conversational AI endpoint
    conversationalAiUrl: 'https://api.elevenlabs.io/v1/convai/conversation',
    // Widget configuration
    widget: {
      // Whether widget is enabled (can be disabled via env var)
      enabled: process.env.EXPO_PUBLIC_ELEVENLABS_WIDGET_ENABLED !== 'false',
      // Widget timeout in milliseconds
      sessionTimeout: 300000, // 5 minutes
      // Maximum conversation context length
      maxContextLength: 4000,
      // Audio settings
      audio: {
        sampleRate: 16000,
        channels: 1,
        encoding: 'pcm_16'
      }
    }
  }
}