import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
    },
    {
      id: '2',
      text: 'I\'d like to create a modern chat app with liquid glass UI. Can you help me with that?',
      isUser: true,
      timestamp: new Date(),
    },
    {
      id: '3',
      text: 'Absolutely! I\'d love to help you build a beautiful chat interface with glassmorphism effects, smooth animations, and modern design patterns.',
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const navigation = useNavigation();

  const colors = Colors.dark;

  useEffect(() => {
    // Scroll to bottom when new messages are added
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = () => {
    if (inputText.trim() === '') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'That\'s interesting! I\'m here to help you build amazing things. What specific aspect would you like to work on next?',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageBubble,
        message.isUser ? styles.messageBubbleUser : styles.messageBubbleAI,
      ]}
    >
      <ThemedText
        style={[
          styles.messageText,
          { color: message.isUser ? Colors.dark.buttonText : colors.text },
        ]}
      >
        {message.text}
      </ThemedText>
      <ThemedText
        style={[
          styles.messageTime,
          { color: message.isUser ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' },
        ]}
      >
        {message.timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[
          colors.gradientStart,
          colors.gradientEnd,
        ]}
        style={styles.gradientBackground}
      >
        {/* vW AI Badge */}
        <View style={styles.badgeContainer}>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={[styles.vwBadge, { backgroundColor: colors.glass }]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)']}
              style={styles.badgeShimmer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <ThemedText style={styles.badgeText}>vW AI</ThemedText>
          </View>
        </View>

        {/* Messages Area */}
        <View style={styles.messagesContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(renderMessage)}
            {isTyping && (
              <View style={[styles.messageBubble, styles.messageBubbleAI]}>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <View style={[styles.inputArea, { backgroundColor: colors.inputBackground }]}>
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor={colors.tabIconDefault}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { opacity: inputText.trim() === '' ? 0.5 : 1 },
              ]}
              onPress={sendMessage}
              disabled={inputText.trim() === ''}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={styles.sendButtonGradient}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  badgeContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 24,
    color: Colors.dark.iconText,
    fontWeight: 'bold',
  },
  vwBadge: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  badgeShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.buttonText,
    zIndex: 1,
  },
  header: {
    borderRadius: 20,
    margin: 16,
    marginBottom: 8,
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.dark.iconText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.buttonText,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 18,
  },
  messageBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  messageBubbleAI: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    padding: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 2,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  inputArea: {
    borderRadius: 25,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingTop: 8,
  },
  sendButton: {
    marginLeft: 8,
  },
  sendButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButtonText: {
    color: Colors.dark.buttonText,
    fontSize: 14,
    fontWeight: '600',
  },
});
