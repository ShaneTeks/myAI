import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import WeatherCard from './WeatherCard';

const mockWeatherData = {
  background: 'linear-gradient(135deg, #1769C8 0%, #31A3F8 100%)',
  conditionImage: 'https://cdn.weatherapi.com/weather/64x64/day/116.png',
  lowTemperature: '14°C',
  highTemperature: '17°C',
  location: 'Swakopmund, Namibia',
  conditionDescription: 'Partly Cloudy',
  forecast: [
    {
      conditionImage: 'https://cdn.weatherapi.com/weather/64x64/day/116.png',
      temperature: '17°C',
    },
    {
      conditionImage: 'https://cdn.weatherapi.com/weather/64x64/day/119.png',
      temperature: '22°C',
    },
    {
      conditionImage: 'https://cdn.weatherapi.com/weather/64x64/day/116.png',
      temperature: '19°C',
    },
  ],
};

export default function WeatherWidgetTest() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Weather Widget Test</Text>
        <Text style={styles.instructions}>
          Swipe up on the weather widget to minimize it into an icon.
          Tap the icon to expand it back to full size.
        </Text>
        
        <WeatherCard data={mockWeatherData} messageId="test-message-1" />
        
        <Text style={styles.note}>
          The widget should animate smoothly when swiping up and show a small 
          weather icon with temperature when minimized.
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
  note: {
    fontSize: 14,
    color: '#888888',
    marginTop: 24,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});