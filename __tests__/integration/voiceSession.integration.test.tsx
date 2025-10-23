import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { ChatProvider, useChatContext } from '../../contexts/ChatContext';
import { ChatService } from '../../lib/chatService';
import { elevenLabsService } from '../../lib/elevenLabsService';
import { supabase } from '../../lib/supabase';

// Mock dependencies
jest.mock('../../lib/elevenLabsService');
jest.mock('../../lib/chatService');
jest.mock('../../lib/supabase');

// Test component to access ChatContext
const TestComponent: React.FC<{ onContextReady?: (context: any) => void }> = ({ onContextReady }) => {
  const context = useChatContext();
  
  React.useEffect(() => {
    if (onContextReady) {
      onContextReady(context);
    }
  }, [context, onContextReady]);
  
  return null;
};

describe('Voice Session Integration Tests', () => {
  const mockElevenLabsService = elevenLabsService as jest.Mocked<typeof elevenLabsService>;
  const mockChatService = ChatService as jest.Mocked<typeof ChatService>;
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  let chatContext: any;

  const mockConversation = {
    id: 'conv-123',
    title: 'Test Conversation',
    user_id: 'user-123',
    created_at: '2023-01-01T10:00:00Z',
    updated_at: '2023-01-01T10:00:00Z',
  };

  const mockVoiceSession = {
    id: 'session-123',
    user_id: 'user-123',
    conversation_id: 'conv-123',
    agent_id: 'agent-123',
    status: 'active' as const,
    started_at: '2023-01-01T10:00:00Z',
    ended_at: null,
    transcript: null,
    created_at: '2023-01-01T10:00:00Z',
  };

  const mockMessages = [
    {
      id: 'msg-1',
      conversation_id: 'conv-123',
      content: 'Hello',
      is_user: true,
      message_type: 'text' as const,
      audio_url: null,
      voice_session_id: null,
      user_id: 'user-123',
      created_at: '2023-01-01T10:00:00Z',
    },
    {
      id: 'msg-2',
      conversation_id: 'conv-123',
      content: 'Hi there!',
      is_user: false,
      message_type: 'text' as const,
      audio_url: null,
      voice_session_id: null,
      user_id: null,
      created_at: '2023-01-01T10:01:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    chatContext = null;

    // Setup default mocks
    mockElevenLabsService.isWidgetSupported.mockReturnValue(true);
    mockElevenLabsService.getActiveVoiceSession.mockResolvedValue(null);
    mockChatService.getConversations.mockResolvedValue([mockConversation]);
    mockChatService.getMessages.mockResolvedValue(mockMessages);
  });

  const renderChatProvider = async () => {
    let contextReady: (context: any) => void;
    const contextPromise = new Promise<any>((resolve) => {
      contextReady = resolve;
    });

    render(
      <ChatProvider>
        <TestComponent onContextReady={contextReady!} />
      </ChatProvider>
    );

    chatContext = await contextPromise;
    return chatContext;
  };

  describe('Voice Session Lifecycle', () => {
    it('should start voice session successfully', async () => {
      await renderChatProvider();
      
      // Setup mocks for starting voice session
      mockElevenLabsService.prepareComprehensiveContext.mockResolvedValue({
        recentMessages: mockMessages,
        maxTokens: 4000,
        conversationSummary: 'Test conversation',
      });
      
      mockElevenLabsService.prepareAgentContext.mockReturnValue({
        recentMessages: mockMessages,
        maxTokens: 4000,
        conversationSummary: 'Test conversation',
        agentCapabilities: {},
        instructions: 'Test instructions',
      });
      
      mockElevenLabsService.startVoiceSession.mockResolvedValue(mockVoiceSession);

      // Select conversation first
      act(() => {
        chatContext.selectConversation(mockConversation);
      });

      // Start voice session
      let startedSession: any;
      await act(async () => {
        startedSession = await chatContext.startVoiceSession();
      });

      expect(startedSession).toEqual(mockVoiceSession);
      expect(chatContext.voiceSession).toEqual(mockVoiceSession);
      expect(mockElevenLabsService.prepareComprehensiveContext).toHaveBeenCalledWith('conv-123');
      expect(mockElevenLabsService.startVoiceSession).toHaveBeenCalledWith(
        'conv-123',
        expect.objectContaining({
          recentMessages: mockMessages,
          agentCapabilities: {},
          instructions: 'Test instructions',
        })
      );
    });

    it('should end voice session and reload messages', async () => {
      await renderChatProvider();
      
      // Setup initial voice session
      act(() => {
        chatContext.selectConversation(mockConversation);
        (chatContext as any).setVoiceSession(mockVoiceSession);
      });

      // Setup mocks for ending voice session
      mockElevenLabsService.endVoiceSession.mockResolvedValue(mockVoiceSession);
      mockChatService.getMessages.mockResolvedValue([
        ...mockMessages,
        {
          id: 'voice-msg-1',
          conversation_id: 'conv-123',
          content: 'Voice message',
          is_user: false,
          message_type: 'voice' as const,
          audio_url: 'https://example.com/audio.mp3',
          voice_session_id: 'session-123',
          user_id: null,
          created_at: '2023-01-01T10:02:00Z',
        },
      ]);

      // End voice session
      await act(async () => {
        await chatContext.endVoiceSession();
      });

      expect(mockElevenLabsService.endVoiceSession).toHaveBeenCalledWith('session-123');
      expect(chatContext.voiceSession).toBeNull();
      expect(mockChatService.getMessages).toHaveBeenCalledWith('conv-123');
      expect(chatContext.messages).toHaveLength(3); // Original 2 + 1 voice message
    });

    it('should handle voice session start errors gracefully', async () => {
      await renderChatProvider();
      
      act(() => {
        chatContext.selectConversation(mockConversation);
      });

      // Mock network error
      mockElevenLabsService.startVoiceSession.mockRejectedValue(
        new Error('network: Connection failed')
      );

      let thrownError: any;
      await act(async () => {
        try {
          await chatContext.startVoiceSession();
        } catch (error) {
          thrownError = error;
        }
      });

      expect(thrownError).toBeDefined();
      expect(thrownError.message).toContain('network: Unable to connect to voice services');
      expect(chatContext.voiceSession).toBeNull();
      expect(chatContext.voiceSessionLoading).toBe(false);
    });

    it('should handle voice session end errors with network recovery', async () => {
      await renderChatProvider();
      
      // Setup initial voice session
      act(() => {
        chatContext.selectConversation(mockConversation);
        (chatContext as any).setVoiceSession(mockVoiceSession);
      });

      // Mock network error during end
      mockElevenLabsService.endVoiceSession.mockRejectedValue(
        new Error('network: Connection timeout')
      );
      
      mockElevenLabsService.handleNetworkError.mockResolvedValue({
        strategy: 'preserve' as const,
        actions: ['Session state preserved'],
        recovered: false,
      });

      let thrownError: any;
      await act(async () => {
        try {
          await chatContext.endVoiceSession();
        } catch (error) {
          thrownError = error;
        }
      });

      expect(thrownError).toBeDefined();
      expect(mockElevenLabsService.handleNetworkError).toHaveBeenCalledWith(
        'session-123',
        expect.any(Error)
      );
      expect(chatContext.voiceSession).toBeNull(); // Should clear even on error
    });
  });

  describe('Message Synchronization', () => {
    it('should sync voice transcript and update messages', async () => {
      await renderChatProvider();
      
      // Setup voice session
      act(() => {
        chatContext.selectConversation(mockConversation);
        (chatContext as any).setVoiceSession(mockVoiceSession);
      });

      const mockTranscript = {
        sessionId: 'session-123',
        messages: [
          {
            id: 'voice-1',
            role: 'user' as const,
            content: 'What is the weather?',
            timestamp: new Date('2023-01-01T10:00:00Z'),
          },
          {
            id: 'voice-2',
            role: 'agent' as const,
            content: 'The weather is sunny',
            timestamp: new Date('2023-01-01T10:01:00Z'),
            widgets: [
              {
                type: 'weather',
                data: { location: 'Test City', temperature: '25°C' },
              },
            ],
          },
        ],
        endedAt: new Date('2023-01-01T10:02:00Z'),
      };

      // Setup mocks
      mockElevenLabsService.syncVoiceTranscript.mockResolvedValue(['msg-3', 'msg-4']);
      mockChatService.getMessages.mockResolvedValue([
        ...mockMessages,
        {
          id: 'msg-3',
          conversation_id: 'conv-123',
          content: 'What is the weather?',
          is_user: true,
          message_type: 'voice' as const,
          audio_url: null,
          voice_session_id: 'session-123',
          user_id: 'user-123',
          created_at: '2023-01-01T10:00:00Z',
        },
        {
          id: 'msg-4',
          conversation_id: 'conv-123',
          content: JSON.stringify([{
            output: {
              AIResponse: 'The weather is sunny',
              weatherAgent: {
                weather: true,
                output: { location: 'Test City', temperature: '25°C' },
              },
            },
          }]),
          is_user: false,
          message_type: 'voice' as const,
          audio_url: null,
          voice_session_id: 'session-123',
          user_id: null,
          created_at: '2023-01-01T10:01:00Z',
        },
      ]);

      // Sync transcript
      await act(async () => {
        await chatContext.syncVoiceTranscript(mockTranscript);
      });

      expect(mockElevenLabsService.syncVoiceTranscript).toHaveBeenCalledWith(
        'session-123',
        mockTranscript
      );
      expect(mockChatService.getMessages).toHaveBeenCalledWith('conv-123');
      expect(chatContext.messages).toHaveLength(4); // Original 2 + 2 voice messages
    });

    it('should handle transcript sync errors', async () => {
      await renderChatProvider();
      
      act(() => {
        chatContext.selectConversation(mockConversation);
        (chatContext as any).setVoiceSession(mockVoiceSession);
      });

      const mockTranscript = {
        sessionId: 'session-123',
        messages: [],
        endedAt: new Date(),
      };

      mockElevenLabsService.syncVoiceTranscript.mockRejectedValue(
        new Error('Database sync failed')
      );

      let thrownError: any;
      await act(async () => {
        try {
          await chatContext.syncVoiceTranscript(mockTranscript);
        } catch (error) {
          thrownError = error;
        }
      });

      expect(thrownError).toBeDefined();
      expect(thrownError.message).toBe('Database sync failed');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle session interruption and preserve state', async () => {
      await renderChatProvider();
      
      // Setup voice session
      act(() => {
        chatContext.selectConversation(mockConversation);
        (chatContext as any).setVoiceSession(mockVoiceSession);
      });

      mockElevenLabsService.handleSessionInterruption.mockResolvedValue({
        handled: true,
        preservedState: true,
        recoveryPossible: true,
        actions: ['Session preserved for recovery'],
      });

      // Handle phone call interruption
      let result: any;
      await act(async () => {
        result = await chatContext.handleVoiceSessionInterruption('phone_call');
      });

      expect(result.handled).toBe(true);
      expect(result.recoveryPossible).toBe(true);
      expect(mockElevenLabsService.handleSessionInterruption).toHaveBeenCalledWith(
        'session-123',
        'phone_call'
      );
      expect(chatContext.voiceSession).toEqual(mockVoiceSession); // Should keep session for recovery
    });

    it('should clear session on user abort interruption', async () => {
      await renderChatProvider();
      
      act(() => {
        chatContext.selectConversation(mockConversation);
        (chatContext as any).setVoiceSession(mockVoiceSession);
      });

      mockElevenLabsService.handleSessionInterruption.mockResolvedValue({
        handled: true,
        preservedState: false,
        recoveryPossible: false,
        actions: ['Session aborted by user'],
      });

      await act(async () => {
        await chatContext.handleVoiceSessionInterruption('user_abort');
      });

      expect(chatContext.voiceSession).toBeNull(); // Should clear session
    });

    it('should handle network errors with recovery strategy', async () => {
      await renderChatProvider();
      
      act(() => {
        chatContext.selectConversation(mockConversation);
        (chatContext as any).setVoiceSession(mockVoiceSession);
      });

      mockElevenLabsService.handleNetworkError.mockResolvedValue({
        strategy: 'retry' as const,
        actions: ['Network recovered', 'Session restored'],
        recovered: true,
      });

      let result: any;
      await act(async () => {
        result = await chatContext.handleVoiceSessionInterruption('network_error');
      });

      expect(result.strategy).toBe('retry');
      expect(result.recovered).toBe(true);
      expect(mockElevenLabsService.handleNetworkError).toHaveBeenCalledWith(
        'session-123',
        expect.any(Error)
      );
    });

    it('should recover from session interruption', async () => {
      await renderChatProvider();
      
      act(() => {
        chatContext.selectConversation(mockConversation);
        (chatContext as any).setVoiceSession(mockVoiceSession);
      });

      mockElevenLabsService.recoverFromInterruption.mockResolvedValue({
        recovered: true,
        actions: ['Session recovered successfully'],
      });

      let result: any;
      await act(async () => {
        result = await chatContext.recoverVoiceSession();
      });

      expect(result.recovered).toBe(true);
      expect(mockElevenLabsService.recoverFromInterruption).toHaveBeenCalledWith('session-123');
      expect(chatContext.voiceSession).toEqual(mockVoiceSession); // Should keep session
    });

    it('should clear session when recovery fails', async () => {
      await renderChatProvider();
      
      act(() => {
        chatContext.selectConversation(mockConversation);
        (chatContext as any).setVoiceSession(mockVoiceSession);
      });

      mockElevenLabsService.recoverFromInterruption.mockResolvedValue({
        recovered: false,
        error: 'Recovery failed',
        actions: ['Recovery attempt failed'],
      });

      let result: any;
      await act(async () => {
        result = await chatContext.recoverVoiceSession();
      });

      expect(result.recovered).toBe(false);
      expect(chatContext.voiceSession).toBeNull(); // Should clear session
    });
  });

  describe('Agent Capability Integration', () => {
    it('should test agent capabilities', async () => {
      await renderChatProvider();

      const mockCapabilityResults = {
        success: true,
        results: [
          { success: true, capability: 'weather', result: { widgetExtracted: true } },
          { success: true, capability: 'structured', result: { overallSuccess: true } },
          { success: true, capability: 'continuity', result: { contextPrepared: true } },
        ],
        summary: { total: 3, passed: 3, failed: 0 },
      };

      mockElevenLabsService.runCapabilityTests.mockResolvedValue(mockCapabilityResults);

      let result: any;
      await act(async () => {
        result = await chatContext.testAgentCapabilities();
      });

      expect(result).toEqual(mockCapabilityResults);
      expect(mockElevenLabsService.runCapabilityTests).toHaveBeenCalled();
    });

    it('should get comprehensive agent status', async () => {
      await renderChatProvider();

      const mockStatus = {
        platform: { os: 'ios', executionEnvironment: 'Prebuilt App' },
        widgetSupport: { supported: true, reason: 'All good' },
        configuration: { agentId: 'test-agent', widgetEnabled: true },
        validation: { valid: true, errors: [], warnings: [] },
        capabilities: { 
          valid: true, 
          capabilities: { weather: true, externalApis: true, structuredResponses: true },
          errors: [], 
          warnings: [] 
        },
        agentConfiguration: {
          agentId: 'test-agent',
          hasInstructions: true,
          instructionsLength: 1000,
          supportedCapabilities: ['weather', 'structured']
        },
        synchronization: { ready: true, missingRequirements: [] },
      };

      mockElevenLabsService.getComprehensiveStatus.mockReturnValue(mockStatus);

      let result: any;
      await act(async () => {
        result = chatContext.getAgentStatus();
      });

      expect(result).toEqual(mockStatus);
      expect(mockElevenLabsService.getComprehensiveStatus).toHaveBeenCalled();
    });

    it('should synchronize with n8n agent', async () => {
      await renderChatProvider();

      const mockSyncResult = {
        success: true,
        synchronized: ['Weather API access', 'Structured responses'],
        missing: [],
        errors: [],
      };

      mockElevenLabsService.synchronizeWithN8nAgent.mockResolvedValue(mockSyncResult);

      let result: any;
      await act(async () => {
        result = await chatContext.synchronizeWithN8n();
      });

      expect(result).toEqual(mockSyncResult);
      expect(mockElevenLabsService.synchronizeWithN8nAgent).toHaveBeenCalled();
    });
  });

  describe('Context Preparation and Continuity', () => {
    it('should prepare voice session context', async () => {
      await renderChatProvider();
      
      act(() => {
        chatContext.selectConversation(mockConversation);
      });

      const mockContext = {
        recentMessages: mockMessages,
        maxTokens: 4000,
        conversationSummary: 'Test conversation with 2 messages',
      };

      mockElevenLabsService.prepareComprehensiveContext.mockResolvedValue(mockContext);

      let result: any;
      await act(async () => {
        result = await chatContext.getVoiceSessionContext();
      });

      expect(result).toEqual(mockContext);
      expect(mockElevenLabsService.prepareComprehensiveContext).toHaveBeenCalledWith('conv-123');
    });

    it('should handle context preparation errors', async () => {
      await renderChatProvider();
      
      act(() => {
        chatContext.selectConversation(mockConversation);
      });

      mockElevenLabsService.prepareComprehensiveContext.mockRejectedValue(
        new Error('Context preparation failed')
      );

      let thrownError: any;
      await act(async () => {
        try {
          await chatContext.getVoiceSessionContext();
        } catch (error) {
          thrownError = error;
        }
      });

      expect(thrownError).toBeDefined();
      expect(thrownError.message).toBe('Context preparation failed');
    });
  });

  describe('Voice Support Detection', () => {
    it('should detect voice support on initialization', async () => {
      mockElevenLabsService.isWidgetSupported.mockReturnValue(true);
      
      await renderChatProvider();

      expect(chatContext.isVoiceSupported).toBe(true);
      expect(mockElevenLabsService.isWidgetSupported).toHaveBeenCalled();
    });

    it('should handle unsupported voice environment', async () => {
      mockElevenLabsService.isWidgetSupported.mockReturnValue(false);
      mockElevenLabsService.getWidgetSupportStatus.mockReturnValue({
        supported: false,
        reason: 'ExpoGO not supported',
        environment: 'Expo Go',
        canUseWidget: false,
        configurationValid: true,
      });

      await renderChatProvider();

      expect(chatContext.isVoiceSupported).toBe(false);
    });

    it('should prevent voice session start when not supported', async () => {
      mockElevenLabsService.isWidgetSupported.mockReturnValue(false);
      
      await renderChatProvider();
      
      act(() => {
        chatContext.selectConversation(mockConversation);
      });

      let thrownError: any;
      await act(async () => {
        try {
          await chatContext.startVoiceSession();
        } catch (error) {
          thrownError = error;
        }
      });

      expect(thrownError).toBeDefined();
      expect(thrownError.message).toBe('Voice sessions are not supported in this environment');
    });
  });

  describe('Active Session Detection', () => {
    it('should detect active voice session when conversation changes', async () => {
      const activeSession = { ...mockVoiceSession, status: 'active' as const };
      mockElevenLabsService.getActiveVoiceSession.mockResolvedValue(activeSession);

      await renderChatProvider();

      await act(async () => {
        chatContext.selectConversation(mockConversation);
      });

      await waitFor(() => {
        expect(chatContext.voiceSession).toEqual(activeSession);
      });

      expect(mockElevenLabsService.getActiveVoiceSession).toHaveBeenCalledWith('conv-123');
    });

    it('should handle active session detection errors', async () => {
      mockElevenLabsService.getActiveVoiceSession.mockRejectedValue(
        new Error('Session detection failed')
      );

      await renderChatProvider();

      await act(async () => {
        chatContext.selectConversation(mockConversation);
      });

      await waitFor(() => {
        expect(chatContext.voiceSession).toBeNull();
      });
    });
  });
});