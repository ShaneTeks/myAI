import { Colors } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface LoadingDotsProps {
  text?: string;
}

export default function LoadingDots({ text = "Loading conversation" }: LoadingDotsProps) {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDots = () => {
      const createDotAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]);
      };

      const animation = Animated.loop(
        Animated.parallel([
          createDotAnimation(dot1Anim, 0),
          createDotAnimation(dot2Anim, 200),
          createDotAnimation(dot3Anim, 400),
        ])
      );

      animation.start();
      return animation;
    };

    const animation = animateDots();
    return () => animation.stop();
  }, [dot1Anim, dot2Anim, dot3Anim]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, { opacity: dot1Anim }]} />
        <Animated.View style={[styles.dot, { opacity: dot2Anim }]} />
        <Animated.View style={[styles.dot, { opacity: dot3Anim }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    color: Colors.dark.icon,
    opacity: 0.7,
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.icon,
    marginHorizontal: 1,
  },
});