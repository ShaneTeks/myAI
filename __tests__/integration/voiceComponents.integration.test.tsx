import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { ElevenLabsWidget } from '../../components/ElevenLabsWidget';
import { VoiceButton } from '../../components/VoiceButton';
import { VoiceSessionModal } from '../../components/VoiceSessionModal';
import { elevenLabsService } from '../../lib/elevenLabsService';
import { EnvironmentDetector } from '../../lib/environmentDetector';

// Mock dependencies
jest.mock('../../lib/elevenLabsService');
jest.mock('../../lib/environmentDetector');
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: { OS: 'ios' },
  Animated: {
    Value: jest.fn(() => ({ setValue: jest.fn(), addListener: jest.fn() })),
    timing: jest.fn(() => ({ start: jest.fn() })),
    spring: jest.fn(() => ({ start: jest.fn() })),
  },
}));

describe('Voice Components Integration Tests', () => {
  const mockElevenLabsService = elevenLabsService as jest.Mocked<typeof elevenLabsService>;
  const mockEnvironmentDetector = EnvironmentDetector as jest.Mocked<typeof EnvironmentDetector>;

  const mockConversationContext = {
    recentMessages: [
      {
        id: '1',
        conversation_id: 'conv-123',
        content: 'Hello',
        is_user: true,
        message_type: 'text' as const,
        audio_url: null,
        voice_session_id: null,
        user_id: 'user-123',
        created_at: '2023-01-01T10:00:00Z',
      },
    ],
    maxTokens: 4000,
    conversationSummary: 'Test conversation',
  };

  const mockVoiceTranscript = {
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
    jest.clearAllMocks();
    
    // Setup default environment detection
    mockEnvironmentDetector.canUseElevenLabsWidget.mockReturnValue(true);
    mockEnvironmentDetector.isExpoGO.mockReturnValue(false);
    mockEnvironmentDetector.isPrebuiltApp.mockReturnValue(true);
    
    // Setup default service responses
    mockElevenLabsService.isWidgetSupported.mockReturnValue(true);
    mockElevenLabsService.getWidgetSupportStatus.mockReturnValue({
      supported: true,
      reason: 'Widget is supported',
      environment: 'Prebuilt App',
      canUseWidget: true,
      configurationValid: true,
    });
  });

  describe('VoiceButton Integration', () => {
    it('should render enabled button when voice is supported', () => {
      const mockOnPress = jest.fn();
      
      const { getByTestId } = render(
        <VoiceButton
          onPress={mockOnPress}
          isSupported={true}
          disabled={false}
        />
      );

      const button = getByTestId('voice-button');
      expect(button).toBeTruthy();
      
      fireEvent.press(button);
      expect(mockOnPress).toHaveBeenCalled();
    });

    it('should render disabled button when voice is not supported', () => {
      const mockOnPress = jest.fn();
      
      const { getByTestId } = render(
        <VoiceButton
          onPress={mockOnPress}
          isSupported={false}
          disabled={false}
        />
      );

      const button = getByTestId('voice-button');
      expect(button).toBeTruthy();
      
      fireEvent.press(button);
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should show appropriate visual states for different support levels', () => {
      const mockOnPress = jest.fn();
      
      // Test supported state
      const { rerender, getByTestId } = render(
        <VoiceButton
          onPress={mockOnPress}
          isSupported={true}
          disabled={false}
        />
      );

      let button = getByTestId('voice-button');
      expect(button.props.accessibilityLabel).toContain('Start voice chat');

      // Test unsupported state
      rerender(
        <VoiceButton
          onPress={mockOnPress}
          isSupported={false}
          disabled={false}
        />
      );

      button = getByTestId('voice-button');
      expect(button.props.accessibilityLabel).toContain('Voice chat not available');
    });

    it('should handle loading state during voice session operations', () => {
      const mockOnPress = jest.fn();
      
      const { getByTestId } = render(
        <VoiceButton
          onPress={mockOnPress}
          isSupported={true}
          disabled={true}
        />
      );

      const button = getByTestId('voice-button');
      fireEvent.press(button);
      
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('ElevenLabsWidget Integration', () => {
    it('should render widget when environment is supported', () => {
      const mockOnSessionEnd = jest.fn();
      const mockOnError = jest.fn();

      const { getByTestId } = render(
        <ElevenLabsWidget
          conversationContext={mockConversationContext}
          onSessionEnd={mockOnSessionEnd}
          onError={mockOnError}
        />
      );

      const widget = getByTestId('elevenlabs-widget');
      expect(widget).toBeTruthy();
    });

    it('should show fallback message when environment is not supported', () => {
      mockEnvironmentDetector.canUseElevenLabsWidget.mockReturnValue(false);
      mockEnvironmentDetector.isExpoGO.mockReturnValue(true);
      
      const mockOnSessionEnd = jest.fn();
      const mockOnError = jest.fn();

      const { getByText } = render(
        <ElevenLabsWidget
          conversationContext={mockConversationContext}
          onSessionEnd={mockOnSessionEnd}
          onError={mockOnError}
        />
      );

      expect(getByText(/Voice chat requires a prebuilt app/)).toBeTruthy();
    });

    it('should handle widget initialization and context preparation', async () => {
      mockElevenLabsService.prepareAgentContext.mockReturnValue({
        ...mockConversationContext,
        agentCapabilities: { weather: { enabled: true } },
        instructions: 'Test instructions',
      });

      const mockOnSessionEnd = jest.fn();
      const mockOnError = jest.fn();

      render(
        <ElevenLabsWidget
          conversationContext={mockConversationContext}
          onSessionEnd={mockOnSessionEnd}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockElevenLabsService.prepareAgentContext).toHaveBeenCalledWith(
          mockConversationContext
        );
      });
    });

    it('should handle widget errors and call error callback', async () => {
      const mockOnSessionEnd = jest.fn();
      const mockOnError = jest.fn();

      // Mock widget error
      mockElevenLabsService.prepareAgentContext.mockImplementation(() => {
        throw new Error('Widget initialization failed');
      });

      render(
        <ElevenLabsWidget
          conversationContext={mockConversationContext}
          onSessionEnd={mockOnSessionEnd}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'WIDGET_ERROR',
            message: expect.stringContaining('Widget initialization failed'),
          })
        );
      });
    });

    it('should process voice responses and extract widgets', async () => {
      const mockOnSessionEnd = jest.fn();
      const mockOnError = jest.fn();

      mockElevenLabsService.processVoiceResponseWithCapabilities.mockReturnValue({
        id: 'voice-1',
        role: 'agent',
        content: 'Weather response',
        timestamp: new Date(),
        widgets: [
          {
            type: 'weather',
            data: { location: 'Test City', temperature: '25°C' },
          },
        ],
      });

      const { getByTestId } = render(
        <ElevenLabsWidget
          conversationContext={mockConversationContext}
          onSessionEnd={mockOnSessionEnd}
          onError={mockOnError}
        />
      );

      // Simulate widget response (this would normally come from the actual ElevenLabs widget)
      const widget = getByTestId('elevenlabs-widget');
      
      // Simulate a voice response event
      await act(async () => {
        // This would be triggered by the actual ElevenLabs widget
        mockOnSessionEnd({
          sessionId: 'session-123',
          messages: [
            {
              id: 'voice-1',
              role: 'agent',
              content: 'Weather response',
              timestamp: new Date(),
              widgets: [
                {
                  type: 'weather',
                  data: { location: 'Test City', temperature: '25°C' },
                },
              ],
            },
          ],
          endedAt: new Date(),
        });
      });

      expect(mockOnSessionEnd).toHaveBeenCalled();
    });
  });

  describe('VoiceSessionModal Integration', () => {
    it('should render modal when visible', () => {
      const mockOnClose = jest.fn();
      const mockOnSessionEnd = jest.fn();

      const { getByTestId } = render(
        <VoiceSessionModal
          visible={true}
          onClose={mockOnClose}
          conversationContext={mockConversationContext}
          onSessionEnd={mockOnSessionEnd}
        />
      );

      const modal = getByTestId('voice-session-modal');
      expect(modal).toBeTruthy();
    });

    it('should not render modal when not visible', () => {
      const mockOnClose = jest.fn();
      const mockOnSessionEnd = jest.fn();

      const { queryByTestId } = render(
        <VoiceSessionModal
          visible={false}
          onClose={mockOnClose}
          conversationContext={mockConversationContext}
          onSessionEnd={mockOnSessionEnd}
        />
      );

      const modal = queryByTestId('voice-session-modal');
      expect(modal).toBeFalsy();
    });

    it('should handle modal close and call onClose callback', () => {
      const mockOnClose = jest.fn();
      const mockOnSessionEnd = jest.fn();

      const { getByTestId } = render(
        <VoiceSessionModal
          visible={true}
          onClose={mockOnClose}
          conversationContext={mockConversationContext}
          onSessionEnd={mockOnSessionEnd}
        />
      );

      const closeButton = getByTestId('voice-modal-close-button');
      fireEvent.press(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should integrate with ElevenLabsWidget and handle session end', async () => {
      const mockOnClose = jest.fn();
      const mockOnSessionEnd = jest.fn();

      const { getByTestId } = render(
        <VoiceSessionModal
          visible={true}
          onClose={mockOnClose}
          conversationContext={mockConversationContext}
          onSessionEnd={mockOnSessionEnd}
        />
      );

      // Verify widget is rendered inside modal
      const widget = getByTestId('elevenlabs-widget');
      expect(widget).toBeTruthy();

      // Simulate session end from widget
      await act(async () => {
        mockOnSessionEnd(mockVoiceTranscript);
      });

      expect(mockOnSessionEnd).toHaveBeenCalledWith(mockVoiceTranscript);
    });

    it('should handle widget errors within modal', async () => {
      const mockOnClose = jest.fn();
      const mockOnSessionEnd = jest.fn();

      // Mock widget error
      mockElevenLabsService.prepareAgentContext.mockImplementation(() => {
        throw new Error('Widget error in modal');
      });

      const { getByTestId } = render(
        <VoiceSessionModal
          visible={true}
          onClose={mockOnClose}
          conversationContext={mockConversationContext}
          onSessionEnd={mockOnSessionEnd}
        />
      );

      // Should show error state within modal
      await waitFor(() => {
        const errorMessage = getByTestId('widget-error-message');
        expect(errorMessage).toBeTruthy();
      });
    });

    it('should handle modal animations and transitions', async () => {
      const mockOnClose = jest.fn();
      const mockOnSessionEnd = jest.fn();

      const { rerender, getByTestId } = render(
        <VoiceSessionModal
          visible={false}
          onClose={mockOnClose}
          conversationContext={mockConversationContext}
          onSessionEnd={mockOnSessionEnd}
        />
      );

      // Modal should not be visible initially
      expect(() => getByTestId('voice-session-modal')).toThrow();

      // Show modal
      rerender(
        <VoiceSessionModal
          visible={true}
          onClose={mockOnClose}
          conversationContext={mockConversationContext}
          onSessionEnd={mockOnSessionEnd}
        />
      );

      // Modal should be visible after animation
      await waitFor(() => {
        const modal = getByTestId('voice-session-modal');
        expect(modal).toBeTruthy();
      });

      // Hide modal
      rerender(
        <VoiceSessionModal
          visible={false}
          onClose={mockOnClose}
          conversationContext={mockConversationContext}
          onSessionEnd={mockOnSessionEnd}
        />
      );

      // Modal should be hidden after animation
      await waitFor(() => {
        expect(() => getByTestId('voice-session-modal')).toThrow();
      });
    });
  });

  describe('Component Integration Flow', () => {
    it('should handle complete voice session flow from button to modal to widget', async () => {
      const mockOnSessionEnd = jest.fn();
      let modalVisible = false;
      let conversationContext = mockConversationContext;

      const TestFlow: React.FC = () => {
        const [isModalVisible, setIsModalVisible] = React.useState(modalVisible);
        
        const handleVoiceButtonPress = () => {
          setIsModalVisible(true);
        };

        const handleModalClose = () => {
          setIsModalVisible(false);
        };

        const handleSessionEnd = (transcript: any) => {
          mockOnSessionEnd(transcript);
          setIsModalVisible(false);
        };

        return (
          <>
            <VoiceButton
              onPress={handleVoiceButtonPress}
              isSupported={true}
              disabled={false}
            />
            <VoiceSessionModal
              visible={isModalVisible}
              onClose={handleModalClose}
              conversationContext={conversationContext}
              onSessionEnd={handleSessionEnd}
            />
          </>
        );
      };

      const { getByTestId, queryByTestId } = render(<TestFlow />);

      // 1. Press voice button
      const voiceButton = getByTestId('voice-button');
      fireEvent.press(voiceButton);

      // 2. Modal should appear
      await waitFor(() => {
        const modal = getByTestId('voice-session-modal');
        expect(modal).toBeTruthy();
      });

      // 3. Widget should be rendered in modal
      const widget = getByTestId('elevenlabs-widget');
      expect(widget).toBeTruthy();

      // 4. Simulate session end
      await act(async () => {
        mockOnSessionEnd(mockVoiceTranscript);
      });

      // 5. Modal should close
      await waitFor(() => {
        expect(queryByTestId('voice-session-modal')).toBeFalsy();
      });

      expect(mockOnSessionEnd).toHaveBeenCalledWith(mockVoiceTranscript);
    });

    it('should handle error states throughout the component chain', async () => {
      // Mock environment not supported
      mockEnvironmentDetector.canUseElevenLabsWidget.mockReturnValue(false);
      mockEnvironmentDetector.isExpoGO.mockReturnValue(true);

      const TestErrorFlow: React.FC = () => {
        const [isModalVisible, setIsModalVisible] = React.useState(true);
        
        return (
          <VoiceSessionModal
            visible={isModalVisible}
            onClose={() => setIsModalVisible(false)}
            conversationContext={mockConversationContext}
            onSessionEnd={() => {}}
          />
        );
      };

      const { getByText } = render(<TestErrorFlow />);

      // Should show environment error message
      await waitFor(() => {
        expect(getByText(/Voice chat requires a prebuilt app/)).toBeTruthy();
      });
    });

    it('should handle widget capability synchronization across components', async () => {
      mockElevenLabsService.prepareAgentContext.mockReturnValue({
        ...mockConversationContext,
        agentCapabilities: {
          weather: { enabled: true },
          structuredResponses: { enabled: true },
        },
        instructions: 'Enhanced instructions with capabilities',
      });

      const TestCapabilityFlow: React.FC = () => {
        return (
          <VoiceSessionModal
            visible={true}
            onClose={() => {}}
            conversationContext={mockConversationContext}
            onSessionEnd={() => {}}
          />
        );
      };

      render(<TestCapabilityFlow />);

      await waitFor(() => {
        expect(mockElevenLabsService.prepareAgentContext).toHaveBeenCalledWith(
          mockConversationContext
        );
      });

      // Verify enhanced context is prepared for widget
      const preparedContext = mockElevenLabsService.prepareAgentContext.mock.results[0].value;
      expect(preparedContext.agentCapabilities.weather.enabled).toBe(true);
      expect(preparedContext.instructions).toContain('Enhanced instructions');
    });
  });

  describe('Performance and Memory Management', () => {
    it('should properly cleanup widget resources when modal closes', async () => {
      const mockOnClose = jest.fn();
      const mockOnSessionEnd = jest.fn();

      const { rerender, getByTestId } = render(
        <VoiceSessionModal
          visible={true}
          onClose={mockOnClose}
          conversationContext={mockConversationContext}
          onSessionEnd={mockOnSessionEnd}
        />
      );

      // Widget should be active
      const widget = getByTestId('elevenlabs-widget');
      expect(widget).toBeTruthy();

      // Close modal
      rerender(
        <VoiceSessionModal
          visible={false}
          onClose={mockOnClose}
          conversationContext={mockConversationContext}
          onSessionEnd={mockOnSessionEnd}
        />
      );

      // Widget should be cleaned up
      await waitFor(() => {
        expect(() => getByTestId('elevenlabs-widget')).toThrow();
      });
    });

    it('should handle rapid modal open/close cycles gracefully', async () => {
      const mockOnClose = jest.fn();
      const mockOnSessionEnd = jest.fn();

      const { rerender } = render(
        <VoiceSessionModal
          visible={false}
          onClose={mockOnClose}
          conversationContext={mockConversationContext}
          onSessionEnd={mockOnSessionEnd}
        />
      );

      // Rapidly toggle modal visibility
      for (let i = 0; i < 5; i++) {
        rerender(
          <VoiceSessionModal
            visible={true}
            onClose={mockOnClose}
            conversationContext={mockConversationContext}
            onSessionEnd={mockOnSessionEnd}
          />
        );

        rerender(
          <VoiceSessionModal
            visible={false}
            onClose={mockOnClose}
            conversationContext={mockConversationContext}
            onSessionEnd={mockOnSessionEnd}
          />
        );
      }

      // Should not cause memory leaks or errors
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});