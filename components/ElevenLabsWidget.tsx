import { Colors } from '@/constants/theme';
import { elevenLabsService } from '@/lib/elevenLabsService';
import { EnvironmentDetector } from '@/lib/environmentDetector';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ConversationContext, ElevenLabsError, VoiceTranscript } from './types';

export interface ElevenLabsWidgetProps {
  conversationContext: ConversationContext;
  onSessionEnd: (transcript: VoiceTranscript) => void;
  onError: (error: ElevenLabsError) => void;
}

interface WidgetState {
  isLoading: boolean;
  isActive: boolean;
  error: ElevenLabsError | null;
  sessionId: string | null;
  retryCount: number;
  isRecovering: boolean;
  voiceActivity: 'idle' | 'listening' | 'speaking' | 'processing';
  agentResponse: boolean;
}

export function ElevenLabsWidget({
  conversationContext,
  onSessionEnd,
  onError,
}: ElevenLabsWidgetProps) {
  const [widgetState, setWidgetState] = useState<WidgetState>({
    isLoading: true,
    isActive: false,
    error: null,
    sessionId: null,
    retryCount: 0,
    isRecovering: false,
    voiceActivity: 'idle',
    agentResponse: false,
  });

  const sessionRef = useRef<string | null>(null);
  const widgetRef = useRef<any>(null);

  // Animation values using React Native Animated
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const waveformAnimation = useRef(new Animated.Value(0)).current;
  const loadingRotation = useRef(new Animated.Value(0)).current;
  const statusOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.9)).current;
  const voiceActivityScale = useRef(new Animated.Value(1)).current;
  const agentResponseOpacity = useRef(new Animated.Value(0)).current;
  const sessionControlsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeWidget();
    return () => {
      cleanup();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Animation effects using React Native Animated
  useEffect(() => {
    if (widgetState.isLoading || widgetState.isRecovering) {
      // Continuous loading rotation
      Animated.loop(
        Animated.timing(loadingRotation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      loadingRotation.setValue(0);
    }

    if (widgetState.isActive) {
      // Different animations based on voice activity state
      switch (widgetState.voiceActivity) {
        case 'listening':
          Animated.loop(
            Animated.sequence([
              Animated.timing(pulseAnimation, {
                toValue: 1.2,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(pulseAnimation, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
              }),
            ])
          ).start();
          Animated.spring(voiceActivityScale, {
            toValue: 1.1,
            useNativeDriver: true,
          }).start();
          break;
        case 'speaking':
          Animated.loop(
            Animated.sequence([
              Animated.timing(pulseAnimation, {
                toValue: 1.3,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(pulseAnimation, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
            ])
          ).start();
          Animated.spring(voiceActivityScale, {
            toValue: 1.2,
            useNativeDriver: true,
          }).start();
          break;
        case 'processing':
          Animated.loop(
            Animated.timing(pulseAnimation, {
              toValue: 1.1,
              duration: 300,
              useNativeDriver: true,
            })
          ).start();
          Animated.spring(voiceActivityScale, {
            toValue: 1.05,
            useNativeDriver: true,
          }).start();
          break;
        default:
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
          Animated.spring(voiceActivityScale, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
      }

      // Waveform animation
      Animated.loop(
        Animated.timing(waveformAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();

      // Agent response feedback
      if (widgetState.agentResponse) {
        Animated.sequence([
          Animated.timing(agentResponseOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(agentResponseOpacity, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(agentResponseOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // Fade in status and content
      Animated.timing(statusOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      Animated.spring(contentScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      Animated.timing(sessionControlsOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }).start();
    } else {
      pulseAnimation.stopAnimation();
      waveformAnimation.stopAnimation();

      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      Animated.timing(waveformAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      Animated.spring(voiceActivityScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      Animated.timing(agentResponseOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.timing(sessionControlsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (!widgetState.isLoading) {
        Animated.timing(statusOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        Animated.spring(contentScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [widgetState.isLoading, widgetState.isActive, widgetState.isRecovering, widgetState.voiceActivity, widgetState.agentResponse]);

  const initializeWidget = async () => {
    try {
      // Check if widget is supported
      const supportStatus = elevenLabsService.getWidgetSupportStatus();

      if (!supportStatus.supported) {
        setWidgetState(prev => ({
          ...prev,
          isLoading: false,
          error: {
            code: 'WIDGET_NOT_SUPPORTED',
            message: supportStatus.reason,
            details: supportStatus,
          },
        }));
        return;
      }

      // Log comprehensive status for debugging
      elevenLabsService.logStatus();

      // Get comprehensive status including capabilities
      const comprehensiveStatus = elevenLabsService.getComprehensiveStatus();
      console.log('ElevenLabs Widget - Comprehensive Status:', comprehensiveStatus);

      // Validate configuration
      const validation = elevenLabsService.validateConfiguration();
      if (!validation.valid) {
        setWidgetState(prev => ({
          ...prev,
          isLoading: false,
          error: {
            code: 'CONFIGURATION_ERROR',
            message: `Configuration errors: ${validation.errors.join(', ')}`,
            details: validation,
          },
        }));
        return;
      }

      // Test agent capabilities
      console.log('Testing agent capabilities...');
      const capabilityTests = await elevenLabsService.runCapabilityTests();
      console.log('Agent capability test results:', capabilityTests);

      if (!capabilityTests.success) {
        console.warn('Some agent capabilities failed tests:', capabilityTests.results);
        // Continue anyway but log warnings
      }

      // Test synchronization with n8n
      console.log('Testing synchronization with n8n...');
      const syncResult = await elevenLabsService.synchronizeWithN8nAgent();
      console.log('N8n synchronization result:', syncResult);

      if (!syncResult.success) {
        console.warn('Agent synchronization issues detected:', syncResult);
        // Continue anyway but log warnings
      }

      // Initialize the actual ElevenLabs widget
      await initializeElevenLabsWidget();

    } catch (error) {
      console.error('Failed to initialize ElevenLabs widget:', error);

      // Determine error type and provide appropriate handling
      let errorCode = 'INITIALIZATION_ERROR';
      let errorMessage = 'Failed to initialize voice widget';

      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorCode = 'NETWORK_ERROR';
          errorMessage = 'Network connection failed. Please check your internet connection.';
        } else if (error.message.includes('permission')) {
          errorCode = 'PERMISSION_ERROR';
          errorMessage = 'Microphone permission required for voice chat.';
        } else if (error.message.includes('configuration')) {
          errorCode = 'CONFIGURATION_ERROR';
          errorMessage = 'Voice chat configuration error. Please restart the app.';
        }
      }

      setWidgetState(prev => ({
        ...prev,
        isLoading: false,
        isRecovering: false,
        error: {
          code: errorCode,
          message: errorMessage,
          details: error,
        },
      }));

      // Auto-retry for network errors (up to 3 times)
      if (errorCode === 'NETWORK_ERROR' && widgetState.retryCount < 3) {
        console.log(`Auto-retrying initialization (attempt ${widgetState.retryCount + 1}/3)...`);
        setTimeout(() => {
          handleRetry();
        }, 3000 * (widgetState.retryCount + 1)); // Exponential backoff
      }
    }
  };

  const initializeElevenLabsWidget = async () => {
    // This is where the actual ElevenLabs widget would be initialized
    // For now, we'll simulate the widget initialization

    try {
      const sessionId = generateSessionId();

      // Simulate widget initialization delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real implementation, this would initialize the ElevenLabs widget
      // with the conversation context and configuration

      sessionRef.current = sessionId;
      setWidgetState(prev => ({
        ...prev,
        isLoading: false,
        isActive: true,
        sessionId,
      }));

      // Simulate a voice session for demonstration
      simulateVoiceSession(sessionId);

    } catch (error) {
      throw new Error(`Widget initialization failed: ${error}`);
    }
  };

  const simulateVoiceSession = async (sessionId: string) => {
    // This simulates a voice session with enhanced capability testing and visual feedback
    // In a real implementation, this would be handled by the ElevenLabs widget

    // Simulate voice activity states
    const activitySequence = [
      { state: 'listening', duration: 1500 },
      { state: 'processing', duration: 800 },
      { state: 'speaking', duration: 2000, showAgentResponse: true },
      { state: 'idle', duration: 700 }
    ];

    let currentStep = 0;

    const runActivitySequence = () => {
      if (currentStep < activitySequence.length && sessionRef.current === sessionId) {
        const step = activitySequence[currentStep];

        setWidgetState(prev => ({
          ...prev,
          voiceActivity: step.state as any,
          agentResponse: step.showAgentResponse || false,
        }));

        setTimeout(() => {
          currentStep++;
          if (currentStep < activitySequence.length) {
            runActivitySequence();
          } else {
            // End session after sequence
            completeSession();
          }
        }, step.duration);
      }
    };

    const completeSession = () => {
      if (sessionRef.current === sessionId) {
        // Simulate a structured weather response to test capability synchronization
        const structuredWeatherResponse = JSON.stringify({
          AIResponse: "Here's the current weather in Swakopmund:",
          weatherAgent: {
            weather: true,
            type: "current",
            output: {
              location: "Swakopmund, Namibia",
              temperature: "21°C",
              feelsLike: "21°C",
              condition: "Partly cloudy",
              conditionImage: "https://cdn.weatherapi.com/weather/64x64/day/116.png",
              humidity: "64%",
              windSpeed: "15.5 km/h",
              windDirection: "WNW",
              pressure: "1016 mb",
              visibility: "10 km",
              uvIndex: "11.4",
              lastUpdated: "2025-10-22 13:00",
              cloudCover: "50%",
              dewPoint: "13°C",
              airQuality: {
                usEpaIndex: 1,
                gbDefraIndex: 2,
                pm2_5: 14.45,
                pm10: 20.85
              }
            }
          }
        });

        // Process the response using enhanced capabilities
        const mockResponse = {
          transcript: structuredWeatherResponse,
          session_id: sessionId
        };

        const processedMessage = elevenLabsService.processVoiceResponseWithCapabilities(mockResponse);

        const transcript: VoiceTranscript = {
          sessionId,
          messages: [
            {
              id: 'msg_1',
              role: 'user',
              content: 'Hello, how is the weather today?',
              timestamp: new Date(),
            },
            {
              id: 'msg_2',
              role: 'agent',
              content: processedMessage.content,
              timestamp: new Date(),
              widgets: processedMessage.widgets,
            },
          ],
          endedAt: new Date(),
          summary: 'User asked about weather, agent provided structured weather response with widget.',
        };

        console.log('Simulated voice session with enhanced capabilities:', {
          originalResponse: structuredWeatherResponse,
          processedMessage: processedMessage,
          transcript: transcript
        });

        onSessionEnd(transcript);
      }
    };

    // Start the activity sequence
    runActivitySequence();
  };

  const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  const getVoiceActivityStatus = () => {
    switch (widgetState.voiceActivity) {
      case 'listening':
        return { text: 'Listening...', color: '#4CAF50', icon: 'mic' as const };
      case 'speaking':
        return { text: 'You are speaking', color: '#2196F3', icon: 'volume-high' as const };
      case 'processing':
        return { text: 'Processing...', color: '#FF9800', icon: 'hourglass' as const };
      default:
        return { text: 'Ready', color: Colors.dark.icon, icon: 'checkmark-circle' as const };
    }
  };

  const getVoiceActivityColor = () => {
    switch (widgetState.voiceActivity) {
      case 'listening':
        return '#4CAF50';
      case 'speaking':
        return '#2196F3';
      case 'processing':
        return '#FF9800';
      default:
        return Colors.dark.tint;
    }
  };

  const getErrorIcon = (errorCode: string): keyof typeof Ionicons.glyphMap => {
    switch (errorCode) {
      case 'WIDGET_NOT_SUPPORTED':
        return 'information-circle-outline';
      case 'NETWORK_ERROR':
        return 'wifi-outline';
      case 'PERMISSION_ERROR':
        return 'mic-off-outline';
      case 'CONFIGURATION_ERROR':
        return 'settings-outline';
      default:
        return 'warning-outline';
    }
  };

  const getErrorColor = (errorCode: string): string => {
    switch (errorCode) {
      case 'WIDGET_NOT_SUPPORTED':
        return Colors.dark.icon;
      case 'NETWORK_ERROR':
        return '#ff9500';
      case 'PERMISSION_ERROR':
        return '#ff4444';
      case 'CONFIGURATION_ERROR':
        return '#ff9500';
      default:
        return '#ff4444';
    }
  };

  const getErrorTitle = (errorCode: string): string => {
    switch (errorCode) {
      case 'WIDGET_NOT_SUPPORTED':
        return 'Voice Chat Not Available';
      case 'NETWORK_ERROR':
        return 'Connection Error';
      case 'PERMISSION_ERROR':
        return 'Microphone Permission Required';
      case 'CONFIGURATION_ERROR':
        return 'Configuration Error';
      default:
        return 'Voice Chat Error';
    }
  };

  const cleanup = () => {
    if (sessionRef.current) {
      // Clean up any active sessions
      sessionRef.current = null;
    }

    if (widgetRef.current) {
      // Clean up widget resources
      widgetRef.current = null;
    }
  };

  const handleRetry = () => {
    setWidgetState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      retryCount: prev.retryCount + 1,
      isRecovering: true,
    }));
    initializeWidget();
  };

  const handleEndSession = () => {
    if (sessionRef.current) {
      const transcript: VoiceTranscript = {
        sessionId: sessionRef.current,
        messages: [],
        endedAt: new Date(),
        summary: 'Session ended by user.',
      };

      onSessionEnd(transcript);
    }
  };

  // Animated styles using React Native Animated
  const loadingRotationInterpolate = loadingRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const waveformScaleInterpolate = waveformAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1.2, 0.3],
  });

  // Render error state
  if (widgetState.error) {
    const isRetryable = !['WIDGET_NOT_SUPPORTED', 'PERMISSION_ERROR'].includes(widgetState.error.code);
    const showEnvironmentInfo = widgetState.error.code === 'WIDGET_NOT_SUPPORTED';

    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.errorContainer,
            {
              transform: [{ scale: contentScale }],
              opacity: statusOpacity,
            }
          ]}
        >
          <View>
            <Ionicons
              name={getErrorIcon(widgetState.error.code)}
              size={48}
              color={getErrorColor(widgetState.error.code)}
              style={styles.errorIcon}
            />
          </View>
          <Text style={styles.errorTitle}>
            {getErrorTitle(widgetState.error.code)}
          </Text>
          <Text style={styles.errorMessage}>
            {widgetState.error.message}
          </Text>

          {showEnvironmentInfo && (
            <View style={styles.fallbackInfo}>
              <Text style={styles.fallbackTitle}>Environment Details:</Text>
              <Text style={styles.fallbackText}>
                Platform: {EnvironmentDetector.getPlatformInfo().executionEnvironment}
              </Text>
              <Text style={styles.fallbackText}>
                OS: {EnvironmentDetector.getPlatformInfo().os}
              </Text>
              <Text style={styles.fallbackText}>
                Widget Support: {EnvironmentDetector.canUseElevenLabsWidget() ? 'Yes' : 'No'}
              </Text>
            </View>
          )}

          <View style={styles.errorActions}>
            {isRetryable && (
              <TouchableOpacity
                style={[styles.actionButton, styles.retryButton]}
                onPress={handleRetry}
                disabled={widgetState.isRecovering}
              >
                {widgetState.isRecovering ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="refresh" size={20} color="#fff" />
                )}
                <Text style={styles.retryButtonText}>
                  {widgetState.isRecovering ? 'Recovering...' : 'Retry'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.closeButton]}
              onPress={() => onError(widgetState.error!)}
            >
              <Ionicons name="close" size={20} color={Colors.dark.text} />
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          {widgetState.retryCount > 0 && (
            <Text style={styles.retryCountText}>
              Retry attempts: {widgetState.retryCount}/3
            </Text>
          )}
        </Animated.View>
      </View>
    );
  }

  // Render loading state
  if (widgetState.isLoading) {
    const isRecovering = widgetState.isRecovering || widgetState.retryCount > 0;

    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              transform: [{ scale: contentScale }],
              opacity: statusOpacity,
            }
          ]}
        >
          <Animated.View
            style={{
              transform: [{ rotate: loadingRotationInterpolate }],
            }}
          >
            <ActivityIndicator size="large" color={Colors.dark.tint} />
          </Animated.View>
          <Text style={styles.loadingText}>
            {isRecovering ? 'Recovering voice chat...' : 'Initializing voice chat...'}
          </Text>
          <Text style={styles.loadingSubtext}>
            {isRecovering
              ? `Attempting to restore connection (${widgetState.retryCount + 1}/3)`
              : 'Setting up ElevenLabs conversational agent'
            }
          </Text>

          {isRecovering && (
            <View style={styles.recoveryInfo}>
              <Text style={styles.recoveryText}>
                Please wait while we restore your voice session...
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    );
  }

  // Render active widget state
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.widgetContainer,
          {
            transform: [{ scale: contentScale }],
            opacity: statusOpacity,
          }
        ]}
      >
        {/* This is where the actual ElevenLabs widget would be rendered */}
        <View style={styles.simulatedWidget}>
          {/* Voice Activity Status */}
          <Animated.View
            style={[
              styles.statusIndicator,
              {
                opacity: statusOpacity,
                transform: [{ scale: voiceActivityScale }],
              }
            ]}
          >
            <Animated.View
              style={[
                styles.pulsingDot,
                {
                  backgroundColor: getVoiceActivityColor(),
                  transform: [{ scale: pulseAnimation }],
                }
              ]}
            />
            <Text style={[styles.statusText, { color: getVoiceActivityStatus().color }]}>
              {getVoiceActivityStatus().text}
            </Text>
            <Ionicons
              name={getVoiceActivityStatus().icon}
              size={16}
              color={getVoiceActivityStatus().color}
              style={styles.statusIcon}
            />
          </Animated.View>

          {/* Agent Response Indicator */}
          {widgetState.agentResponse && (
            <Animated.View
              style={[
                styles.agentResponseIndicator,
                { opacity: agentResponseOpacity }
              ]}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color={Colors.dark.tint} />
              <Text style={styles.agentResponseText}>Agent is responding...</Text>
            </Animated.View>
          )}

          {/* Enhanced Waveform Visualization */}
          <View style={styles.waveformContainer}>
            {[...Array(12)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.waveformBar,
                  {
                    height: (Math.sin(i * 0.5) + 1) * 20 + 10,
                    backgroundColor: getVoiceActivityColor(),
                    opacity: widgetState.voiceActivity === 'idle' ? 0.3 : 1,
                    transform: [{ scaleY: waveformScaleInterpolate }],
                  }
                ]}
              />
            ))}
          </View>

          {/* Voice Activity Level Indicator */}
          <View style={styles.activityLevelContainer}>
            <Text style={styles.activityLevelLabel}>Voice Level</Text>
            <View style={styles.activityLevelBar}>
              <Animated.View
                style={[
                  styles.activityLevelFill,
                  {
                    backgroundColor: getVoiceActivityColor(),
                    width: widgetState.voiceActivity === 'speaking' ? '80%' :
                      widgetState.voiceActivity === 'listening' ? '40%' : '10%',
                  }
                ]}
              />
            </View>
          </View>

          <Text style={styles.instructionText}>
            {widgetState.voiceActivity === 'listening'
              ? 'Speak naturally to continue your conversation'
              : widgetState.voiceActivity === 'processing'
                ? 'Processing your request...'
                : widgetState.voiceActivity === 'speaking'
                  ? 'Keep speaking, I\'m listening'
                  : 'Voice session is active'
            }
          </Text>

          {/* Session Controls */}
          <Animated.View
            style={[
              styles.sessionControls,
              { opacity: sessionControlsOpacity }
            ]}
          >
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => {
                setWidgetState(prev => ({
                  ...prev,
                  voiceActivity: prev.voiceActivity === 'listening' ? 'idle' : 'listening'
                }));
              }}
            >
              <Ionicons
                name={widgetState.voiceActivity === 'listening' ? 'mic-off' : 'mic'}
                size={18}
                color={Colors.dark.text}
              />
              <Text style={styles.controlButtonText}>
                {widgetState.voiceActivity === 'listening' ? 'Mute' : 'Unmute'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.endSessionButton]}
              onPress={handleEndSession}
            >
              <Ionicons name="stop" size={18} color="#fff" />
              <Text style={styles.endSessionText}>End Session</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.dark.icon,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  fallbackInfo: {
    backgroundColor: Colors.dark.chatInputBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 12,
    color: Colors.dark.icon,
    marginBottom: 4,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: Colors.dark.tint,
  },
  closeButton: {
    backgroundColor: Colors.dark.chatInputBackground,
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeButtonText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  retryCountText: {
    fontSize: 12,
    color: Colors.dark.icon,
    marginTop: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.dark.text,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.dark.icon,
    marginTop: 8,
    textAlign: 'center',
  },
  recoveryInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.dark.chatInputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
  },
  recoveryText: {
    fontSize: 12,
    color: Colors.dark.icon,
    textAlign: 'center',
    lineHeight: 16,
  },
  widgetContainer: {
    flex: 1,
    padding: 20,
  },
  simulatedWidget: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '500',
    flex: 1,
  },
  statusIcon: {
    marginLeft: 8,
  },
  agentResponseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(118, 75, 162, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(118, 75, 162, 0.3)',
  },
  agentResponseText: {
    fontSize: 14,
    color: Colors.dark.tint,
    fontWeight: '500',
    marginLeft: 8,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 80,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  waveformBar: {
    width: 3,
    backgroundColor: Colors.dark.tint,
    marginHorizontal: 1.5,
    borderRadius: 1.5,
    minHeight: 4,
  },
  activityLevelContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  activityLevelLabel: {
    fontSize: 12,
    color: Colors.dark.icon,
    marginBottom: 8,
    textAlign: 'center',
  },
  activityLevelBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  activityLevelFill: {
    height: '100%',
    borderRadius: 3,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.dark.icon,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  sessionControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.chatInputBackground,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
    flex: 1,
    justifyContent: 'center',
  },
  controlButtonText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  endSessionButton: {
    backgroundColor: '#ff4444',
    borderColor: '#ff4444',
  },
  endSessionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});