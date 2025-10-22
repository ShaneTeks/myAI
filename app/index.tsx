import AnimatedMessageList from '@/components/AnimatedMessageList';
import LoadingDots from '@/components/LoadingDots';
import MinimalTextInput from '@/components/MinimalTextInput';
import { Colors } from '@/constants/theme';
import { useChatContext } from '@/contexts/ChatContext';
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
    updateConversationTitle
  } = useChatContext();

  // Create initial conversation if none exists
  useEffect(() => {
    const initConversation = async () => {
      if (!currentConversation && !loading && conversations.length === 0) {
        await createNewConversation();
      }
    };
    initConversation();
  }, [currentConversation, loading, conversations]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputText.trim() === '' || sending) return;

    const userMessage = inputText;
    setInputText('');
    
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
    <SafeAreaView style={styles.container} edges={['top']}>
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
            {currentConversation?.title || 'New Chat'}
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
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setShowOptionsMenu(true)}
          >
            <Ionicons name="ellipsis-vertical" size={24} color={Colors.dark.icon} />
          </TouchableOpacity>
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
          {!currentConversation && conversations.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>Welcome to AI Chat</Text>
              <Text style={styles.emptyStateText}>Start a new conversation to begin chatting with AI</Text>
              <TouchableOpacity style={styles.startChatButton} onPress={handleNewChat}>
                <Text style={styles.startChatButtonText}>Start New Chat</Text>
              </TouchableOpacity>
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
                  <View style={[styles.aiMessage, styles.typingMessage]}>
                    <View style={styles.typingIndicator}>
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                    </View>
                  </View>
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
          disabled={sending}
          placeholder="Message AI..."
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
  startChatButton: {
    backgroundColor: Colors.dark.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  typingMessage: {
    paddingVertical: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.icon,
    marginHorizontal: 2,
    opacity: 0.5,
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
});