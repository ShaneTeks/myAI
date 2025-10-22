import { Message } from '@/lib/supabase';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import MessageWithWidgets from './MessageWithWidgets';

interface AnimatedMessageListProps {
  messages: Message[];
  conversationId: string | null;
  switchingConversation?: boolean;
}

export default function AnimatedMessageList({ messages, conversationId, switchingConversation = false }: AnimatedMessageListProps) {
  const fadeAnims = useRef<Animated.Value[]>([]);
  const translateAnims = useRef<Animated.Value[]>([]);
  const scaleAnims = useRef<Animated.Value[]>([]);
  const previousConversationId = useRef<string | null>(null);

  // Initialize animations for messages
  useEffect(() => {
    // Check if conversation changed
    const conversationChanged = previousConversationId.current !== conversationId;
    previousConversationId.current = conversationId;

    // Reset animations when conversation changes or initialize for new messages
    if (conversationChanged || fadeAnims.current.length !== messages.length) {
      fadeAnims.current = messages.map((_, index) => {
        const existingAnim = fadeAnims.current[index];
        if (conversationChanged) {
          // Reset existing animations for conversation change
          return new Animated.Value(0);
        }
        // Keep existing animation or create new one for new messages
        return existingAnim || new Animated.Value(0);
      });

      translateAnims.current = messages.map((_, index) => {
        const existingAnim = translateAnims.current[index];
        if (conversationChanged) {
          // Reset existing animations for conversation change with more dramatic offset for wave effect
          return new Animated.Value(-50);
        }
        // Keep existing animation or create new one for new messages
        return existingAnim || new Animated.Value(-50);
      });

      scaleAnims.current = messages.map((_, index) => {
        const existingAnim = scaleAnims.current[index];
        if (conversationChanged) {
          // Reset existing animations for conversation change with subtle scale effect
          return new Animated.Value(0.8);
        }
        // Keep existing animation or create new one for new messages
        return existingAnim || new Animated.Value(0.8);
      });

      // Create wave-like fade-in animations with slower, smoother timing
      const animations = messages.map((_, index) => {
        return Animated.parallel([
          // Slower, smoother fade-in with easing
          Animated.timing(fadeAnims.current[index], {
            toValue: 1,
            duration: 800, // Much longer duration for smoother fade
            easing: Easing.out(Easing.cubic), // Smooth easing for wave effect
            useNativeDriver: true,
          }),
          // Gentler slide-in animation with easing
          Animated.timing(translateAnims.current[index], {
            toValue: 0,
            duration: 700,
            easing: Easing.out(Easing.back(1.2)), // Subtle bounce for wave effect
            useNativeDriver: true,
          }),
          // Subtle scale animation for enhanced wave effect
          Animated.timing(scaleAnims.current[index], {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]);
      });

      // Create wave effect with longer, more dramatic stagger
      const staggeredAnimations = animations.map((animation, index) => {
        // Much longer delays for pronounced wave effect with initial delay
        const baseDelay = conversationChanged ? 200 : 100; // Initial delay before wave starts
        const staggerDelay = conversationChanged ? index * 300 : index * 200; // 300ms between each message
        const totalDelay = baseDelay + staggerDelay;
        
        return Animated.sequence([
          Animated.delay(totalDelay),
          animation,
        ]);
      });

      // Run all animations in parallel (but each with its own delay)
      Animated.parallel(staggeredAnimations).start();
    }
  }, [messages, conversationId]);

  const renderAnimatedMessage = (message: Message, index: number) => {
    const fadeAnim = fadeAnims.current[index] || new Animated.Value(1);
    const translateAnim = translateAnims.current[index] || new Animated.Value(0);
    const scaleAnim = scaleAnims.current[index] || new Animated.Value(1);

    return (
      <Animated.View
        key={message.id}
        style={[
          styles.messageContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: translateAnim },
              { scale: scaleAnim }
            ],
          },
        ]}
      >
        <MessageWithWidgets message={message} />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {messages.map(renderAnimatedMessage)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageContainer: {
    // No additional styling needed, just a wrapper for animation
  },
});