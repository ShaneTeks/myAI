import { Colors } from '@/constants/theme';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { VoiceButton } from './VoiceButton';
import { VoiceSessionModal } from './VoiceSessionModal';
import type { ConversationContext, VoiceTranscript } from './types';

/**
 * Test component to demonstrate voice session components integration
 * This can be used for testing the voice session flow
 */
export function VoiceSessionTest() {
  const [modalVisible, setModalVisible] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<VoiceTranscript | null>(null);

  const mockConversationContext: ConversationContext = {
    recentMessages: [
      { id: '1', content: 'Hello, how are you?', role: 'user', timestamp: new Date() },
      { id: '2', content: 'I am doing well, thank you!', role: 'agent', timestamp: new Date() },
    ],
    userPreferences: { language: 'en', voiceEnabled: true },
    conversationSummary: 'Friendly greeting exchange',
    maxTokens: 4000,
  };

  const handleVoiceButtonPress = () => {
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  const handleSessionEnd = (transcript: VoiceTranscript) => {
    setLastTranscript(transcript);
    console.log('Voice session ended:', transcript);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Session Test</Text>
      
      <View style={styles.buttonContainer}>
        <VoiceButton onPress={handleVoiceButtonPress} />
        <Text style={styles.buttonLabel}>Tap to start voice session</Text>
      </View>

      {lastTranscript && (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptTitle}>Last Session:</Text>
          <Text style={styles.transcriptText}>
            Session ID: {lastTranscript.sessionId}
          </Text>
          <Text style={styles.transcriptText}>
            Messages: {lastTranscript.messages.length}
          </Text>
          <Text style={styles.transcriptText}>
            Summary: {lastTranscript.summary}
          </Text>
        </View>
      )}

      <VoiceSessionModal
        visible={modalVisible}
        onClose={handleModalClose}
        conversationContext={mockConversationContext}
        onSessionEnd={handleSessionEnd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  buttonLabel: {
    fontSize: 16,
    color: Colors.dark.text,
    marginLeft: 16,
  },
  transcriptContainer: {
    backgroundColor: Colors.dark.chatInputBackground,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
    width: '100%',
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 14,
    color: Colors.dark.icon,
    marginBottom: 4,
  },
});