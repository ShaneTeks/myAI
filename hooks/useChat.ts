import { useEffect, useState } from 'react'
import { ChatService } from '../lib/chatService'
import { Conversation, Message } from '../lib/supabase'

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id)
    }
  }, [currentConversation])

  const loadConversations = async () => {
    setLoading(true)
    const convs = await ChatService.getConversations()
    setConversations(convs)
    
    // If no current conversation and we have conversations, select the first one
    if (!currentConversation && convs.length > 0) {
      setCurrentConversation(convs[0])
    }
    setLoading(false)
  }

  const loadMessages = async (conversationId: string) => {
    setLoading(true)
    const msgs = await ChatService.getMessages(conversationId)
    setMessages(msgs)
    setLoading(false)
  }

  const createNewConversation = async (title?: string) => {
    const newConv = await ChatService.createConversation(title)
    if (newConv) {
      setConversations(prev => [newConv, ...prev])
      setCurrentConversation(newConv)
      setMessages([])
    }
    return newConv
  }

  const selectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation)
  }

  const sendMessage = async (content: string) => {
    if (!currentConversation || sending) return

    setSending(true)
    
    try {
      // Send to agent and get response
      const response = await ChatService.sendToAgent(currentConversation.id, content)
      
      if (response) {
        // Reload messages to get the latest state
        await loadMessages(currentConversation.id)
        
        // Update conversations list to reflect new updated_at time
        await loadConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const deleteConversation = async (conversationId: string) => {
    const success = await ChatService.deleteConversation(conversationId)
    if (success) {
      const updatedConversations = conversations.filter(c => c.id !== conversationId)
      setConversations(updatedConversations)
      
      // If we deleted the current conversation, select the next available one
      if (currentConversation?.id === conversationId) {
        if (updatedConversations.length > 0) {
          // Find the next conversation in the list
          const currentIndex = conversations.findIndex(c => c.id === conversationId)
          let nextConversation = updatedConversations[currentIndex] || updatedConversations[currentIndex - 1] || updatedConversations[0]
          setCurrentConversation(nextConversation)
        } else {
          // Only create new conversation if no conversations exist
          setCurrentConversation(null)
          setMessages([])
        }
      }
    }
    return success
  }

  const deleteMultipleConversations = async (conversationIds: string[]) => {
    const results = await Promise.all(
      conversationIds.map(id => ChatService.deleteConversation(id))
    )
    
    if (results.some(success => success)) {
      const updatedConversations = conversations.filter(c => !conversationIds.includes(c.id))
      setConversations(updatedConversations)
      
      // If current conversation was deleted, select next available
      if (currentConversation && conversationIds.includes(currentConversation.id)) {
        if (updatedConversations.length > 0) {
          setCurrentConversation(updatedConversations[0])
        } else {
          setCurrentConversation(null)
          setMessages([])
        }
      }
    }
    
    return results.every(success => success)
  }

  const updateConversationTitle = async (conversationId: string, title: string) => {
    const success = await ChatService.updateConversationTitle(conversationId, title)
    if (success) {
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? { ...c, title } : c)
      )
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev => prev ? { ...prev, title } : null)
      }
    }
  }

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    sending,
    loadConversations,
    createNewConversation,
    selectConversation,
    sendMessage,
    deleteConversation,
    deleteMultipleConversations,
    updateConversationTitle
  }
}