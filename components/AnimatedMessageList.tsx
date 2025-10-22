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
  const fadeAnims = useRef<Map<string, Animated.Value>>(new Map());
  const previousMessageCount = useRef(0);
  const previousConversationId = useRef<string | null>(null);

  useEffect(() => {
    const conversationChanged = previousConversationId.current !== conversationId;
    previousConversationId.current = conversationId;

    // If conversation changed, reset all animations
    if (conversationChanged) {
      fadeAnims.current.clear();
      previousMessageCount.current = 0;
    }

    // Only animate new messages (not existing ones)
    const newMessageCount = messages.length;
    const previousCount = previousMessageCount.current;

    if (newMessageCount > previousCount) {
      // Get the new messages (only the ones added since last render)
      const newMessages = messages.slice(previousCount);
      
      newMessages.forEach((message, index) => {
        if (!fadeAnims.current.has(message.id)) {
          const fadeAnim = new Animated.Value(0);
          fadeAnims.current.set(message.id, fadeAnim);
          
          // Animate the new message with a slight delay for smoothness
          const delay = index * 150; // Stagger new messages by 150ms
          
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
      });
    }

    previousMessageCount.current = newMessageCount;
  }, [messages, conversationId]);

  const renderAnimatedMessage = (message: Message, index: number) => {
    // Get or create fade animation for this message
    let fadeAnim = fadeAnims.current.get(message.id);
    if (!fadeAnim) {
      // For existing messages (when component first mounts), start at full opacity
      fadeAnim = new Animated.Value(1);
      fadeAnims.current.set(message.id, fadeAnim);
    }

    return (
      <Animated.View
        key={message.id}
        style={[
          styles.messageContainer,
          {
            opacity: fadeAnim,
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