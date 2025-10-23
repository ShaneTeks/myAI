import React, { createContext, useContext, useEffect, useState } from 'react';
import { ChatService } from '../lib/chatService';
import { ConversationContext, elevenLabsService, VoiceTranscript } from '../lib/elevenLabsService';
import { Conversation, Message, VoiceSession } from '../lib/supabase';

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
  
  // Voice session state
  voiceSession: VoiceSession | null;
  isVoiceSupported: boolean;
  voiceSessionLoading: boolean;
  
  // Voice actions
  startVoiceSession: () => Promise<VoiceSession>;
  endVoiceSession: () => Promise<void>;
  syncVoiceTranscript: (transcript: VoiceTranscript) => Promise<void>;
  getVoiceSessionContext: () => Promise<ConversationContext>;
  
  // Agent capability methods
  testAgentCapabilities: () => Promise<any>;
  getAgentStatus: () => any;
  synchronizeWithN8n: () => Promise<any>;
  
  // Error recovery methods
  handleVoiceSessionInterruption: (interruptionType: 'app_background' | 'phone_call' | 'system_interrupt' | 'user_abort' | 'network_error') => Promise<any>;
  recoverVoiceSession: () => Promise<any>;
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
  
  // Voice session state
  const [voiceSession, setVoiceSession] = useState<VoiceSession | null>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [voiceSessionLoading, setVoiceSessionLoading] = useState(false);

  // Load conversations on mount and check voice support
  useEffect(() => {
    loadConversations();
    checkVoiceSupport();
  }, []);

  // Check for active voice session when conversation changes
  useEffect(() => {
    if (currentConversation) {
      checkActiveVoiceSession(currentConversation.id);
    } else {
      setVoiceSession(null);
    }
  }, [currentConversation?.id]);

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
    
    // Don't auto-select conversations - let user choose which conversation to open
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

    // Create a temporary user message to show immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConversation.id,
      content,
      is_user: true,
      created_at: new Date().toISOString(),
      audio_url: null,
      message_type: 'text',
      user_id: null,
      voice_session_id: null,
    };

    // Add user message immediately for instant display
    setMessages(prev => [...prev, tempUserMessage]);
    setSending(true);
    
    try {
      // Send to agent and get response
      const response = await ChatService.sendToAgent(currentConversation.id, content);
      
      // Always reload messages to get the latest state (this will replace the temp message with real ones)
      await loadMessages(currentConversation.id);
      
      // Update conversations list to reflect new updated_at time and title
      const updatedConversations = await ChatService.getConversations();
      setConversations(updatedConversations);
      
      // Update current conversation with latest data (including title)
      const updatedCurrentConv = updatedConversations.find(c => c.id === currentConversation.id);
      if (updatedCurrentConv) {
        setCurrentConversation(updatedCurrentConv);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
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

  // ===== VOICE SESSION METHODS =====

  /**
   * Check if voice functionality is supported in current environment
   */
  const checkVoiceSupport = () => {
    const supported = elevenLabsService.isWidgetSupported();
    setIsVoiceSupported(supported);
    
    if (!supported) {
      const status = elevenLabsService.getWidgetSupportStatus();
      console.log('Voice not supported:', status.reason);
    }
  };

  /**
   * Check for active voice session in current conversation
   */
  const checkActiveVoiceSession = async (conversationId: string) => {
    try {
      const activeSession = await elevenLabsService.getActiveVoiceSession(conversationId);
      setVoiceSession(activeSession);
    } catch (error) {
      console.error('Failed to check active voice session:', error);
      setVoiceSession(null);
    }
  };

  /**
   * Start a new voice session for the current conversation with enhanced capabilities
   * Creates a new conversation if none exists
   */
  const startVoiceSession = async (): Promise<VoiceSession> => {
    if (!isVoiceSupported) {
      throw new Error('Voice sessions are not supported in this environment');
    }

    if (voiceSession) {
      throw new Error('Voice session is already active');
    }

    setVoiceSessionLoading(true);

    try {
      // Create a new conversation if none exists
      let conversationToUse = currentConversation;
      if (!conversationToUse) {
        console.log('No active conversation, creating new one for voice session');
        conversationToUse = await createNewConversation('Voice Chat');
        if (!conversationToUse) {
          throw new Error('Failed to create conversation for voice session');
        }
      }

      // Prepare enhanced conversation context with agent capabilities
      const basicContext = await elevenLabsService.prepareComprehensiveContext(conversationToUse.id);
      const enhancedContext = elevenLabsService.prepareAgentContext(basicContext);
      
      // Start the voice session with enhanced context and error recovery
      const newSession = await elevenLabsService.startVoiceSession(conversationToUse.id, enhancedContext);
      
      setVoiceSession(newSession);
      console.log('Voice session started with enhanced capabilities:', newSession.id);
      
      return newSession;
    } catch (error) {
      console.error('Failed to start voice session:', error);
      
      // Enhanced error handling with specific error types
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('connection')) {
          throw new Error('network: Unable to connect to voice services. Please check your internet connection.');
        } else if (error.message.includes('permission')) {
          throw new Error('permission: Microphone permission is required for voice chat.');
        } else if (error.message.includes('configuration')) {
          throw new Error('configuration: Voice chat is not properly configured. Please restart the app.');
        }
      }
      
      throw error;
    } finally {
      setVoiceSessionLoading(false);
    }
  };

  /**
   * End the current voice session and sync transcript
   */
  const endVoiceSession = async (): Promise<void> => {
    if (!voiceSession) {
      console.warn('No active voice session to end');
      return;
    }

    setVoiceSessionLoading(true);
    const sessionId = voiceSession.id;

    try {
      // End the voice session with error recovery
      await elevenLabsService.endVoiceSession(sessionId);
      
      // Clear the voice session state
      setVoiceSession(null);
      
      // Reload messages to include any new voice messages
      if (currentConversation) {
        await loadMessages(currentConversation.id);
        
        // Update conversations list to reflect new activity
        await loadConversations();
      }
      
      console.log('Voice session ended:', sessionId);
    } catch (error) {
      console.error('Failed to end voice session:', error);
      
      // Clear session state even if ending failed to prevent UI issues
      setVoiceSession(null);
      
      // Try to handle the error gracefully
      if (error instanceof Error && error.message.includes('network')) {
        // For network errors, try to preserve session state
        try {
          await elevenLabsService.handleNetworkError(sessionId, error);
          console.log('Session state preserved due to network error');
        } catch (preserveError) {
          console.error('Failed to preserve session state:', preserveError);
        }
      }
      
      throw error;
    } finally {
      setVoiceSessionLoading(false);
    }
  };

  /**
   * Sync voice transcript to database and update messages
   */
  const syncVoiceTranscript = async (transcript: VoiceTranscript): Promise<void> => {
    if (!voiceSession) {
      throw new Error('No active voice session to sync transcript');
    }

    try {
      // Sync transcript to database
      await elevenLabsService.syncVoiceTranscript(voiceSession.id, transcript);
      
      // Reload messages to show the new voice messages
      if (currentConversation) {
        await loadMessages(currentConversation.id);
      }
      
      console.log('Voice transcript synced for session:', voiceSession.id);
    } catch (error) {
      console.error('Failed to sync voice transcript:', error);
      throw error;
    }
  };

  /**
   * Get conversation context for voice session
   * Creates a new conversation if none exists
   */
  const getVoiceSessionContext = async (): Promise<ConversationContext> => {
    try {
      // Create a new conversation if none exists
      let conversationToUse = currentConversation;
      if (!conversationToUse) {
        console.log('No active conversation, creating new one for voice context');
        conversationToUse = await createNewConversation('Voice Chat');
        if (!conversationToUse) {
          throw new Error('Failed to create conversation for voice context');
        }
      }

      return await elevenLabsService.prepareComprehensiveContext(conversationToUse.id);
    } catch (error) {
      console.error('Failed to get voice session context:', error);
      throw error;
    }
  };

  // ===== AGENT CAPABILITY METHODS =====

  /**
   * Test all agent capabilities (weather, structured responses, continuity)
   */
  const testAgentCapabilities = async () => {
    try {
      const results = await elevenLabsService.runCapabilityTests();
      console.log('Agent capability test results:', results);
      return results;
    } catch (error) {
      console.error('Failed to test agent capabilities:', error);
      throw error;
    }
  };

  /**
   * Get comprehensive agent status including capabilities
   */
  const getAgentStatus = () => {
    try {
      const status = elevenLabsService.getComprehensiveStatus();
      console.log('Agent status:', status);
      return status;
    } catch (error) {
      console.error('Failed to get agent status:', error);
      throw error;
    }
  };

  /**
   * Synchronize agent capabilities with n8n
   */
  const synchronizeWithN8n = async () => {
    try {
      const syncResult = await elevenLabsService.synchronizeWithN8nAgent();
      console.log('N8n synchronization result:', syncResult);
      return syncResult;
    } catch (error) {
      console.error('Failed to synchronize with n8n:', error);
      throw error;
    }
  };

  /**
   * Handle voice session interruption (network issues, app backgrounding, etc.)
   */
  const handleVoiceSessionInterruption = async (
    interruptionType: 'app_background' | 'phone_call' | 'system_interrupt' | 'user_abort' | 'network_error'
  ) => {
    if (!voiceSession) {
      console.warn('No active voice session to handle interruption');
      return;
    }

    try {
      console.log(`Handling voice session interruption: ${interruptionType}`);
      
      if (interruptionType === 'network_error') {
        // Handle network errors specifically
        const networkResult = await elevenLabsService.handleNetworkError(voiceSession.id, new Error('Network interruption'));
        console.log('Network error handling result:', networkResult);
        
        if (networkResult.strategy === 'abort') {
          // Clear session if it was aborted
          setVoiceSession(null);
        }
        
        return networkResult;
      } else {
        // Handle other types of interruptions
        const interruptionResult = await elevenLabsService.handleSessionInterruption(voiceSession.id, interruptionType);
        console.log('Session interruption handling result:', interruptionResult);
        
        if (interruptionType === 'user_abort' || !interruptionResult.recoveryPossible) {
          // Clear session if it can't be recovered
          setVoiceSession(null);
        }
        
        return interruptionResult;
      }
    } catch (error) {
      console.error('Failed to handle voice session interruption:', error);
      // Clear session state to prevent UI issues
      setVoiceSession(null);
      throw error;
    }
  };

  /**
   * Attempt to recover from voice session interruption
   */
  const recoverVoiceSession = async () => {
    if (!voiceSession) {
      console.warn('No voice session to recover');
      return { recovered: false, error: 'No session to recover' };
    }

    try {
      console.log('Attempting to recover voice session:', voiceSession.id);
      
      const recoveryResult = await elevenLabsService.recoverFromInterruption(voiceSession.id);
      console.log('Voice session recovery result:', recoveryResult);
      
      if (recoveryResult.recovered) {
        // Session was recovered successfully, keep it active
        console.log('Voice session recovered successfully');
      } else {
        // Recovery failed, clear session state
        setVoiceSession(null);
      }
      
      return recoveryResult;
    } catch (error) {
      console.error('Failed to recover voice session:', error);
      setVoiceSession(null);
      throw error;
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
    
    // Voice session state
    voiceSession,
    isVoiceSupported,
    voiceSessionLoading,
    
    // Voice actions
    startVoiceSession,
    endVoiceSession,
    syncVoiceTranscript,
    getVoiceSessionContext,
    
    // Agent capability methods
    testAgentCapabilities,
    getAgentStatus,
    synchronizeWithN8n,
    
    // Error recovery methods
    handleVoiceSessionInterruption,
    recoverVoiceSession,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};