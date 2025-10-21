import { sampleWeatherData } from '@/lib/widgetParser';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import MessageWithWidgets from './MessageWithWidgets';

// Test component to verify weather card functionality
export default function TestWeatherMessage() {
  // Create a mock message with structured weather data
  const mockWeatherMessage = {
    id: 'test-weather-message',
    conversation_id: 'test-conversation',
    content: JSON.stringify({
      weather: true,
      text: "Here's the current weather information:",
      weatherData: sampleWeatherData
    }),
    is_user: false,
    user_id: 'test-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Create a mock message with your exact n8n response format
  const mockN8nWeatherMessage = {
    id: 'test-n8n-weather-message',
    conversation_id: 'test-conversation',
    content: JSON.stringify([{
      "output": {
        "AIResponse": "Here's the current weather in Swakopmund: clear skies with mild temperatures, 20 °C during the day and 10 °C at night.",
        "weatherAgent": {
          "weather": true,
          "output": {
            "background": "sunny",
            "conditionImage": "https://example.com/sunny.png",
            "lowTemperature": "10 °C",
            "highTemperature": "22 °C",
            "location": "Swakopmund, Namibia",
            "conditionDescription": "Clear skies with mild temperatures",
            "forecast": [
              {
                "conditionImage": "https://example.com/sunny.png",
                "temperature": "20 °C"
              },
              {
                "conditionImage": "https://example.com/sunny.png",
                "temperature": "22 °C"
              },
              {
                "conditionImage": "https://example.com/sunny.png",
                "temperature": "18 °C"
              }
            ]
          }
        }
      }
    }]),
    is_user: false,
    user_id: 'test-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const mockTextMessage = {
    id: 'test-text-message',
    conversation_id: 'test-conversation',
    content: "This is a regular text message without weather data.",
    is_user: false,
    user_id: 'test-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return (
    <View style={styles.container}>
      {/* Regular text message */}
      <MessageWithWidgets message={mockTextMessage} />
      
      {/* n8n weather message with card */}
      <MessageWithWidgets message={mockN8nWeatherMessage} />
      
      {/* Legacy weather message with card */}
      <MessageWithWidgets message={mockWeatherMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
});