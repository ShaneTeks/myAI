import { Colors } from '@/constants/theme';
import { elevenLabsService } from '@/lib/elevenLabsService';
import { EnvironmentDetector } from '@/lib/environmentDetector';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export interface VoiceButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isSupported?: boolean;
  showFallbackAlert?: boolean;
}

export function VoiceButton({ 
  onPress, 
  disabled = false, 
  isSupported,
  showFallbackAlert = true
}: VoiceButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Determine support status if not explicitly provided
  const supportStatus = isSupported ?? elevenLabsService.isWidgetSupported();

  // Animation values using React Native Animated
  const scale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTranslateY = useRef(new Animated.Value(10)).current;
  // Animation effects using React Native Animated
  useEffect(() => {
    if (supportStatus && !disabled) {
      // Subtle pulse animation for supported state
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(pulseOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [supportStatus, disabled]);

  useEffect(() => {
    if (showTooltip) {
      Animated.parallel([
        Animated.timing(tooltipOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(tooltipTranslateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(tooltipOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(tooltipTranslateY, {
          toValue: 10,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showTooltip]);
  
  const handlePress = () => {
    if (disabled) {
      return;
    }

    // Press animation
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    if (!supportStatus) {
      // Error shake animation
      Animated.sequence([
        Animated.timing(iconRotation, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotation, {
          toValue: -5,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotation, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();

      if (showFallbackAlert) {
        showEnvironmentFallbackAlert();
      }
      return;
    }

    // Success animation
    Animated.sequence([
      Animated.timing(iconRotation, {
        toValue: 15,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(iconRotation, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();

    // Light haptic feedback for tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleLongPress = () => {
    if (disabled) {
      return;
    }

    // Long press animation
    Animated.spring(scale, {
      toValue: 1.05,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }, 200);

    // Medium haptic feedback for long press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!supportStatus) {
      showEnvironmentFallbackAlert();
    } else {
      // Show support status information on long press
      const status = elevenLabsService.getWidgetSupportStatus();
      console.log('Voice Button Status:', status);
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
    }
  };

  const showEnvironmentFallbackAlert = () => {
    const platformInfo = EnvironmentDetector.getPlatformInfo();
    const supportStatus = elevenLabsService.getWidgetSupportStatus();
    
    let title = 'Voice Chat Unavailable';
    let message = '';
    let suggestions: string[] = [];

    if (EnvironmentDetector.isExpoGO()) {
      title = 'Voice Chat Requires Prebuilt App';
      message = 'Voice chat functionality is not available in Expo Go due to native widget requirements.';
      suggestions = [
        '• Create a development build using EAS Build',
        '• Use "npx expo run:ios" or "npx expo run:android" for local development',
        '• Continue using text chat for now'
      ];
    } else if (platformInfo.isWeb) {
      title = 'Voice Chat Not Available on Web';
      message = 'Voice chat requires native mobile platform capabilities.';
      suggestions = [
        '• Use the mobile app for voice features',
        '• Continue with text chat on web'
      ];
    } else {
      title = 'Voice Chat Configuration Issue';
      message = supportStatus.reason || 'Voice chat is not properly configured.';
      suggestions = [
        '• Check app configuration',
        '• Restart the app',
        '• Contact support if issue persists'
      ];
    }

    const fullMessage = message + '\n\nOptions:\n' + suggestions.join('\n');

    Alert.alert(title, fullMessage, [
      { text: 'Learn More', onPress: showDetailedEnvironmentInfo },
      { text: 'OK', style: 'default' }
    ]);
  };

  const showDetailedEnvironmentInfo = () => {
    const platformInfo = EnvironmentDetector.getPlatformInfo();
    const supportStatus = elevenLabsService.getWidgetSupportStatus();
    
    const details = [
      `Platform: ${platformInfo.os} (${platformInfo.executionEnvironment})`,
      `Environment: ${supportStatus.environment}`,
      `Widget Support: ${supportStatus.supported ? 'Yes' : 'No'}`,
      `Reason: ${supportStatus.reason}`
    ].join('\n');

    Alert.alert('Environment Details', details, [{ text: 'OK' }]);
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (!supportStatus) {
      return 'mic-off-outline';
    }
    
    if (disabled) {
      return 'mic-outline';
    }
    
    return 'mic';
  };

  const getIconColor = (): string => {
    if (!supportStatus) {
      return Colors.dark.icon; // Muted color for unsupported
    }
    
    if (disabled) {
      return Colors.dark.icon;
    }
    
    return Colors.dark.tint; // Active color when available
  };

  const getContainerStyle = () => {
    if (!supportStatus) {
      return [styles.container, styles.unsupportedContainer];
    } else if (disabled) {
      return [styles.container, styles.disabledContainer];
    } else {
      return [styles.container, styles.enabledContainer];
    }
  };

  // Animated styles using React Native Animated
  const iconRotationInterpolate = iconRotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={getContainerStyle()}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={800}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.7}
      >
        {/* Pulse overlay for supported state */}
        {supportStatus && !disabled && (
          <Animated.View 
            style={[
              styles.pulseOverlay,
              { opacity: pulseOpacity }
            ]} 
          />
        )}
        
        <View style={styles.iconContainer}>
          <Animated.View 
            style={{
              transform: [{ rotate: iconRotationInterpolate }],
            }}
          >
            <Ionicons 
              name={getIconName()} 
              size={16} 
              color={getIconColor()} 
            />
          </Animated.View>
        </View>
      </TouchableOpacity>
      
      {/* Tooltip for status information */}
      {(showTooltip || (!supportStatus && !showFallbackAlert)) && (
        <Animated.View 
          style={[
            styles.tooltipContainer,
            {
              opacity: tooltipOpacity,
              transform: [{ translateY: tooltipTranslateY }],
            }
          ]}
        >
          <Text style={styles.tooltipText}>
            {showTooltip 
              ? 'Voice chat ready' 
              : 'Tap for voice options'
            }
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 6,
    borderRadius: 16,
    marginLeft: 8,
    alignSelf: 'flex-end',
    borderWidth: 1,
    position: 'relative',
  },
  enabledContainer: {
    backgroundColor: 'rgba(118, 75, 162, 0.15)', // Tint color with transparency
    borderColor: 'rgba(118, 75, 162, 0.3)',
  },
  disabledContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  unsupportedContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseOverlay: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    backgroundColor: Colors.dark.tint,
    zIndex: -1,
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: -35,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: Colors.dark.chatInputBackground,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tooltipText: {
    fontSize: 10,
    color: Colors.dark.icon,
    textAlign: 'center',
    width: 120,
  },
});

export default VoiceButton;