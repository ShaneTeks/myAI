import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface WeatherData {
  background: string;
  conditionImage: string;
  lowTemperature: string;
  highTemperature: string;
  location: string;
  conditionDescription: string;
  forecast: Array<{
    conditionImage: string;
    temperature: string;
  }>;
}

interface WeatherCardProps {
  data: WeatherData;
}

export default function WeatherCard({ data }: WeatherCardProps) {
  // Parse gradient from CSS string
  const parseGradient = (gradientString: string): [string, string, ...string[]] => {
    // Extract colors from linear-gradient string
    const colorMatches = gradientString.match(/#[0-9A-Fa-f]{6}/g);
    if (colorMatches && colorMatches.length >= 2) {
      return colorMatches as [string, string, ...string[]];
    }
    // Fallback colors
    return ['#1769C8', '#31A3F8'];
  };

  const gradientColors = parseGradient(data.background);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.content}>
          {/* Main weather icon */}
          <View style={styles.mainIconContainer}>
            <Image 
              source={{ uri: data.conditionImage }} 
              style={styles.mainIcon}
              resizeMode="contain"
            />
          </View>

          {/* Temperature range */}
          <View style={styles.temperatureRow}>
            <Text style={styles.lowTemp}>{data.lowTemperature}</Text>
            <Text style={styles.highTemp}>{data.highTemperature}</Text>
          </View>

          {/* Location */}
          <Text style={styles.location}>{data.location}</Text>

          {/* Condition description */}
          <Text style={styles.description}>{data.conditionDescription}</Text>

          {/* Forecast */}
          <View style={styles.forecastContainer}>
            {data.forecast.map((day, index) => (
              <View key={index} style={styles.forecastItem}>
                <Image 
                  source={{ uri: day.conditionImage }} 
                  style={styles.forecastIcon}
                  resizeMode="contain"
                />
                <Text style={styles.forecastTemp}>{day.temperature}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    padding: 20,
    minHeight: 200,
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  mainIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainIcon: {
    width: 80,
    height: 80,
  },
  temperatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lowTemp: {
    fontSize: 32,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  highTemp: {
    fontSize: 32,
    fontWeight: '300',
    color: '#ffffff',
  },
  location: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 18,
  },
  forecastContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
    gap: 12,
  },
  forecastItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  forecastIcon: {
    width: 40,
    height: 40,
  },
  forecastTemp: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
});