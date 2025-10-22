import { parseStructuredResponse } from '@/lib/widgetParser';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ChatKitWidget from './ChatKitWidget';

// Import the examples from the JSON file
const weatherExamples = require('../N8N_WEATHER_EXAMPLES.json');

export default function TestN8NExamples() {
  const currentExample = weatherExamples.examples.currentWeather.response;
  const forecastExample = weatherExamples.examples.forecastWeather.response;

  // Parse the examples to get the data
  const currentParsed = parseStructuredResponse(currentExample);
  const forecastParsed = parseStructuredResponse(forecastExample);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>N8N Weather Examples Test</Text>
        <Text style={styles.subtitle}>
          Testing the examples from N8N_WEATHER_EXAMPLES.json
        </Text>

        <Text style={styles.sectionTitle}>Current Weather Example</Text>
        <Text style={styles.description}>
          Keywords: {weatherExamples.examples.currentWeather.keywords.join(', ')}
        </Text>
        <Text style={styles.aiResponse}>
          AI Response: "{currentParsed.text}"
        </Text>
        {currentParsed.hasWeather && (
          <ChatKitWidget 
            widgetId="wig_e79yqoni"
            widgetType="weather"
            data={currentParsed.weatherData}
            height={300}
          />
        )}

        <Text style={styles.sectionTitle}>Forecast Weather Example</Text>
        <Text style={styles.description}>
          Keywords: {weatherExamples.examples.forecastWeather.keywords.join(', ')}
        </Text>
        <Text style={styles.aiResponse}>
          AI Response: "{forecastParsed.text}"
        </Text>
        {forecastParsed.hasWeather && (
          <ChatKitWidget 
            widgetId="wig_5dafl1gl"
            widgetType="forecast"
            data={forecastParsed.weatherData}
            height={300}
          />
        )}

        <Text style={styles.note}>
          These examples show exactly what your N8N agent should output for each weather type.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 32,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 8,
    lineHeight: 18,
  },
  aiResponse: {
    fontSize: 14,
    color: '#64b5f6',
    marginBottom: 16,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  note: {
    fontSize: 14,
    color: '#888888',
    marginTop: 32,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});