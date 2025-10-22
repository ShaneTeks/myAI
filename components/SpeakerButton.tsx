import { Colors } from '@/constants/theme';
import { TextToSpeechService, TTSState } from '@/lib/textToSpeechService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

interface SpeakerButtonProps {
  text: string;
  messageId: string;
  isUserMessage?: boolean;
}

export default function SpeakerButton({ text, messageId, isUserMessage = false }: SpeakerButtonProps) {
  const [ttsState, setTtsState] = useState<TTSState>({
    isLoading: false,
    isPlaying: false,
    isPaused: false,
    error: null,
  });

  useEffect(() => {
    // Subscribe to TTS state updates for this message
    TextToSpeechService.subscribe(messageId, setTtsState);
    
    return () => {
      TextToSpeechService.unsubscribe(messageId);
    };
  }, [messageId]);

  const handlePress = async () => {
    const currentMessageId = TextToSpeechService.getCurrentMessageId();
    
    if (ttsState.isLoading) {
      // Do nothing while loading
      return;
    }

    // Light haptic feedback for tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If there's an error, retry the request
    if (ttsState.error) {
      await TextToSpeechService.generateAndPlaySpeech(text, messageId);
      return;
    }

    if (currentMessageId === messageId) {
      // This message is currently active
      if (ttsState.isPlaying) {
        // Pause the audio
        await TextToSpeechService.pauseAudio();
      } else if (ttsState.isPaused) {
        // Resume the audio
        await TextToSpeechService.resumeAudio();
      }
    } else {
      // Start playing this message (will stop any other playing audio)
      await TextToSpeechService.generateAndPlaySpeech(text, messageId);
    }
  };

  const handleLongPress = async () => {
    // Medium haptic feedback for long press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Stop audio completely
    await TextToSpeechService.stopAudio();
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (ttsState.error) {
      return 'warning-outline';
    }
    
    if (ttsState.isLoading) {
      return 'volume-medium-outline';
    }
    
    if (ttsState.isPlaying) {
      return 'pause';
    }
    
    if (ttsState.isPaused) {
      return 'play';
    }
    
    return 'volume-medium-outline';
  };

  const getIconColor = (): string => {
    if (ttsState.error) {
      return '#ff4444';
    }
    
    if (ttsState.isPlaying || ttsState.isPaused) {
      return Colors.dark.tint;
    }
    
    return isUserMessage ? Colors.dark.text : Colors.dark.icon;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isUserMessage && styles.userMessageContainer
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={800}
      disabled={ttsState.isLoading}
    >
      <View style={styles.iconContainer}>
        {ttsState.isLoading ? (
          <ActivityIndicator 
            size="small" 
            color={getIconColor()} 
          />
        ) : (
          <Ionicons 
            name={getIconName()} 
            size={16} 
            color={getIconColor()} 
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: 8,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userMessageContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  iconContainer: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});