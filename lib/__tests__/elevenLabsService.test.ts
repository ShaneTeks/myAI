import { config } from '../config';
import { ElevenLabsService, elevenLabsService } from '../elevenLabsService';
import { EnvironmentDetector } from '../environmentDetector';
import { supabase } from '../supabase';

// Mock dependencies
jest.mock('../environmentDetector');
jest.mock('../config');
jest.mock('../supabase');

describe('ElevenLabsService', () => {
  let service: ElevenLabsService;
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = ElevenLabsService.getInstance();
    
    // Reset config mock
    (config as any).elevenLabs = {
      defaultAgentId: 'test-agent-id',
      apiKey: 'test-api-key',
      apiUrl: 'https://api.elevenlabs.io',
      widget: {
        enabled: true,
        sessionTimeout: 300000,
        maxContextLength: 4000,
      },
    };
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ElevenLabsService.getInstance();
      const instance2 = ElevenLabsService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should return the same instance as the exported service', () => {
      const instance = ElevenLabsService.getInstance();
      
      expect(instance).toBe(elevenLabsService);
    });
  });

  describe('Environment Detection', () => {
    describe('isWidgetSupported', () => {
      it('should return true when environment and configuration support widget', () => {
        (EnvironmentDetector.canUseElevenLabsWidget as jest.Mock).mockReturnValue(true);
        
        const result = service.isWidgetSupported();
        
        expect(result).toBe(true);
        expect(EnvironmentDetector.canUseElevenLabsWidget).toHaveBeenCalled();
      });

      it('should return false when environment does not support widget', () => {
        (EnvironmentDetector.canUseElevenLabsWidget as jest.Mock).mockReturnValue(false);
        
        const result = service.isWidgetSupported();
        
        expect(result).toBe(false);
      });

      it('should return false when widget is disabled in configuration', () => {
        (EnvironmentDetector.canUseElevenLabsWidget as jest.Mock).mockReturnValue(true);
        (config as any).elevenLabs.widget.enabled = false;
        
        const result = service.isWidgetSupported();
        
        expect(result).toBe(false);
      });

      it('should return false when agent ID is not configured', () => {
        (EnvironmentDetector.canUseElevenLabsWidget as jest.Mock).mockReturnValue(true);
        (config as any).elevenLabs.defaultAgentId = '';
        
        const result = service.isWidgetSupported();
        
        expect(result).toBe(false);
      });
    });

    describe('getWidgetSupportStatus', () => {
      it('should return detailed support status when supported', () => {
        (EnvironmentDetector.canUseElevenLabsWidget as jest.Mock).mockReturnValue(true);
        (EnvironmentDetector.getEnvironmentDescription as jest.Mock).mockReturnValue('Prebuilt App');
        
        const result = service.getWidgetSupportStatus();
        
        expect(result).toEqual({
          supported: true,
          reason: 'ElevenLabs widget is supported and ready to use.',
          environment: 'Prebuilt App',
          canUseWidget: true,
          configurationValid: true,
        });
      });

      it('should return detailed status when not supported due to environment', () => {
        (EnvironmentDetector.canUseElevenLabsWidget as jest.Mock).mockReturnValue(false);
        (EnvironmentDetector.isExpoGO as jest.Mock).mockReturnValue(true);
        (EnvironmentDetector.getEnvironmentDescription as jest.Mock).mockReturnValue('Expo Go');
        
        const result = service.getWidgetSupportStatus();
        
        expect(result).toEqual({
          supported: false,
          reason: 'ElevenLabs widget requires a prebuilt app. Please use a development build or standalone app.',
          environment: 'Expo Go',
          canUseWidget: false,
          configurationValid: true,
        });
      });

      it('should return detailed status when configuration is invalid', () => {
        (EnvironmentDetector.canUseElevenLabsWidget as jest.Mock).mockReturnValue(true);
        (EnvironmentDetector.getEnvironmentDescription as jest.Mock).mockReturnValue('Prebuilt App');
        (config as any).elevenLabs.defaultAgentId = '';
        
        const result = service.getWidgetSupportStatus();
        
        expect(result).toEqual({
          supported: false,
          reason: 'ElevenLabs agent ID is not configured.',
          environment: 'Prebuilt App',
          canUseWidget: true,
          configurationValid: false,
        });
      });
    });
  });

  describe('Configuration Management', () => {
    describe('getConfiguration', () => {
      it('should return current configuration', () => {
        const result = service.getConfiguration();
        
        expect(result).toEqual({
          agentId: 'test-agent-id',
          apiUrl: 'https://api.elevenlabs.io',
          sessionTimeout: 300000,
          maxContextLength: 4000,
          widgetEnabled: true,
        });
      });
    });

    describe('validateConfiguration', () => {
      it('should return valid when all required configuration is present', () => {
        const result = service.validateConfiguration();
        
        expect(result).toEqual({
          valid: true,
          errors: [],
          warnings: [],
        });
      });

      it('should return errors when agent ID is missing', () => {
        (config as any).elevenLabs.defaultAgentId = '';
        
        const result = service.validateConfiguration();
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Agent ID is required (EXPO_PUBLIC_ELEVENLABS_AGENT_ID)');
      });

      it('should return warnings for missing API key', () => {
        (config as any).elevenLabs.apiKey = '';
        
        const result = service.validateConfiguration();
        
        expect(result.valid).toBe(true);
        expect(result.warnings).toContain('API key not configured (EXPO_PUBLIC_ELEVENLABS_API_KEY)');
      });

      it('should return warnings for short timeout values', () => {
        (config as any).elevenLabs.widget.sessionTimeout = 30000; // 30 seconds
        
        const result = service.validateConfiguration();
        
        expect(result.warnings).toContain('Session timeout is very short (less than 1 minute)');
      });

      it('should return warnings for short context length', () => {
        (config as any).elevenLabs.widget.maxContextLength = 500;
        
        const result = service.validateConfiguration();
        
        expect(result.warnings).toContain('Max context length is very short (less than 1000 characters)');
      });
    });
  });

  describe('Memory Sync Functionality', () => {
    describe('prepareContextForAgent', () => {
      const sampleMessages = [
        {
          id: '1',
          conversation_id: 'test-conv',
          content: 'Hello',
          is_user: true,
          message_type: 'text' as const,
          audio_url: null,
          voice_session_id: null,
          user_id: 'user1',
          created_at: '2023-01-01T10:00:00Z',
        },
        {
          id: '2',
          conversation_id: 'test-conv',
          content: 'Hi there!',
          is_user: false,
          message_type: 'text' as const,
          audio_url: null,
          voice_session_id: null,
          user_id: null,
          created_at: '2023-01-01T10:01:00Z',
        },
        {
          id: '3',
          conversation_id: 'test-conv',
          content: 'Voice message',
          is_user: true,
          message_type: 'voice' as const,
          audio_url: 'https://example.com/audio.mp3',
          voice_session_id: 'voice-1',
          user_id: 'user1',
          created_at: '2023-01-01T10:02:00Z',
        },
      ];

      it('should prepare context with recent messages', () => {
        const result = service.prepareContextForAgent(sampleMessages);
        
        expect(result.recentMessages).toHaveLength(2); // Should exclude voice messages
        expect(result.recentMessages[0].content).toBe('Hello');
        expect(result.recentMessages[1].content).toBe('Hi there!');
        expect(result.maxTokens).toBe(4000);
        expect(result.conversationSummary).toContain('2 user messages and 1 agent responses');
      });

      it('should respect max length limit', () => {
        const longMessages = Array.from({ length: 10 }, (_, i) => ({
          id: `${i}`,
          conversation_id: 'test-conv',
          content: 'A'.repeat(500), // 500 characters each
          is_user: i % 2 === 0,
          message_type: 'text' as const,
          audio_url: null,
          voice_session_id: null,
          user_id: i % 2 === 0 ? 'user1' : null,
          created_at: `2023-01-01T10:0${i}:00Z`,
        }));

        const result = service.prepareContextForAgent(longMessages, 1000);
        
        expect(result.maxTokens).toBe(1000);
        expect(result.recentMessages.length).toBeLessThan(10);
      });

      it('should filter out voice messages to avoid duplication', () => {
        const result = service.prepareContextForAgent(sampleMessages);
        
        const voiceMessages = result.recentMessages.filter(m => m.message_type === 'voice');
        expect(voiceMessages).toHaveLength(0);
      });

      it('should sort messages by creation time', () => {
        const unsortedMessages = [sampleMessages[1], sampleMessages[0]]; // Reverse order
        
        const result = service.prepareContextForAgent(unsortedMessages);
        
        expect(result.recentMessages[0].content).toBe('Hello');
        expect(result.recentMessages[1].content).toBe('Hi there!');
      });
    });

    describe('generateConversationSummary', () => {
      it('should generate summary for empty conversation', () => {
        const result = service.prepareContextForAgent([]);
        
        expect(result.conversationSummary).toBe('New conversation');
      });

      it('should generate summary with message counts and preview', () => {
        const messages = [
          {
            id: '1',
            conversation_id: 'test',
            content: 'This is a long message that should be truncated when displayed in the summary because it exceeds the preview length limit',
            is_user: true,
            message_type: 'text' as const,
            audio_url: null,
            voice_session_id: null,
            user_id: 'user1',
            created_at: '2023-01-01T10:00:00Z',
          },
        ];

        const result = service.prepareContextForAgent(messages);
        
        expect(result.conversationSummary).toContain('1 user messages and 0 agent responses');
        expect(result.conversationSummary).toContain('This is a long message that should be truncated when displayed in the summary because it exc...');
      });
    });
  });

  describe('Voice Message Parsing', () => {
    describe('parseVoiceResponse', () => {
      it('should parse basic voice response', () => {
        const response = {
          transcript: 'Hello, how can I help you?',
          audio_url: 'https://example.com/audio.mp3',
          session_id: 'session-123',
        };

        const result = service.parseVoiceResponse(response);
        
        expect(result.role).toBe('agent');
        expect(result.content).toBe('Hello, how can I help you?');
        expect(result.audioUrl).toBe('https://example.com/audio.mp3');
        expect(result.timestamp).toBeInstanceOf(Date);
        expect(result.id).toMatch(/^voice_\d+_[a-z0-9]+$/);
      });

      it('should extract widgets from structured response', () => {
        const response = {
          transcript: JSON.stringify({
            AIResponse: "Here's the weather:",
            weatherAgent: {
              weather: true,
              type: 'current',
              output: {
                location: 'Test City',
                temperature: '20°C',
                condition: 'Sunny',
              },
            },
          }),
          session_id: 'session-123',
        };

        const result = service.parseVoiceResponse(response);
        
        expect(result.widgets).toHaveLength(1);
        expect(result.widgets![0].type).toBe('weather');
        expect(result.widgets![0].data.location).toBe('Test City');
      });
    });

    describe('extractStructuredResponseWidgets', () => {
      it('should extract weather widget from n8n format', () => {
        const transcript = JSON.stringify({
          weatherAgent: {
            weather: true,
            type: 'current',
            output: {
              location: 'Test City',
              temperature: '25°C',
              condition: 'Clear',
            },
          },
        });

        const response = { transcript, session_id: 'test' };
        const result = service.parseVoiceResponse(response);
        
        expect(result.widgets).toHaveLength(1);
        expect(result.widgets![0].type).toBe('weather');
        expect(result.widgets![0].data.type).toBe('current');
        expect(result.widgets![0].data.location).toBe('Test City');
      });

      it('should handle invalid JSON gracefully', () => {
        const transcript = 'Invalid JSON {weather: true';
        
        const response = { transcript, session_id: 'test' };
        const result = service.parseVoiceResponse(response);
        
        expect(result.widgets).toHaveLength(0);
        expect(result.content).toBe(transcript);
      });

      it('should extract multiple widgets from response', () => {
        const transcript = JSON.stringify({
          weatherAgent: {
            weather: true,
            type: 'current',
            output: { location: 'City1', temperature: '20°C', condition: 'Sunny' },
          },
        });

        const response = {
          transcript,
          widgets: [
            { type: 'weather', data: { location: 'City2', temperature: '15°C' } },
          ],
          session_id: 'test',
        };

        const result = service.parseVoiceResponse(response);
        
        expect(result.widgets!.length).toBeGreaterThan(0);
      });
    });

    describe('voiceMessageToDbMessage', () => {
      it('should convert voice message to database format', () => {
        const voiceMessage = {
          id: 'voice-123',
          role: 'user' as const,
          content: 'Hello there',
          timestamp: new Date('2023-01-01T10:00:00Z'),
          audioUrl: 'https://example.com/audio.mp3',
        };

        const result = service.voiceMessageToDbMessage(
          voiceMessage,
          'conv-123',
          'session-123'
        );
        
        expect(result).toEqual({
          conversation_id: 'conv-123',
          voice_session_id: 'session-123',
          content: 'Hello there',
          is_user: true,
          message_type: 'voice',
          audio_url: 'https://example.com/audio.mp3',
          created_at: '2023-01-01T10:00:00.000Z',
        });
      });

      it('should convert agent message with widgets to structured format', () => {
        const voiceMessage = {
          id: 'voice-123',
          role: 'agent' as const,
          content: 'Here is the weather',
          timestamp: new Date('2023-01-01T10:00:00Z'),
          widgets: [
            {
              type: 'weather',
              data: {
                type: 'current',
                location: 'Test City',
                temperature: '20°C',
                condition: 'Sunny',
              },
            },
          ],
        };

        const result = service.voiceMessageToDbMessage(
          voiceMessage,
          'conv-123',
          'session-123'
        );
        
        expect(result.is_user).toBe(false);
        expect(result.message_type).toBe('voice');
        
        // Should convert to n8n-compatible structured format
        const parsedContent = JSON.parse(result.content);
        expect(parsedContent[0].output.weatherAgent.weather).toBe(true);
        expect(parsedContent[0].output.weatherAgent.output.location).toBe('Test City');
      });
    });
  });

  describe('Agent Capability Synchronization', () => {
    describe('getAgentConfiguration', () => {
      it('should return comprehensive agent configuration', () => {
        const result = service.getAgentConfiguration();
        
        expect(result.agentId).toBe('test-agent-id');
        expect(result.capabilities.weather.enabled).toBe(true);
        expect(result.capabilities.structuredResponses.enabled).toBe(true);
        expect(result.instructions).toContain('weather');
        expect(result.instructions).toContain('structured');
      });
    });

    describe('validateAgentCapabilities', () => {
      it('should validate capabilities with weather API key', () => {
        process.env.EXPO_PUBLIC_WEATHER_API_KEY = 'test-weather-key';
        
        const result = service.validateAgentCapabilities();
        
        expect(result.valid).toBe(true);
        expect(result.capabilities.weather).toBe(true);
        expect(result.capabilities.structuredResponses).toBe(true);
        expect(result.capabilities.externalApis).toBe(true);
      });

      it('should show warnings when weather API key is missing', () => {
        delete process.env.EXPO_PUBLIC_WEATHER_API_KEY;
        
        const result = service.validateAgentCapabilities();
        
        expect(result.capabilities.weather).toBe(false);
        expect(result.warnings).toContain('Weather API key not configured (EXPO_PUBLIC_WEATHER_API_KEY)');
      });

      it('should show errors when agent ID is missing', () => {
        (config as any).elevenLabs.defaultAgentId = '';
        
        const result = service.validateAgentCapabilities();
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('ElevenLabs agent ID not configured');
      });
    });

    describe('synchronizeWithN8nAgent', () => {
      it('should report successful synchronization when all capabilities are available', async () => {
        process.env.EXPO_PUBLIC_WEATHER_API_KEY = 'test-key';
        
        const result = await service.synchronizeWithN8nAgent();
        
        expect(result.success).toBe(true);
        expect(result.synchronized).toContain('Weather API access');
        expect(result.synchronized).toContain('Structured response formatting');
        expect(result.synchronized).toContain('External API access');
        expect(result.missing).toHaveLength(0);
        expect(result.errors).toHaveLength(0);
      });

      it('should report missing capabilities when weather API key is not configured', async () => {
        delete process.env.EXPO_PUBLIC_WEATHER_API_KEY;
        
        const result = await service.synchronizeWithN8nAgent();
        
        expect(result.success).toBe(false);
        expect(result.missing).toContain('Weather API access (missing API key)');
      });
    });
  });

  describe('Capability Testing', () => {
    describe('testWeatherCapability', () => {
      it('should successfully test weather capability with valid response', async () => {
        const result = await service.testAgentCapability('weather');
        
        expect(result.success).toBe(true);
        expect(result.capability).toBe('weather');
        expect(result.result?.widgetExtracted).toBe(true);
        expect(result.result?.widgetData?.location).toBe('Swakopmund, Namibia');
      });
    });

    describe('testStructuredResponseCapability', () => {
      it('should successfully test structured response capability', async () => {
        const result = await service.testAgentCapability('structured');
        
        expect(result.success).toBe(true);
        expect(result.capability).toBe('structured');
        expect(result.result?.overallSuccess).toBe(true);
        expect(result.result?.testResults).toHaveLength(3);
      });
    });

    describe('testContinuityCapability', () => {
      it('should successfully test continuity capability', async () => {
        const result = await service.testAgentCapability('continuity');
        
        expect(result.success).toBe(true);
        expect(result.capability).toBe('continuity');
        expect(result.result?.contextPrepared).toBe(true);
        expect(result.result?.summaryGenerated).toBe(true);
        expect(result.result?.instructionsIncluded).toBe(true);
        expect(result.result?.capabilitiesIncluded).toBe(true);
      });
    });

    describe('runCapabilityTests', () => {
      it('should run all capability tests and return summary', async () => {
        const result = await service.runCapabilityTests();
        
        expect(result.results).toHaveLength(3);
        expect(result.summary.total).toBe(3);
        expect(result.summary.passed).toBeGreaterThan(0);
        expect(result.success).toBe(result.summary.failed === 0);
      });
    });
  });
});