import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler';

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

interface ChatKitStyleWeatherProps {
  data: CurrentWeatherData;
  messageId?: string;
}

export default function ChatKitStyleWeather({ data, messageId }: ChatKitStyleWeatherProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const translateY = new Animated.Value(0);
  const scale = new Animated.Value(1);
  const opacity = new Animated.Value(0); // Start invisible for smooth fade-in
  const widgetFadeAnim = new Animated.Value(0); // Separate animation for initial widget appearance

  // Reset image error when data changes
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [data.conditionImage]);

  // Animate widget appearance on mount
  useEffect(() => {
    opacity.setValue(1); // Set gesture opacity to 1
    Animated.timing(widgetFadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

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
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsMinimized(true);
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

  // Get fallback emoji icon based on condition
  const getFallbackIcon = (condition: string): string => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
      return '☀️';
    } else if (conditionLower.includes('partly cloudy')) {
      return '⛅';
    } else if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
      return '☁️';
    } else if (conditionLower.includes('rain')) {
      return '🌧️';
    } else if (conditionLower.includes('snow')) {
      return '❄️';
    } else if (conditionLower.includes('thunder')) {
      return '⛈️';
    } else {
      return '🌤️'; // Default
    }
  };

  // Determine gradient colors based on condition
  const getGradientColors = (condition: string): [string, string] => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
      return ['#FFB347', '#FF8C42']; // Orange gradient for sunny
    } else if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
      return ['#4A90E2', '#357ABD']; // Blue gradient for cloudy
    } else if (conditionLower.includes('rain')) {
      return ['#5D6D7E', '#34495E']; // Gray gradient for rainy
    } else {
      return ['#4A90E2', '#357ABD']; // Default blue
    }
  };

  const gradientColors = getGradientColors(data.condition);

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
          {data.conditionImage && !imageError ? (
            <Image 
              source={{ 
                uri: data.conditionImage.startsWith('//') 
                  ? `https:${data.conditionImage}` 
                  : data.conditionImage 
              }} 
              style={styles.minimizedWeatherIcon}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.minimizedFallbackIcon}>
              {getFallbackIcon(data.condition)}
            </Text>
          )}
          <Text style={styles.minimizedTemp}>{data.temperature}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Render full widget
  return (
    <Animated.View style={{ opacity: widgetFadeAnim }}>
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.location}>{data.location}</Text>
          <Text style={styles.lastUpdated}>Updated: {data.lastUpdated}</Text>
        </View>

        {/* Main weather info */}
        <View style={styles.mainWeather}>
          <View style={styles.tempSection}>
            <Text style={styles.temperature}>{data.temperature}</Text>
            <Text style={styles.condition}>{data.condition}</Text>
            <Text style={styles.feelsLike}>Feels like {data.feelsLike}</Text>
          </View>
          
          <View style={styles.iconSection}>
            {data.conditionImage && !imageError ? (
              <Image 
                source={{ 
                  uri: data.conditionImage.startsWith('//') 
                    ? `https:${data.conditionImage}` 
                    : data.conditionImage 
                }} 
                style={styles.weatherIcon}
                resizeMode="contain"
                onError={(error) => {
                  console.log('Image load error for:', data.conditionImage);
                  setImageError(true);
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', data.conditionImage);
                  setImageLoading(false);
                }}
              />
            ) : (
              <Text style={styles.fallbackIcon}>
                {getFallbackIcon(data.condition)}
              </Text>
            )}
            

          </View>
        </View>

        {/* Weather details grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Humidity</Text>
            <Text style={styles.detailValue}>{data.humidity}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Wind</Text>
            <Text style={styles.detailValue}>{data.windSpeed} {data.windDirection}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Pressure</Text>
            <Text style={styles.detailValue}>{data.pressure}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Visibility</Text>
            <Text style={styles.detailValue}>{data.visibility}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>UV Index</Text>
            <Text style={styles.detailValue}>{data.uvIndex}</Text>
          </View>
          
          {data.cloudCover && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Cloud Cover</Text>
              <Text style={styles.detailValue}>{data.cloudCover}</Text>
            </View>
          )}
        </View>
        {/* Swipe indicator */}
        <View style={styles.swipeIndicator}>
          <View style={styles.swipeHandle} />
        </View>
      </LinearGradient>
      </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  card: {
    padding: 24,
    minHeight: 280,
  },
  header: {
    marginBottom: 20,
  },
  location: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  lastUpdated: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '400',
  },
  mainWeather: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  tempSection: {
    flex: 1,
    marginRight: 16,
  },
  temperature: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '200',
    lineHeight: 52,
    marginBottom: 4,
  },
  condition: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 4,
  },
  feelsLike: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '400',
  },
  iconSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherIcon: {
    width: 80,
    height: 80,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: 12,
  },
  detailLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fallbackIcon: {
    fontSize: 64,
    textAlign: 'center',
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
  minimizedFallbackIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  minimizedTemp: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});