import { config } from './config'
import { personalizationService } from './personalizationService'
import { Conversation, Message, supabase } from './supabase'

export class ChatService {
  // Create a new conversation
  static async createConversation(title: string = 'New Chat'): Promise<Conversation | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('User not authenticated - cannot create conversation')
      return null
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({ 
        title, 
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return null
    }

    return data
  }

  // Get all conversations
  static async getConversations(): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return []
    }

    return data || []
  }

  // Get messages for a conversation
  static async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }

    return data || []
  }

  // Add a message to a conversation
  static async addMessage(
    conversationId: string, 
    content: string, 
    isUser: boolean
  ): Promise<Message | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('User not authenticated - cannot add message')
      return null
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content,
        is_user: isUser,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding message:', error)
      return null
    }

    // Update conversation's updated_at timestamp
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    if (updateError) {
      console.error('Error updating conversation timestamp:', updateError)
      // Don't fail the message creation for this
    }

    return data
  }

  // Send message to n8n agent and get response
  static async sendToAgent(conversationId: string, userMessage: string): Promise<string | null> {
    try {
      // First, save the user message
      await this.addMessage(conversationId, userMessage, true)

      // Get full conversation history
      const messages = await this.getMessages(conversationId)

      // Get current system instruction
      const systemInstruction = await personalizationService.getSystemInstruction()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Send to n8n webhook
      const response = await fetch(config.n8n.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          messages,
          newMessage: userMessage,
          systemInstruction,
          user_id: user?.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response from agent')
      }

      const result = await response.json()
      
      // Handle structured response from n8n
      let finalAgentResponse: string | object
      let shouldSaveResponse = true
      
      // Check if response is n8n array format with weather data
      if (Array.isArray(result) && result.length > 0 && result[0]?.output) {
        // n8n array format: [{"output": {"AIResponse": "...", "weatherAgent": {...}}}]
        finalAgentResponse = JSON.stringify(result)
      } else if (result.weather === true && result.weatherData && result.text) {
        // Direct structured response with weather data
        finalAgentResponse = JSON.stringify({
          weather: true,
          weatherData: result.weatherData,
          text: result.text
        })
      } else if (result.response) {
        // Expected format: { success: true, response: "...", conversationId: "..." }
        finalAgentResponse = result.response
      } else if (Array.isArray(result) && result.length > 0 && result[0]?.content) {
        // Webhook array format: [{ id: "...", content: "...", is_user: false, ... }]
        const messageData = result[0]
        finalAgentResponse = messageData.content
        
        // Check if this message already exists in our database by checking if it has our conversation_id
        if (messageData.conversation_id === conversationId) {
          shouldSaveResponse = false // Already saved by webhook
        }
      } else if (result.content) {
        // Direct content format: { content: "..." }
        finalAgentResponse = result.content
      } else if (result.text) {
        // Simple text response
        finalAgentResponse = result.text
      } else {
        console.error('Unexpected response format:', result)
        throw new Error('Invalid response format from agent')
      }

      // Save agent response if it wasn't already saved by the webhook
      if (shouldSaveResponse) {
        const responseContent = typeof finalAgentResponse === 'string' 
          ? finalAgentResponse 
          : JSON.stringify(finalAgentResponse)
        await this.addMessage(conversationId, responseContent, false)
      }

      return typeof finalAgentResponse === 'string' 
        ? finalAgentResponse 
        : JSON.stringify(finalAgentResponse)
    } catch (error) {
      console.error('Error communicating with agent:', error)
      return null
    }
  }

  // Update conversation title
  static async updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', conversationId)

    if (error) {
      console.error('Error updating conversation title:', error)
      return false
    }

    return true
  }

  // Delete a conversation and its messages
  static async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('User not authenticated for deletion')
        return false
      }

      // First, explicitly delete messages (though CASCADE should handle this)
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId)

      if (messagesError) {
        console.error('Error deleting messages:', messagesError)
        // Continue anyway, CASCADE might still work
      }

      // Then delete the conversation
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (conversationError) {
        console.error('Error deleting conversation:', conversationError)
        return false
      }

      return true
    } catch (error) {
      console.error('Unexpected error during deletion:', error)
      return false
    }
  }
}