import { sampleCurrentWeatherData, sampleForecastWeatherData } from '@/lib/widgetParser';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ChatKitWidget from './ChatKitWidget';

export default function WeatherWidgetTest() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Weather Widget Test</Text>
        <Text style={styles.instructions}>
          Testing both current and forecast weather widgets. The app automatically selects the correct widget based on the type field.
        </Text>
        
        <Text style={styles.exampleNote}>
          📄 See N8N_WEATHER_EXAMPLES.json for complete examples with keywords and transformation functions.
        </Text>
        
        <Text style={styles.sectionTitle}>Current Weather Widget (type: "current")</Text>
        <ChatKitWidget 
          widgetId="wig_e79yqoni"
          widgetType="weather"
          data={sampleCurrentWeatherData}
          height={300}
        />
        
        <Text style={styles.sectionTitle}>Forecast Weather Widget (type: "forecast")</Text>
        <ChatKitWidget 
          widgetId="wig_5dafl1gl"
          widgetType="forecast"
          data={sampleForecastWeatherData}
          height={300}
        />
        
        <Text style={styles.note}>
          Your N8N agent only needs to specify "current" or "forecast" in the type field. The app automatically selects the correct ChatKit widget.
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
    marginBottom: 16,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    color: '#a0a0a0',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  exampleNote: {
    fontSize: 12,
    color: '#64b5f6',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  note: {
    fontSize: 14,
    color: '#888888',
    marginTop: 24,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});