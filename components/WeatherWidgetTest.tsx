import { Colors } from '@/constants/theme';
import { sampleWeatherData } from '@/lib/widgetParser';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WeatherCard from './WeatherCard';

export default function WeatherWidgetTest() {
  const [showWeatherCard, setShowWeatherCard] = useState(false);

  const testWeatherCard = () => {
    setShowWeatherCard(true);
  };

  const copyStructuredResponse = () => {
    const n8nResponse = [{
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
              }
            ]
          }
        }
      }
    }];
    
    Alert.alert(
      'n8n Response Format',
      `Your n8n agent should return this exact format:\n\n${JSON.stringify(n8nResponse, null, 2)}`,
      [{ text: 'OK' }]
    );
  };

  const testMessage = () => {
    Alert.alert(
      'Test in Chat',
      'Try asking: "What\'s the weather like?" in your main chat. Your n8n agent should return a structured response with weather=true and weatherData.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Native Weather Card Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={testWeatherCard}>
        <Text style={styles.buttonText}>Show Weather Card</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={copyStructuredResponse}>
        <Text style={styles.buttonText}>View n8n Response Format</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testMessage}>
        <Text style={styles.buttonText}>How to Test in Chat</Text>
      </TouchableOpacity>
      
      <Text style={styles.instructions}>
        Your n8n agent should return structured responses like:
        {'\n\n'}• weather: true/false
        {'\n'}• text: "response text"
        {'\n'}• weatherData: {'{...}'}
        {'\n\n'}This creates native React Native cards instead of web widgets.
      </Text>
      
      {showWeatherCard && (
        <View style={styles.cardContainer}>
          <WeatherCard data={sampleWeatherData} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.dark.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.dark.tint,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    color: Colors.dark.icon,
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 20,
    textAlign: 'center',
  },
  cardContainer: {
    marginTop: 20,
  },
});