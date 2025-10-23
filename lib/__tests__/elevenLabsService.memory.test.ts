import { config } from '../config';
import { ElevenLabsService } from '../elevenLabsService';
import { supabase } from '../supabase';

// Mock dependencies
jest.mock('../supabase');
jest.mock('../config');

describe('ElevenLabsService - Memory Synchronization', () => {
  let service: ElevenLabsService;
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = ElevenLabsService.getInstance();
    
    (config as any).elevenLabs = {
      widget: {
        maxContextLength: 4000,
      },
    };
  });

  describe('syncVoiceTranscript', () => {
    const mockTranscript = {
      sessionId: 'session-123',
      messages: [
        {
          id: 'voice-1',
          role: 'user' as const,
          content: 'Hello, what is the weather?',
          timestamp: new Date('2023-01-01T10:00:00Z'),
        },
        {
          id: 'voice-2',
          role: 'agent' as const,
          content: 'The weather is sunny and 25°C',
          timestamp: new Date('2023-01-01T10:01:00Z'),
          widgets: [
            {
              type: 'weather',
              data: {
                type: 'current',
                location: 'Test City',
                temperature: '25°C',
                condition: 'Sunny',
              },
            },
          ],
        },
      ],
      endedAt: new Date('2023-01-01T10:02:00Z'),
    };

    beforeEach(() => {
      // Mock session lookup
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { conversation_id: 'conv-123' },
          error: null,
        }),
      } as any);

      // Mock message insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'msg-1' }, { id: 'msg-2' }],
          error: null,
        }),
      } as any);

      // Mock session update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);
    });

    it('should sync voice transcript to database messages', async () => {
      const result = await service.syncVoiceTranscript('session-123', mockTranscript);
      
      expect(result).toEqual(['msg-1', 'msg-2']);
      expect(mockSupabase.from).toHaveBeenCalledWith('voice_sessions');
      expect(mockSupabase.from).toHaveBeenCalledWith('messages');
    });

    it('should throw error when session not found', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Session not found' },
        }),
      } as any);

      await expect(service.syncVoiceTranscript('nonexistent-session', mockTranscript))
        .rejects.toThrow('Voice session not found: nonexistent-session');
    });

    it('should throw error when session has no conversation', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { conversation_id: null },
          error: null,
        }),
      } as any);

      await expect(service.syncVoiceTranscript('session-123', mockTranscript))
        .rejects.toThrow('Voice session has no associated conversation');
    });

    it('should convert voice messages to proper database format', async () => {
      let insertedMessages: any[] = [];
      
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockImplementation((messages) => {
          insertedMessages = messages;
          return {
            select: jest.fn().mockResolvedValue({
              data: messages.map((_: any, i: number) => ({ id: `msg-${i + 1}` })),
              error: null,
            }),
          };
        }),
      } as any);

      await service.syncVoiceTranscript('session-123', mockTranscript);
      
      expect(insertedMessages).toHaveLength(2);
      expect(insertedMessages[0]).toMatchObject({
        conversation_id: 'conv-123',
        voice_session_id: 'session-123',
        content: 'Hello, what is the weather?',
        is_user: true,
        message_type: 'voice',
        audio_url: null,
      });

      // Agent message should have structured content
      expect(insertedMessages[1]).toMatchObject({
        conversation_id: 'conv-123',
        voice_session_id: 'session-123',
        is_user: false,
        message_type: 'voice',
      });

      // Check structured content format
      const agentContent = JSON.parse(insertedMessages[1].content);
      expect(agentContent[0].output.weatherAgent.weather).toBe(true);
      expect(agentContent[0].output.weatherAgent.output.location).toBe('Test City');
    });

    it('should handle message insertion errors', async () => {
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      } as any);

      await expect(service.syncVoiceTranscript('session-123', mockTranscript))
        .rejects.toThrow('Failed to sync voice transcript: Insert failed');
    });
  });

  describe('getConversationHistory', () => {
    const mockMessages = [
      {
        id: '1',
        conversation_id: 'conv-123',
        content: 'Hello',
        is_user: true,
        message_type: 'text',
        created_at: '2023-01-01T10:00:00Z',
      },
      {
        id: '2',
        conversation_id: 'conv-123',
        content: 'Voice message',
        is_user: false,
        message_type: 'voice',
        created_at: '2023-01-01T10:01:00Z',
      },
    ];

    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockMessages,
          error: null,
        }),
      } as any);
    });

    it('should get conversation history including voice messages', async () => {
      const result = await service.getConversationHistory('conv-123', true, 50);
      
      expect(result).toEqual(mockMessages);
      expect(mockSupabase.from).toHaveBeenCalledWith('messages');
    });

    it('should get conversation history excluding voice messages', async () => {
      const textOnlyMessages = mockMessages.filter(m => m.message_type !== 'voice');
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: textOnlyMessages,
          error: null,
        }),
      } as any);

      const result = await service.getConversationHistory('conv-123', false, 50);
      
      expect(result).toEqual(textOnlyMessages);
    });

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      } as any);

      await expect(service.getConversationHistory('conv-123'))
        .rejects.toThrow('Failed to get conversation history: Database error');
    });
  });

  describe('prepareComprehensiveContext', () => {
    beforeEach(() => {
      jest.spyOn(service, 'getConversationHistory').mockResolvedValue([
        {
          id: '1',
          conversation_id: 'conv-123',
          content: 'Hello',
          is_user: true,
          message_type: 'text',
          audio_url: null,
          voice_session_id: null,
          user_id: 'user1',
          created_at: '2023-01-01T10:00:00Z',
        },
      ]);
    });

    it('should prepare comprehensive context from conversation history', async () => {
      const result = await service.prepareComprehensiveContext('conv-123', 2000);
      
      expect(result.recentMessages).toHaveLength(1);
      expect(result.maxTokens).toBe(2000);
      expect(result.conversationSummary).toContain('1 user messages and 0 agent responses');
      expect(service.getConversationHistory).toHaveBeenCalledWith('conv-123', false);
    });

    it('should use default max length when not specified', async () => {
      const result = await service.prepareComprehensiveContext('conv-123');
      
      expect(result.maxTokens).toBe(4000);
    });
  });

  describe('createContinuitySummary', () => {
    beforeEach(() => {
      jest.spyOn(service, 'getConversationHistory').mockResolvedValue([
        {
          id: '1',
          conversation_id: 'conv-123',
          content: 'Hello, how are you?',
          is_user: true,
          message_type: 'text',
          audio_url: null,
          voice_session_id: null,
          user_id: 'user1',
          created_at: '2023-01-01T10:00:00Z',
        },
        {
          id: '2',
          conversation_id: 'conv-123',
          content: 'I am doing well, thank you!',
          is_user: false,
          message_type: 'text',
          audio_url: null,
          voice_session_id: null,
          user_id: null,
          created_at: '2023-01-01T10:01:00Z',
        },
        {
          id: '3',
          conversation_id: 'conv-123',
          content: 'Voice response',
          is_user: false,
          message_type: 'voice',
          audio_url: 'https://example.com/audio.mp3',
          voice_session_id: 'session-1',
          user_id: null,
          created_at: '2023-01-01T10:02:00Z',
        },
      ]);
    });

    it('should create continuity summary with message counts and recent context', async () => {
      const result = await service.createContinuitySummary('conv-123');
      
      expect(result).toContain('Total messages: 3 (2 text, 1 voice)');
      expect(result).toContain('User: Hello, how are you?');
      expect(result).toContain('Agent: I am doing well, thank you!');
      expect(result).toContain('Agent: Voice response');
      expect(result).toContain('mixed text and voice interactions');
    });

    it('should handle empty conversation', async () => {
      jest.spyOn(service, 'getConversationHistory').mockResolvedValue([]);
      
      const result = await service.createContinuitySummary('conv-123');
      
      expect(result).toBe('New conversation with no previous messages.');
    });
  });

  describe('capturePartialTranscript', () => {
    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);
    });

    it('should capture partial transcript successfully', async () => {
      const partialTranscript = {
        sessionId: 'session-123',
        messages: [
          {
            id: 'voice-1',
            role: 'user' as const,
            content: 'Hello',
            timestamp: new Date(),
          },
        ],
      };

      const result = await service.capturePartialTranscript('session-123', partialTranscript);
      
      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('voice_sessions');
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      } as any);

      const result = await service.capturePartialTranscript('session-123', {});
      
      expect(result).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue(new Error('Network error')),
      } as any);

      const result = await service.capturePartialTranscript('session-123', {});
      
      expect(result).toBe(false);
    });
  });

  describe('restoreConversationContext', () => {
    beforeEach(() => {
      // Mock voice sessions query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            {
              transcript: JSON.stringify({
                messages: [{ id: '1', content: 'Voice message' }],
                summary: 'Weather discussion',
              }),
              ended_at: '2023-01-01T10:00:00Z',
            },
          ],
          error: null,
        }),
      } as any);

      // Mock text messages query
      jest.spyOn(service, 'getConversationHistory').mockResolvedValue([
        {
          id: '1',
          conversation_id: 'conv-123',
          content: 'Text message',
          is_user: true,
          message_type: 'text',
          audio_url: null,
          voice_session_id: null,
          user_id: 'user1',
          created_at: '2023-01-01T09:00:00Z',
        },
      ]);
    });

    it('should restore context with voice session summaries', async () => {
      const result = await service.restoreConversationContext('conv-123');
      
      expect(result.recentMessages).toHaveLength(1);
      expect(result.conversationSummary).toContain('1 user messages and 0 agent responses');
      expect(result.conversationSummary).toContain('Recent voice sessions:');
      expect(result.conversationSummary).toContain('Voice session (1 messages): Weather discussion');
    });

    it('should handle voice sessions query errors gracefully', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Query failed' },
        }),
      } as any);

      const result = await service.restoreConversationContext('conv-123');
      
      expect(result.recentMessages).toHaveLength(1);
      expect(result.conversationSummary).not.toContain('Recent voice sessions:');
    });

    it('should handle invalid transcript JSON gracefully', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            {
              transcript: 'invalid json',
              ended_at: '2023-01-01T10:00:00Z',
            },
          ],
          error: null,
        }),
      } as any);

      const result = await service.restoreConversationContext('conv-123');
      
      expect(result.conversationSummary).toContain('Voice session: Unable to parse transcript');
    });
  });

  describe('ensureContinuity', () => {
    beforeEach(() => {
      jest.spyOn(service, 'restoreConversationContext').mockResolvedValue({
        recentMessages: [
          {
            id: '1',
            conversation_id: 'conv-123',
            content: 'Previous message',
            is_user: true,
            message_type: 'text',
            audio_url: null,
            voice_session_id: null,
            user_id: 'user1',
            created_at: '2023-01-01T09:00:00Z',
          },
        ],
        maxTokens: 4000,
        conversationSummary: 'Previous conversation',
      });
    });

    it('should ensure continuity by adding new voice message to context', async () => {
      const newVoiceMessage = {
        id: 'voice-1',
        role: 'user' as const,
        content: 'New voice message',
        timestamp: new Date('2023-01-01T10:00:00Z'),
      };

      const result = await service.ensureContinuity('conv-123', newVoiceMessage);
      
      expect(result.recentMessages).toHaveLength(2);
      expect(result.recentMessages[1].content).toBe('New voice message');
      expect(result.recentMessages[1].message_type).toBe('voice');
      expect(result.conversationSummary).toContain('1 user messages and 0 agent responses');
    });

    it('should handle agent voice messages', async () => {
      const newVoiceMessage = {
        id: 'voice-1',
        role: 'agent' as const,
        content: 'Agent voice response',
        timestamp: new Date('2023-01-01T10:00:00Z'),
        audioUrl: 'https://example.com/audio.mp3',
      };

      const result = await service.ensureContinuity('conv-123', newVoiceMessage);
      
      expect(result.recentMessages[1].is_user).toBe(false);
      expect(result.recentMessages[1].audio_url).toBe('https://example.com/audio.mp3');
    });
  });
});