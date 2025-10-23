import { config } from '../config';
import { ElevenLabsService } from '../elevenLabsService';
import { supabase } from '../supabase';

// Mock dependencies
jest.mock('../supabase');
jest.mock('../config');
jest.mock('../environmentDetector');

describe('ElevenLabsService - Voice Session Lifecycle', () => {
  let service: ElevenLabsService;
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = ElevenLabsService.getInstance();
    
    // Setup config mock
    (config as any).elevenLabs = {
      defaultAgentId: 'test-agent-id',
      widget: {
        enabled: true,
        sessionTimeout: 300000,
        maxContextLength: 4000,
      },
    };

    // Setup Supabase auth mock
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
  });

  describe('startVoiceSession', () => {
    const mockContext = {
      recentMessages: [],
      maxTokens: 4000,
      conversationSummary: 'Test conversation',
    };

    beforeEach(() => {
      // Mock widget support
      jest.spyOn(service, 'isWidgetSupported').mockReturnValue(true);
      
      // Mock no existing active session
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'session-123',
            user_id: 'test-user-id',
            conversation_id: 'conv-123',
            agent_id: 'test-agent-id',
            status: 'active',
            started_at: '2023-01-01T10:00:00Z',
          },
          error: null,
        }),
      } as any);
    });

    it('should create a new voice session successfully', async () => {
      const result = await service.startVoiceSession('conv-123', mockContext);
      
      expect(result.id).toBe('session-123');
      expect(result.conversation_id).toBe('conv-123');
      expect(result.status).toBe('active');
      expect(mockSupabase.from).toHaveBeenCalledWith('voice_sessions');
    });

    it('should throw error when widget is not supported', async () => {
      jest.spyOn(service, 'isWidgetSupported').mockReturnValue(false);
      
      await expect(service.startVoiceSession('conv-123', mockContext))
        .rejects.toThrow('ElevenLabs widget is not supported in this environment');
    });

    it('should throw error when user is not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });
      
      await expect(service.startVoiceSession('conv-123', mockContext))
        .rejects.toThrow('User must be authenticated to start voice session');
    });

    it('should end existing active session before creating new one', async () => {
      // Mock existing active session
      const existingSession = {
        id: 'existing-session',
        status: 'active',
      };

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: existingSession, error: null }),
      } as any);

      // Mock endVoiceSession
      jest.spyOn(service, 'endVoiceSession').mockResolvedValue({} as any);

      // Mock new session creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'new-session', status: 'active' },
          error: null,
        }),
      } as any);

      await service.startVoiceSession('conv-123', mockContext);
      
      expect(service.endVoiceSession).toHaveBeenCalledWith('existing-session');
    });

    it('should retry on database errors', async () => {
      let attemptCount = 0;
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          attemptCount++;
          if (attemptCount < 3) {
            return Promise.resolve({ data: null, error: { message: 'Database error' } });
          }
          return Promise.resolve({
            data: { id: 'session-123', status: 'active' },
            error: null,
          });
        }),
      } as any);

      const result = await service.startVoiceSession('conv-123', mockContext);
      
      expect(result.id).toBe('session-123');
      expect(attemptCount).toBe(3);
    });

    it('should throw error after max retries', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Persistent database error' },
        }),
      } as any);

      await expect(service.startVoiceSession('conv-123', mockContext))
        .rejects.toThrow('Failed to create voice session after 3 attempts');
    });
  });

  describe('endVoiceSession', () => {
    const mockTranscript = {
      sessionId: 'session-123',
      messages: [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: 'Hello',
          timestamp: new Date(),
        },
      ],
      endedAt: new Date(),
    };

    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { id: 'session-123', status: 'active' },
          error: null,
        }).mockResolvedValueOnce({
          data: { id: 'session-123', status: 'ended' },
          error: null,
        }),
        update: jest.fn().mockReturnThis(),
      } as any);
    });

    it('should end voice session successfully', async () => {
      const result = await service.endVoiceSession('session-123', mockTranscript);
      
      expect(result.id).toBe('session-123');
      expect(result.status).toBe('ended');
      expect(mockSupabase.from).toHaveBeenCalledWith('voice_sessions');
    });

    it('should end session without transcript', async () => {
      const result = await service.endVoiceSession('session-123');
      
      expect(result.id).toBe('session-123');
      expect(result.status).toBe('ended');
    });

    it('should throw error when session not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Session not found' },
        }),
      } as any);

      await expect(service.endVoiceSession('nonexistent-session'))
        .rejects.toThrow('Voice session not found: nonexistent-session');
    });

    it('should retry on database errors', async () => {
      let attemptCount = 0;
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          attemptCount++;
          if (attemptCount === 1) {
            return Promise.resolve({
              data: { id: 'session-123', status: 'active' },
              error: null,
            });
          }
          return Promise.resolve({
            data: { id: 'session-123', status: 'ended' },
            error: null,
          });
        }),
        update: jest.fn().mockReturnThis(),
      } as any);

      const result = await service.endVoiceSession('session-123');
      
      expect(result.status).toBe('ended');
    });

    it('should mark session as error if ending fails after retries', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'session-123', status: 'active' },
          error: null,
        }),
        update: jest.fn().mockReturnThis().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      } as any);

      await expect(service.endVoiceSession('session-123'))
        .rejects.toThrow('Failed to end voice session after 3 attempts');
    });
  });

  describe('getActiveVoiceSession', () => {
    it('should return active voice session', async () => {
      const mockSession = {
        id: 'session-123',
        conversation_id: 'conv-123',
        status: 'active',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockSession, error: null }),
      } as any);

      const result = await service.getActiveVoiceSession('conv-123');
      
      expect(result).toEqual(mockSession);
    });

    it('should return null when no active session exists', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const result = await service.getActiveVoiceSession('conv-123');
      
      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      } as any);

      const result = await service.getActiveVoiceSession('conv-123');
      
      expect(result).toBeNull();
    });
  });

  describe('Error Handling and Recovery', () => {
    describe('handleNetworkError', () => {
      beforeEach(() => {
        // Mock preservation and recovery methods
        jest.spyOn(service as any, 'preserveSessionState').mockResolvedValue(true);
        jest.spyOn(service as any, 'checkNetworkRecovery').mockResolvedValue({
          recoverable: true,
          latency: 1000,
        });
        jest.spyOn(service as any, 'restoreSessionAfterNetworkError').mockResolvedValue({
          success: true,
        });
      });

      it('should handle recoverable network error', async () => {
        const result = await service.handleNetworkError('session-123', new Error('Network error'));
        
        expect(result.strategy).toBe('retry');
        expect(result.recovered).toBe(true);
        expect(result.actions).toContain('Session restored successfully after network recovery');
      });

      it('should preserve session when network is not recoverable', async () => {
        jest.spyOn(service as any, 'checkNetworkRecovery').mockResolvedValue({
          recoverable: false,
          error: 'Network timeout',
        });

        const result = await service.handleNetworkError('session-123', new Error('Network error'));
        
        expect(result.strategy).toBe('preserve');
        expect(result.recovered).toBe(false);
        expect(result.actions).toContain('Network not recoverable, preserving session for later');
      });

      it('should abort session when recovery fails', async () => {
        jest.spyOn(service as any, 'preserveSessionState').mockRejectedValue(new Error('Preservation failed'));

        const result = await service.handleNetworkError('session-123', new Error('Network error'));
        
        expect(result.strategy).toBe('abort');
        expect(result.recovered).toBe(false);
      });
    });

    describe('handleSessionInterruption', () => {
      beforeEach(() => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'session-123', status: 'active' },
            error: null,
          }),
          update: jest.fn().mockReturnThis().mockResolvedValue({
            data: null,
            error: null,
          }),
        } as any);

        // Mock localStorage
        Object.defineProperty(global, 'localStorage', {
          value: {
            setItem: jest.fn(),
            getItem: jest.fn(),
            removeItem: jest.fn(),
          },
          writable: true,
        });
      });

      it('should handle user abort interruption', async () => {
        const result = await service.handleSessionInterruption('session-123', 'user_abort');
        
        expect(result.handled).toBe(true);
        expect(result.recoveryPossible).toBe(false);
        expect(result.actions).toContain('User aborted session, marking as ended');
      });

      it('should handle phone call interruption', async () => {
        const result = await service.handleSessionInterruption('session-123', 'phone_call');
        
        expect(result.handled).toBe(true);
        expect(result.recoveryPossible).toBe(true);
        expect(result.preservedState).toBe(true);
        expect(result.actions).toContain('System interruption, session can be recovered');
      });

      it('should handle app background interruption', async () => {
        const result = await service.handleSessionInterruption('session-123', 'app_background');
        
        expect(result.handled).toBe(true);
        expect(result.recoveryPossible).toBe(true);
        expect(result.actions).toContain('App backgrounded, session preserved for recovery');
      });

      it('should preserve interruption data locally', async () => {
        await service.handleSessionInterruption('session-123', 'phone_call');
        
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'interruption_session-123',
          expect.stringContaining('phone_call')
        );
      });
    });

    describe('recoverFromInterruption', () => {
      beforeEach(() => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'session-123', status: 'error' },
            error: null,
          }),
          update: jest.fn().mockReturnThis().mockResolvedValue({
            data: null,
            error: null,
          }),
        } as any);

        Object.defineProperty(global, 'localStorage', {
          value: {
            getItem: jest.fn().mockReturnValue(JSON.stringify({
              session_id: 'session-123',
              interruption_type: 'phone_call',
            })),
            removeItem: jest.fn(),
          },
          writable: true,
        });
      });

      it('should recover from interruption successfully', async () => {
        const result = await service.recoverFromInterruption('session-123');
        
        expect(result.recovered).toBe(true);
        expect(result.actions).toContain('Session recovered successfully');
        expect(localStorage.removeItem).toHaveBeenCalledWith('interruption_session-123');
      });

      it('should handle already active session', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'session-123', status: 'active' },
            error: null,
          }),
        } as any);

        const result = await service.recoverFromInterruption('session-123');
        
        expect(result.recovered).toBe(true);
        expect(result.actions).toContain('Session is already active, no recovery needed');
      });

      it('should fail recovery for ended session', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'session-123', status: 'ended' },
            error: null,
          }),
        } as any);

        const result = await service.recoverFromInterruption('session-123');
        
        expect(result.recovered).toBe(false);
        expect(result.error).toBe('Session was ended');
      });
    });
  });
});