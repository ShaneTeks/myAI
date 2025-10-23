import AnimatedMessageList from '@/components/AnimatedMessageList';
import LoadingDots from '@/components/LoadingDots';
import MinimalTextInput from '@/components/MinimalTextInput';
import { VoiceSessionModal } from '@/components/VoiceSessionModal';
import { Colors } from '@/constants/theme';
import { useChatContext } from '@/contexts/ChatContext';
import type { ConversationContext, VoiceTranscript } from '@/lib/elevenLabsService';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const [inputText, setInputText] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceContext, setVoiceContext] = useState<ConversationContext | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation();
  
  const {
    messages,
    currentConversation,
    conversations,
    loading,
    sending,
    switchingConversation,
    sendMessage,
    createNewConversation,
    deleteConversation,
    updateConversationTitle,
    // Voice session functionality
    voiceSession,
    isVoiceSupported,
    voiceSessionLoading,
    startVoiceSession,
    endVoiceSession,
    syncVoiceTranscript,
    getVoiceSessionContext
  } = useChatContext();

  // Don't auto-create conversations - let user choose when to start a new chat

  useEffect(() => {
    // Scroll to bottom when new messages are added
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputText.trim() === '' || sending) return;

    const userMessage = inputText;
    setInputText('');
    
    // If no current conversation, create one first
    if (!currentConversation) {
      const newConv = await createNewConversation();
      if (!newConv) {
        console.error('Failed to create new conversation');
        return;
      }
    }
    
    await sendMessage(userMessage);
  };

  const handlePlusPress = () => {
    // TODO: Implement plus button functionality
    console.log('Plus button pressed');
  };

  const handleMicPress = () => {
    // TODO: Implement microphone functionality
    console.log('Microphone button pressed');
  };

  const handleAudioPress = () => {
    // TODO: Implement audio functionality
    console.log('Audio button pressed');
  };

  const handleVoicePress = async () => {
    if (!isVoiceSupported) {
      // This should be handled by VoiceButton component now
      return;
    }

    if (voiceSessionLoading) {
      return; // Prevent multiple simultaneous attempts
    }

    try {
      // If no current conversation, create one first
      if (!currentConversation) {
        const newConv = await createNewConversation();
        if (!newConv) {
          Alert.alert('Error', 'Failed to create conversation for voice chat');
          return;
        }
      }

      // Get conversation context for the voice session
      const context = await getVoiceSessionContext();
      setVoiceContext(context);
      
      // Start the voice session
      await startVoiceSession();
      
      // Show the voice modal
      setShowVoiceModal(true);
    } catch (error) {
      console.error('Failed to start voice session:', error);
      
      // Provide specific error messages based on error type
      let errorTitle = 'Voice Chat Error';
      let errorMessage = 'Failed to start voice session. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('connection')) {
          errorTitle = 'Connection Error';
          errorMessage = 'Unable to connect to voice services. Please check your internet connection and try again.';
        } else if (error.message.includes('configuration')) {
          errorTitle = 'Configuration Error';
          errorMessage = 'Voice chat is not properly configured. Please restart the app or contact support.';
        } else if (error.message.includes('permission')) {
          errorTitle = 'Permission Error';
          errorMessage = 'Voice chat requires microphone permissions. Please check your app settings.';
        }
      }
      
      Alert.alert(errorTitle, errorMessage, [
        { text: 'Retry', onPress: handleVoicePress },
        { text: 'Cancel', style: 'cancel' }
      ]);
    }
  };

  const handleVoiceModalClose = async () => {
    setShowVoiceModal(false);
    
    // End the voice session if it's still active
    if (voiceSession) {
      try {
        await endVoiceSession();
      } catch (error) {
        console.error('Failed to end voice session:', error);
        // Don't show error alert here as modal is closing
        // Just log the error for debugging
      }
    }
    
    setVoiceContext(null);
  };

  const handleVoiceSessionEnd = async (transcript: VoiceTranscript) => {
    try {
      // Sync the transcript to the database
      await syncVoiceTranscript(transcript);
      
      // Close the modal
      setShowVoiceModal(false);
      setVoiceContext(null);
    } catch (error) {
      console.error('Failed to sync voice transcript:', error);
      
      // Close modal first, then show error
      setShowVoiceModal(false);
      setVoiceContext(null);
      
      Alert.alert(
        'Sync Error',
        'Your voice conversation was recorded but failed to save. The conversation may not appear in your history.',
        [
          { text: 'Retry Sync', onPress: async () => {
            try {
              await syncVoiceTranscript(transcript);
            } catch (retryError) {
              console.error('Retry sync failed:', retryError);
              Alert.alert('Sync Failed', 'Unable to save voice conversation. Please contact support if this continues.');
            }
          }},
          { text: 'Continue', style: 'cancel' }
        ]
      );
    }
  };

  const handleNewChat = async () => {
    await createNewConversation();
  };

  const handleRename = () => {
    setRenameText(currentConversation?.title || '');
    setShowOptionsMenu(false);
    setShowRenameModal(true);
  };

  const handleRenameConfirm = async () => {
    if (currentConversation && renameText.trim()) {
      await updateConversationTitle(currentConversation.id, renameText.trim());
      setShowRenameModal(false);
      setRenameText('');
    }
  };

  const handleDelete = () => {
    setShowOptionsMenu(false);
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (currentConversation) {
              await deleteConversation(currentConversation.id);
            }
          },
        },
      ]
    );
  };

  // Remove the renderMessage function as we'll use AnimatedMessageList

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {currentConversation?.title || 'AI Assistant'}
          </Text>
          <Text style={styles.headerSubtitle}>AI Assistant</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handleNewChat}
          >
            <Ionicons name="add" size={24} color={Colors.dark.icon} />
          </TouchableOpacity>
          {currentConversation && (
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => setShowOptionsMenu(true)}
            >
              <Ionicons name="ellipsis-vertical" size={24} color={Colors.dark.icon} />
            </TouchableOpacity>
          )}
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
          {!currentConversation ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>Welcome to AI Chat</Text>
              <Text style={styles.emptyStateText}>Start typing below to begin a new conversation</Text>
            </View>
          ) : (
            <>
              {switchingConversation && messages.length === 0 ? (
                <View style={styles.switchingContainer}>
                  <LoadingDots />
                </View>
              ) : (
                <AnimatedMessageList 
                  messages={messages} 
                  conversationId={currentConversation?.id || null}
                  switchingConversation={switchingConversation}
                />
              )}
              {sending && (
                <View style={styles.aiMessageWrapper}>
                  <View style={styles.aiAvatar}>
                    <Text style={styles.avatarText}>AI</Text>
                  </View>
                  <Text style={styles.thinkingText}>Thinking...</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>

      {/* Input Area */}
      <View style={styles.inputArea}>
        <MinimalTextInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSendMessage}
          onPlusPress={handlePlusPress}
          onMicPress={handleMicPress}
          onAudioPress={handleAudioPress}
          onVoicePress={handleVoicePress}
          disabled={sending || voiceSessionLoading}
          isVoiceSupported={isVoiceSupported}
          placeholder={!currentConversation ? "Start typing to begin a new chat..." : "Message AI..."}
        />
      </View>

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={styles.optionsMenu}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleRename}
            >
              <Ionicons name="pencil" size={20} color={Colors.dark.text} />
              <Text style={styles.optionText}>Rename</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={20} color="#ff4444" />
              <Text style={[styles.optionText, { color: '#ff4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.renameModal}>
            <Text style={styles.renameTitle}>Rename Chat</Text>
            <TextInput
              style={styles.renameInput}
              value={renameText}
              onChangeText={setRenameText}
              placeholder="Enter chat name"
              autoFocus={true}
              selectTextOnFocus={true}
            />
            <View style={styles.renameButtons}>
              <TouchableOpacity
                style={[styles.renameButton, styles.cancelButton]}
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.renameButton, styles.confirmButton]}
                onPress={handleRenameConfirm}
              >
                <Text style={styles.confirmButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Voice Session Modal */}
      {voiceContext && (
        <VoiceSessionModal
          visible={showVoiceModal}
          onClose={handleVoiceModalClose}
          conversationContext={voiceContext}
          onSessionEnd={handleVoiceSessionEnd}
        />
      )}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  inputArea: {
    backgroundColor: Colors.dark.background,
    paddingBottom: 8, // Add some padding for better spacing
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
    backgroundColor: Colors.dark.background,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 20,
    color: Colors.dark.text,
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.dark.icon,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: 8,
    marginLeft: 4,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.dark.icon,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },

  messageWrapper: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  aiMessageWrapper: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userMessage: {
    backgroundColor: Colors.dark.messageUser,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
  },
  aiMessage: {
    backgroundColor: Colors.dark.messageAI,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
  },
  userMessageText: {
    color: Colors.dark.text,
    fontSize: 16,
    lineHeight: 20,
  },
  messageText: {
    color: Colors.dark.text,
    fontSize: 16,
    lineHeight: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsMenu: {
    backgroundColor: Colors.dark.chatInputBackground,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 150,
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'absolute',
    top: 100,
    right: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
    color: Colors.dark.text,
    marginLeft: 12,
  },
  renameModal: {
    backgroundColor: Colors.dark.chatInputBackground,
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  renameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  renameInput: {
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 20,
  },
  renameButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  renameButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.dark.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
  },
  confirmButton: {
    backgroundColor: Colors.dark.tint,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  thinkingText: {
    color: Colors.dark.icon,
    fontSize: 16,
    fontStyle: 'italic',
    marginLeft: 4,
    marginTop: 8,
  },
});