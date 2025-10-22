import { Colors } from '@/constants/theme';
import { Message } from '@/lib/supabase';
import { isValidWeatherData, parseStructuredResponse } from '@/lib/widgetParser';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import WeatherCard from './WeatherCard';

interface MessageWithWidgetsProps {
  message: Message;
}

export default function MessageWithWidgets({ message }: MessageWithWidgetsProps) {
  const { text, hasWeather, weatherData } = parseStructuredResponse(message.content);
  
  // Check if there's any content to display
  const hasTextContent = text.trim().length > 0;
  const hasWeatherContent = hasWeather && weatherData && isValidWeatherData(weatherData);
  const hasAnyContent = hasTextContent || hasWeatherContent;
  
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
          <View
            style={[
              styles.messageBubble,
              message.is_user ? styles.userMessage : styles.aiMessage,
            ]}
          >
            <Text style={[
              styles.messageText,
              message.is_user ? styles.userMessageText : styles.messageText,
            ]}>
              {text}
            </Text>
          </View>
        )}
        
        {/* Weather Card */}
        {hasWeatherContent && (
          <View style={styles.weatherContainer}>
            <WeatherCard data={weatherData} />
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
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 8,
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
});