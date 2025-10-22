import React, { createContext, useContext, useEffect, useState } from 'react';
import { ChatService } from '../lib/chatService';
import { Conversation, Message } from '../lib/supabase';

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  switchingConversation: boolean;
  loadConversations: () => Promise<void>;
  createNewConversation: (title?: string) => Promise<Conversation | null>;
  selectConversation: (conversation: Conversation) => void;
  sendMessage: (content: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  deleteMultipleConversations: (conversationIds: string[]) => Promise<boolean>;
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [switchingConversation, setSwitchingConversation] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation?.id]);

  const loadConversations = async () => {
    setLoading(true);
    const convs = await ChatService.getConversations();
    setConversations(convs);
    
    // Update current conversation if it exists in the new list (to get updated title)
    if (currentConversation) {
      const updatedCurrentConv = convs.find(c => c.id === currentConversation.id);
      if (updatedCurrentConv) {
        setCurrentConversation(updatedCurrentConv);
      }
    }
    
    // If no current conversation and we have conversations, select the first one
    if (!currentConversation && convs.length > 0) {
      setCurrentConversation(convs[0]);
    }
    setLoading(false);
  };

  const loadMessages = async (conversationId: string) => {
    setLoading(true);
    const msgs = await ChatService.getMessages(conversationId);
    setMessages(msgs);
    setLoading(false);
    setSwitchingConversation(false);
  };

  const createNewConversation = async (title?: string) => {
    const newConv = await ChatService.createConversation(title);
    if (newConv) {
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversation(newConv);
      setMessages([]);
    }
    return newConv;
  };

  const selectConversation = (conversation: Conversation) => {
    // Only set switching flag if it's actually a different conversation
    if (currentConversation?.id !== conversation.id) {
      setSwitchingConversation(true);
      // Clear messages immediately for smooth transition
      setMessages([]);
    }
    setCurrentConversation(conversation);
  };

  const sendMessage = async (content: string) => {
    if (!currentConversation || sending) return;

    setSending(true);
    
    try {
      // Send to agent and get response
      const response = await ChatService.sendToAgent(currentConversation.id, content);
      
      if (response) {
        // Reload messages to get the latest state
        await loadMessages(currentConversation.id);
        
        // Update conversations list to reflect new updated_at time and title
        const updatedConversations = await ChatService.getConversations();
        setConversations(updatedConversations);
        
        // Update current conversation with latest data (including title)
        const updatedCurrentConv = updatedConversations.find(c => c.id === currentConversation.id);
        if (updatedCurrentConv) {
          setCurrentConversation(updatedCurrentConv);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    const success = await ChatService.deleteConversation(conversationId);
    if (success) {
      const updatedConversations = conversations.filter(c => c.id !== conversationId);
      setConversations(updatedConversations);
      
      // If we deleted the current conversation, select the next available one
      if (currentConversation?.id === conversationId) {
        if (updatedConversations.length > 0) {
          // Find the next conversation in the list
          const currentIndex = conversations.findIndex(c => c.id === conversationId);
          let nextConversation = updatedConversations[currentIndex] || updatedConversations[currentIndex - 1] || updatedConversations[0];
          setCurrentConversation(nextConversation);
        } else {
          // Only create new conversation if no conversations exist
          setCurrentConversation(null);
          setMessages([]);
        }
      }
    }
    return success;
  };

  const deleteMultipleConversations = async (conversationIds: string[]) => {
    const results = await Promise.all(
      conversationIds.map(id => ChatService.deleteConversation(id))
    );
    
    if (results.some(success => success)) {
      const updatedConversations = conversations.filter(c => !conversationIds.includes(c.id));
      setConversations(updatedConversations);
      
      // If current conversation was deleted, select next available
      if (currentConversation && conversationIds.includes(currentConversation.id)) {
        if (updatedConversations.length > 0) {
          setCurrentConversation(updatedConversations[0]);
        } else {
          setCurrentConversation(null);
          setMessages([]);
        }
      }
    }
    
    return results.every(success => success);
  };

  const updateConversationTitle = async (conversationId: string, title: string) => {
    const success = await ChatService.updateConversationTitle(conversationId, title);
    if (success) {
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? { ...c, title } : c)
      );
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev => prev ? { ...prev, title } : null);
      }
    }
  };

  const value: ChatContextType = {
    conversations,
    currentConversation,
    messages,
    loading,
    sending,
    switchingConversation,
    loadConversations,
    createNewConversation,
    selectConversation,
    sendMessage,
    deleteConversation,
    deleteMultipleConversations,
    updateConversationTitle,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};