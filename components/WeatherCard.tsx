import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler';

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
  messageId?: string; // For tracking minimized state per message
}

export default function WeatherCard({ data, messageId }: WeatherCardProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const translateY = new Animated.Value(0);
  const scale = new Animated.Value(1);
  const opacity = new Animated.Value(1);

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

  const handleGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationY } = event.nativeEvent;
    
    // Only allow upward swipes (negative translationY)
    if (translationY < 0) {
      translateY.setValue(translationY);
      // Scale down slightly as user swipes up
      const scaleValue = Math.max(0.95, 1 + translationY / 500);
      scale.setValue(scaleValue);
    }
  };

  const handleStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      // Minimize if swiped up enough or with enough velocity
      const shouldMinimize = translationY < -50 || velocityY < -500;
      
      if (shouldMinimize && !isMinimized) {
        // Animate to minimized state
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 250, // Fade out slightly faster
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsMinimized(true);
          // Don't reset animation values - keep them at final state to avoid flash
        });
      } else {
        // Snap back to original position
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.spring(opacity, {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  };

  const handleIconPress = () => {
    setIsMinimized(false);
    // Reset animation values to their starting state for expansion
    translateY.setValue(0);
    scale.setValue(1);
    opacity.setValue(0);
    
    // Animate the widget back in smoothly
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Render minimized icon
  if (isMinimized) {
    return (
      <TouchableOpacity onPress={handleIconPress} style={styles.minimizedContainer}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.minimizedIcon}
        >
          <Image 
            source={{ uri: data.conditionImage }} 
            style={styles.minimizedWeatherIcon}
            resizeMode="contain"
          />
          <Text style={styles.minimizedTemp}>{data.highTemperature}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Render full widget
  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleStateChange}
    >
      <Animated.View 
        style={[
          styles.container,
          {
            transform: [
              { translateY },
              { scale }
            ],
            opacity
          }
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.content}>
            {/* Swipe indicator */}
            <View style={styles.swipeIndicator}>
              <View style={styles.swipeHandle} />
            </View>

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
      </Animated.View>
    </PanGestureHandler>
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
  swipeIndicator: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  swipeHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
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
  minimizedContainer: {
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  minimizedIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  minimizedWeatherIcon: {
    width: 24,
    height: 24,
    marginRight: 6,
  },
  minimizedTemp: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});