import { Colors } from '@/constants/theme';
import { useChatContext } from '@/contexts/ChatContext';
import { useAuth } from '@/hooks/useAuth';
import { Conversation } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { 
    conversations, 
    loading, 
    createNewConversation, 
    selectConversation,
    loadConversations,
    deleteMultipleConversations
  } = useChatContext();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);

  useEffect(() => {
    loadConversations();
  }, []);

  // Reload conversations when drawer is opened
  useEffect(() => {
    const unsubscribe = props.navigation?.addListener('drawerOpen', () => {
      loadConversations();
    });
    return unsubscribe;
  }, [props.navigation]);

  const handleNewChat = async () => {
    try {
      await createNewConversation();
      props.navigation?.closeDrawer();
    } catch (error) {
      console.error('Error starting new chat:', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            await signOut();
          }
        },
      ]
    );
  };

  const handleConversationSelect = (conversation: Conversation) => {
    if (selectionMode) {
      toggleConversationSelection(conversation.id);
    } else {
      selectConversation(conversation);
      props.navigation?.closeDrawer();
    }
  };

  const handleConversationLongPress = (conversation: Conversation) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedConversations([conversation.id]);
    }
  };

  const toggleConversationSelection = (conversationId: string) => {
    setSelectedConversations(prev => 
      prev.includes(conversationId)
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleBulkDelete = () => {
    if (selectedConversations.length === 0) return;

    Alert.alert(
      'Delete Chats',
      `Are you sure you want to delete ${selectedConversations.length} chat${selectedConversations.length > 1 ? 's' : ''}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMultipleConversations(selectedConversations);
            setSelectionMode(false);
            setSelectedConversations([]);
          },
        },
      ]
    );
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedConversations([]);
  };

  const handleSelectAll = () => {
    if (selectedConversations.length === conversations.length) {
      setSelectedConversations([]);
    } else {
      setSelectedConversations(conversations.map(c => c.id));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.drawerContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ChatGPT</Text>
        </View>

        {/* New Chat Button */}
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <View style={styles.newChatIcon}>
            <Text style={styles.iconText}>+</Text>
          </View>
          <Text style={styles.newChatText}>New Chat</Text>
        </TouchableOpacity>

        {/* Conversations List */}
        <ScrollView style={styles.historyContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Chats</Text>
            {selectionMode && (
              <View style={styles.selectionControls}>
                <TouchableOpacity
                  style={styles.selectionButton}
                  onPress={handleSelectAll}
                >
                  <Text style={styles.selectionButtonText}>
                    {selectedConversations.length === conversations.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectionButton}
                  onPress={handleCancelSelection}
                >
                  <Text style={styles.selectionButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {selectionMode && selectedConversations.length > 0 && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleBulkDelete}
            >
              <Ionicons name="trash" size={16} color="#fff" />
              <Text style={styles.deleteButtonText}>
                Delete {selectedConversations.length} chat{selectedConversations.length > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}

          {loading ? (
            <Text style={styles.loadingText}>Loading conversations...</Text>
          ) : conversations.length === 0 ? (
            <Text style={styles.emptyText}>No conversations yet</Text>
          ) : (
            conversations.map((conversation) => (
              <TouchableOpacity
                key={conversation.id}
                style={[
                  styles.historyItem,
                  selectedConversations.includes(conversation.id) && styles.historyItemSelected
                ]}
                onPress={() => handleConversationSelect(conversation)}
                onLongPress={() => handleConversationLongPress(conversation)}
              >
                <View style={styles.historyContent}>
                  {selectionMode && (
                    <View style={styles.selectionIndicator}>
                      <Ionicons 
                        name={selectedConversations.includes(conversation.id) ? "checkmark-circle" : "ellipse-outline"} 
                        size={20} 
                        color={selectedConversations.includes(conversation.id) ? Colors.dark.tint : Colors.dark.icon} 
                      />
                    </View>
                  )}
                  <View style={styles.historyTextContent}>
                    <Text style={styles.historyTitle} numberOfLines={1}>
                      {conversation.title}
                    </Text>
                    <Text style={styles.historyTimestamp}>
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* User Section */}
        <TouchableOpacity 
          style={styles.userSection}
          onPress={() => setShowUserMenu(!showUserMenu)}
        >
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.user_metadata?.full_name || 'User'}
              </Text>
              <Text style={styles.userEmail}>
                {user?.email || 'user@example.com'}
              </Text>
            </View>
          </View>
          <Text style={[styles.dropdownArrow, showUserMenu && styles.dropdownArrowUp]}>
            ▼
          </Text>
        </TouchableOpacity>

        {/* User Menu Options */}
        {showUserMenu && (
          <View style={styles.userMenu}>
            <TouchableOpacity 
              style={styles.userMenuItem}
              onPress={() => {
                setShowUserMenu(false);
                router.push('/settings');
                props.navigation?.closeDrawer();
              }}
            >
              <View style={styles.userMenuIcon}>
                <Text style={styles.iconText}>⚙</Text>
              </View>
              <Text style={styles.userMenuText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.userMenuItem}
              onPress={() => {
                setShowUserMenu(false);
                router.push('/widget-test');
                props.navigation?.closeDrawer();
              }}
            >
              <View style={styles.userMenuIcon}>
                <Text style={styles.iconText}>🔧</Text>
              </View>
              <Text style={styles.userMenuText}>Widget Test</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.userMenuItem} onPress={handleSignOut}>
              <View style={styles.userMenuIcon}>
                <Text style={styles.iconText}>→</Text>
              </View>
              <Text style={styles.userMenuText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  drawerContent: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.dark.chatInputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
  },
  newChatIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  newChatText: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '500',
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'column',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.icon,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  selectionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.dark.chatInputBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
  },
  selectionButtonText: {
    fontSize: 12,
    color: Colors.dark.text,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.dark.icon,
    textAlign: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.dark.icon,
    textAlign: 'center',
    padding: 16,
  },
  historyItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  historyItemSelected: {
    backgroundColor: Colors.dark.messageUser,
    borderWidth: 1,
    borderColor: Colors.dark.tint,
  },
  historyContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionIndicator: {
    marginRight: 12,
  },
  historyTextContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  historyTimestamp: {
    fontSize: 12,
    color: Colors.dark.icon,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 12,
    color: Colors.dark.icon,
  },
  dropdownArrow: {
    fontSize: 10,
    color: Colors.dark.icon,
    marginLeft: 8,
    transform: [{ rotate: '0deg' }],
  },
  dropdownArrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  userMenu: {
    backgroundColor: Colors.dark.chatInputBackground,
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  userMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  userMenuIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.icon,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userMenuText: {
    fontSize: 14,
    color: Colors.dark.text,
  },
});
