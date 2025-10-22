import { Colors } from '@/constants/theme';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface CurrentWeatherData {
  location: string;
  temperature: string;
  feelsLike: string;
  condition: string;
  conditionImage: string;
  humidity: string;
  windSpeed: string;
  windDirection: string;
  pressure: string;
  visibility: string;
  uvIndex: string;
  lastUpdated: string;
  cloudCover?: string;
  dewPoint?: string;
  airQuality?: {
    usEpaIndex: number;
    gbDefraIndex: number;
    pm2_5: number;
    pm10: number;
  };
}

interface SimpleWeatherDisplayProps {
  data: CurrentWeatherData;
}

export default function SimpleWeatherDisplay({ data }: SimpleWeatherDisplayProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.location}>{data.location}</Text>
        <Text style={styles.lastUpdated}>Updated: {data.lastUpdated}</Text>
      </View>
      
      <View style={styles.mainInfo}>
        <Image 
          source={{ uri: data.conditionImage }} 
          style={styles.weatherIcon}
          resizeMode="contain"
        />
        <View style={styles.tempInfo}>
          <Text style={styles.temperature}>{data.temperature}</Text>
          <Text style={styles.condition}>{data.condition}</Text>
          <Text style={styles.feelsLike}>Feels like {data.feelsLike}</Text>
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Humidity:</Text>
          <Text style={styles.detailValue}>{data.humidity}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Wind:</Text>
          <Text style={styles.detailValue}>{data.windSpeed} {data.windDirection}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Pressure:</Text>
          <Text style={styles.detailValue}>{data.pressure}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Visibility:</Text>
          <Text style={styles.detailValue}>{data.visibility}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>UV Index:</Text>
          <Text style={styles.detailValue}>{data.uvIndex}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.messageAI,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    marginBottom: 16,
  },
  location: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  lastUpdated: {
    color: Colors.dark.icon,
    fontSize: 12,
    marginTop: 4,
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherIcon: {
    width: 80,
    height: 80,
    marginRight: 16,
  },
  tempInfo: {
    flex: 1,
  },
  temperature: {
    color: Colors.dark.text,
    fontSize: 48,
    fontWeight: '300',
    lineHeight: 52,
  },
  condition: {
    color: Colors.dark.text,
    fontSize: 18,
    marginBottom: 4,
  },
  feelsLike: {
    color: Colors.dark.icon,
    fontSize: 14,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: Colors.dark.glassBorder,
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: Colors.dark.icon,
    fontSize: 14,
  },
  detailValue: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500',
  },
});