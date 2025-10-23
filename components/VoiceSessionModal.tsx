import { ElevenLabsWidget } from '@/components/ElevenLabsWidget';
import { Colors } from '@/constants/theme';
import { useChatContext } from '@/contexts/ChatContext';
import type { ConversationContext, ElevenLabsError, VoiceTranscript } from '@/lib/elevenLabsService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    AppState,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface VoiceSessionModalProps {
  visible: boolean;
  onClose: () => void;
  conversationContext: ConversationContext;
  onSessionEnd: (transcript: VoiceTranscript) => void;
}

export function VoiceSessionModal({
  visible,
  onClose,
  conversationContext,
  onSessionEnd,
}: VoiceSessionModalProps) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastError, setLastError] = useState<ElevenLabsError | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(0);
  const { handleVoiceSessionInterruption, recoverVoiceSession } = useChatContext();

  // Animation values using React Native Animated
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalTranslateY = useRef(new Animated.Value(50)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  // Animation effects using React Native Animated
  useEffect(() => {
    if (visible && !isClosing) {
      // Animate in
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(modalTranslateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Stagger header and footer animations
      setTimeout(() => {
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 150);
      
      setTimeout(() => {
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 250);

      // Start progress animation
      Animated.timing(progressWidth, {
        toValue: 100,
        duration: 30000, // 30 second session
        useNativeDriver: false, // width animation can't use native driver
      }).start();
    } else if (!visible || isClosing) {
      // Animate out
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(modalScale, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(modalTranslateY, {
          toValue: 30,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(headerOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(footerOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(progressWidth, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible, isClosing]);

  // Handle app state changes for session interruption
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (visible && nextAppState === 'background') {
        console.log('App backgrounded during voice session');
        handleVoiceSessionInterruption('app_background').catch(error => {
          console.error('Failed to handle app background interruption:', error);
        });
      } else if (visible && nextAppState === 'active' && isRecovering) {
        console.log('App foregrounded, attempting session recovery');
        handleRecovery();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [visible, isRecovering]);

  const handleClose = () => {
    // Light haptic feedback for close action
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Start closing animation
    setIsClosing(true);
    
    // Handle user abort interruption
    if (visible) {
      handleVoiceSessionInterruption('user_abort').catch(error => {
        console.error('Failed to handle user abort:', error);
      });
    }
    
    // Delay actual close to allow animation to complete
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  };

  const handleSessionEnd = (transcript: VoiceTranscript) => {
    // Start closing animation
    setIsClosing(true);
    
    // Delay to allow animation
    setTimeout(() => {
      onSessionEnd(transcript);
      setIsClosing(false);
      onClose();
    }, 250);
  };

  const handleError = (error: ElevenLabsError) => {
    console.error('ElevenLabs Widget Error:', error);
    setLastError(error);
    
    // Handle different types of errors
    if (error.code === 'NETWORK_ERROR') {
      handleNetworkError(error);
    } else if (error.code === 'SESSION_INTERRUPTION_ERROR') {
      handleSessionInterruption(error);
    } else {
      // For other errors, show alert and close
      Alert.alert(
        'Voice Chat Error',
        error.message,
        [
          { text: 'Retry', onPress: handleRetry },
          { text: 'Close', onPress: onClose, style: 'cancel' }
        ]
      );
    }
  };

  const handleNetworkError = async (error: ElevenLabsError) => {
    try {
      setIsRecovering(true);
      const result = await handleVoiceSessionInterruption('network_error');
      
      if (result.strategy === 'retry') {
        // Attempt automatic recovery
        setTimeout(() => {
          handleRecovery();
        }, 3000);
      } else if (result.strategy === 'preserve') {
        // Show recovery options to user
        Alert.alert(
          'Connection Lost',
          'Your voice session was interrupted. Would you like to try to recover it?',
          [
            { text: 'Recover', onPress: handleRecovery },
            { text: 'End Session', onPress: onClose, style: 'cancel' }
          ]
        );
      } else {
        // Session was aborted
        Alert.alert(
          'Connection Failed',
          'Unable to maintain voice connection. The session has been ended.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (recoveryError) {
      console.error('Failed to handle network error:', recoveryError);
      Alert.alert(
        'Recovery Failed',
        'Unable to recover from network error.',
        [{ text: 'OK', onPress: onClose }]
      );
    } finally {
      setIsRecovering(false);
    }
  };

  const handleSessionInterruption = async (error: ElevenLabsError) => {
    try {
      setIsRecovering(true);
      const result = await handleVoiceSessionInterruption('system_interrupt');
      
      if (result.recoveryPossible) {
        Alert.alert(
          'Session Interrupted',
          'Your voice session was interrupted. Would you like to continue?',
          [
            { text: 'Continue', onPress: handleRecovery },
            { text: 'End Session', onPress: onClose, style: 'cancel' }
          ]
        );
      } else {
        Alert.alert(
          'Session Ended',
          'Your voice session was interrupted and cannot be recovered.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (recoveryError) {
      console.error('Failed to handle session interruption:', recoveryError);
      onClose();
    } finally {
      setIsRecovering(false);
    }
  };

  const handleRecovery = async () => {
    try {
      setIsRecovering(true);
      const result = await recoverVoiceSession();
      
      if (result.recovered) {
        console.log('Voice session recovered successfully');
        setLastError(null);
        // Session continues in the widget
      } else {
        Alert.alert(
          'Recovery Failed',
          result.error || 'Unable to recover voice session.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      console.error('Recovery attempt failed:', error);
      Alert.alert(
        'Recovery Error',
        'An error occurred while trying to recover the session.',
        [{ text: 'OK', onPress: onClose }]
      );
    } finally {
      setIsRecovering(false);
    }
  };

  const handleRetry = () => {
    setLastError(null);
    // The widget will reinitialize automatically
  };

  // Animated styles using React Native Animated
  const progressWidthInterpolate = progressWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <Animated.View 
        style={[
          styles.modalOverlay,
          { opacity: overlayOpacity }
        ]}
      >
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [
                { scale: modalScale },
                { translateY: modalTranslateY },
              ],
            }
          ]}
        >
          {/* Header with close button */}
          <Animated.View 
            style={[
              styles.header,
              { opacity: headerOpacity }
            ]}
          >
            <View style={styles.headerContent}>
              <View style={styles.titleContainer}>
                <Ionicons 
                  name="mic" 
                  size={20} 
                  color={Colors.dark.tint} 
                  style={styles.micIcon}
                />
                <Text style={styles.title}>Voice Chat</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name="close" 
                  size={24} 
                  color={Colors.dark.text} 
                />
              </TouchableOpacity>
            </View>
            
            {/* Session Progress Bar */}
            <View style={styles.progressContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  { width: progressWidthInterpolate }
                ]} 
              />
            </View>
          </Animated.View>

          {/* Widget container */}
          <View style={styles.widgetContainer}>
            <ElevenLabsWidget
              conversationContext={conversationContext}
              onSessionEnd={handleSessionEnd}
              onError={handleError}
            />
          </View>

          {/* Footer with instructions */}
          <Animated.View 
            style={[
              styles.footer,
              { opacity: footerOpacity }
            ]}
          >
            {isRecovering ? (
              <View style={styles.recoveryContainer}>
                <Ionicons name="refresh" size={16} color={Colors.dark.tint} />
                <Text style={styles.recoveryText}>
                  Recovering session...
                </Text>
              </View>
            ) : lastError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={16} color="#ff4444" />
                <Text style={styles.errorText}>
                  Connection issue detected
                </Text>
              </View>
            ) : (
              <Text style={styles.instructionText}>
                Speak naturally to continue your conversation
              </Text>
            )}
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.dark.chatInputBackground,
    borderRadius: 16,
    width: screenWidth * 0.9,
    maxWidth: 400,
    height: screenHeight * 0.7,
    maxHeight: 600,
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: Colors.dark.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.chatInputBorder,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  micIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressContainer: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.dark.tint,
  },
  widgetContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  footer: {
    backgroundColor: Colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.chatInputBorder,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.dark.icon,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  recoveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryText: {
    fontSize: 14,
    color: Colors.dark.tint,
    marginLeft: 8,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
    marginLeft: 8,
    fontWeight: '500',
  },
});