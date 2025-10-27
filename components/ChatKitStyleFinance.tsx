import { MonthlyFinanceData } from '@/lib/widgetParser';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler';

interface ChatKitStyleFinanceProps {
  data: MonthlyFinanceData;
  messageId?: string;
}

export default function ChatKitStyleFinance({ data, messageId }: ChatKitStyleFinanceProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const translateY = new Animated.Value(0);
  const scale = new Animated.Value(1);
  const opacity = new Animated.Value(0); // Start invisible for smooth fade-in
  const widgetFadeAnim = new Animated.Value(0); // Separate animation for initial widget appearance

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

  // Get fallback icon for stats and transactions
  const getIconFallback = (iconName: string): string => {
    const iconMap: { [key: string]: string } = {
      'trending-up': '📈',
      'trending-down': '📉',
      'piggy-bank': '🐷',
      'dollar-sign': '💰',
      'shopping-cart': '🛒',
      'car': '🚗',
      'utensils': '🍽️',
      'film': '🎬',
      'shopping-bag': '🛍️',
      'zap': '⚡',
      'truck': '🚚',
      'heart': '❤️',
      'book': '📚',
      'briefcase': '💼',
      'gift': '🎁',
      'plus-circle': '➕',
      'circle': '⭕',
    };
    return iconMap[iconName] || '💰';
  };

  // Find savings stat for minimized view
  const savingsStat = data.stats.find(stat => stat.key === 'savings' || stat.label.toLowerCase().includes('saving'));
  const minimizedText = savingsStat ? savingsStat.value : data.stats[0]?.value || 'Finance';

  // Render minimized icon
  if (isMinimized) {
    return (
      <TouchableOpacity onPress={handleIconPress} style={styles.minimizedContainer}>
        <LinearGradient
          colors={['#4A90E2', '#357ABD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.minimizedIcon}
        >
          <Text style={styles.minimizedFallbackIcon}>💰</Text>
          <View style={styles.minimizedTextContainer}>
            <Text style={styles.minimizedLabel}>Monthly Finance</Text>
            <Text style={styles.minimizedValue}>{minimizedText}</Text>
          </View>
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
            colors={['#4A90E2', '#357ABD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.title}>{data.title}</Text>
                <Text style={styles.subtitle}>{data.subtitle}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{data.monthLabel}</Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {data.stats.map((stat) => (
                <View key={stat.key} style={styles.statItem}>
                  <View style={styles.statContent}>
                    <View style={[styles.statIcon, { backgroundColor: stat.accent }]}>
                      <Text style={styles.statIconText}>
                        {getIconFallback(stat.icon)}
                      </Text>
                    </View>
                    <View style={styles.statTextContainer}>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                      <Text style={styles.statValue}>{stat.value}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Transactions */}
            <View style={styles.transactionsContainer}>
              <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
                {data.transactions.map((transaction) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={[styles.transactionIcon, { backgroundColor: transaction.accent }]}>
                      <Text style={styles.transactionIconText}>
                        {getIconFallback(transaction.icon)}
                      </Text>
                    </View>
                    <View style={styles.transactionContent}>
                      <Text style={styles.transactionMerchant} numberOfLines={1}>
                        {transaction.merchant}
                      </Text>
                      <Text style={styles.transactionDetails}>
                        {transaction.typeLabel} • Fee {transaction.fee}
                      </Text>
                    </View>
                    <Text style={styles.transactionAmount}>{transaction.amount}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Monthly Summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Monthly summary</Text>
              <Text style={styles.summaryText}>{data.summary}</Text>
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
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '400',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconText: {
    fontSize: 18,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 16,
  },
  transactionsContainer: {
    maxHeight: 200,
  },
  transactionsList: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionIconText: {
    fontSize: 16,
  },
  transactionContent: {
    flex: 1,
  },
  transactionMerchant: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDetails: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '400',
  },
  transactionAmount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryContainer: {
    marginTop: 8,
  },
  summaryTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  summaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  swipeIndicator: {
    alignItems: 'center',
    paddingTop: 16,
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
  minimizedFallbackIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  minimizedTextContainer: {
    flexDirection: 'column',
  },
  minimizedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  minimizedValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});