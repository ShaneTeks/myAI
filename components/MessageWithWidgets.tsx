import { Colors } from '@/constants/theme';
import { Message } from '@/lib/supabase';
import { isValidCurrentWeatherData, parseStructuredResponse } from '@/lib/widgetParser';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import ChatKitStyleWeather from './ChatKitStyleWeather';
import SpeakerButton from './SpeakerButton';

interface MessageWithWidgetsProps {
  message: Message;
}

export default function MessageWithWidgets({ message }: MessageWithWidgetsProps) {
  const { text, hasWeather, weatherData } = parseStructuredResponse(message.content);
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  
  // Check message type and voice-related properties
  const isVoiceMessage = message.message_type === 'voice';
  const hasAudioUrl = Boolean(message.audio_url);
  
  // Check if there's any content to display
  const hasTextContent = text.trim().length > 0;
  const hasWeatherContent = hasWeather && weatherData && isValidCurrentWeatherData(weatherData);
  const hasAnyContent = hasTextContent || hasWeatherContent;
  
  // Animate text appearance
  useEffect(() => {
    if (hasTextContent) {
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [hasTextContent]);
  
  // Don't render anything if there's no content
  if (!hasAnyContent) {
    return null;
  }
  
  return (
    <View
      style={[
        styles.messageWrapper,
        message.is_user ? styles.userMessageWrapper : styles.aiMessageWrapper,
      ]}
    >
      {!message.is_user && (
        <View style={styles.aiAvatar}>
          <Text style={styles.avatarText}>AI</Text>
        </View>
      )}
      
      <View style={styles.messageContent}>
        {/* Text content */}
        {hasTextContent && (
          <View style={styles.textContainer}>
            <Animated.View
              style={[
                styles.messageBubble,
                message.is_user ? styles.userMessage : styles.aiMessage,
                isVoiceMessage && styles.voiceMessage,
                { opacity: textFadeAnim }
              ]}
            >
              {/* Voice message indicator */}
              {isVoiceMessage && (
                <View style={styles.voiceIndicator}>
                  <Ionicons 
                    name="mic" 
                    size={14} 
                    color={message.is_user ? Colors.dark.icon : Colors.dark.tint} 
                  />
                  <Text style={styles.voiceLabel}>Voice</Text>
                </View>
              )}
              
              <Text style={[
                styles.messageText,
                message.is_user ? styles.userMessageText : styles.messageText,
              ]}>
                {text}
              </Text>
              
              {/* Voice session metadata */}
              {isVoiceMessage && message.voice_session_id && (
                <Text style={styles.voiceMetadata}>
                  Session: {message.voice_session_id.slice(-8)}
                </Text>
              )}
            </Animated.View>
            {/* Show speaker button for AI messages, or audio playback for voice messages with audio */}
            {!message.is_user && (
              <SpeakerButton 
                text={text} 
                messageId={message.id} 
                isUserMessage={message.is_user}
                audioUrl={hasAudioUrl ? message.audio_url || undefined : undefined}
              />
            )}
          </View>
        )}
        
        {/* Weather Widget */}
        {hasWeatherContent && (
          <View style={styles.weatherContainer}>
            {/* ChatKit-style weather widget with swipe-to-minimize */}
            <ChatKitStyleWeather data={weatherData} messageId={message.id} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageWrapper: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  aiMessageWrapper: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageContent: {
    maxWidth: '80%',
    flex: 1,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    flex: 1,
  },
  userMessage: {
    backgroundColor: Colors.dark.messageUser,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: Colors.dark.messageAI,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
  },
  userMessageText: {
    color: Colors.dark.text,
    fontSize: 16,
    lineHeight: 20,
  },
  messageText: {
    color: Colors.dark.text,
    fontSize: 16,
    lineHeight: 20,
  },
  weatherContainer: {
    marginTop: 8,
    width: '100%',
  },
  debugContainer: {
    backgroundColor: '#333',
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  fallbackWeather: {
    backgroundColor: Colors.dark.messageAI,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
  },
  weatherLocation: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  weatherTemp: {
    color: Colors.dark.text,
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 4,
  },
  weatherCondition: {
    color: Colors.dark.text,
    fontSize: 16,
    marginBottom: 8,
  },
  fallbackNote: {
    color: Colors.dark.icon,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  voiceMessage: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.tint,
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    opacity: 0.8,
  },
  voiceLabel: {
    color: Colors.dark.icon,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  voiceMetadata: {
    color: Colors.dark.icon,
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
    fontFamily: 'monospace',
  },
});