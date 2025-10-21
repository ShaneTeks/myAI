import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for our database schema
export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface Message {
  id: string;
  content: string;
  is_user: boolean;
  created_at: string;
}

// Storage keys
const CONVERSATIONS_KEY = 'chatapp_conversations';
const CURRENT_CONVERSATION_KEY = 'chatapp_current_conversation';

// Initialize storage (no setup needed for AsyncStorage)
export const initializeDatabase = async () => {
  console.log('AsyncStorage initialized');
};

// Database operations using AsyncStorage
export const createConversation = async (): Promise<string> => {
  try {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const conversations = await getConversations();
    const newConversation: Conversation = {
      id: conversationId,
      title: 'New Chat',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: []
    };

    conversations.unshift(newConversation);
    await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));

    return conversationId;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const saveMessage = async (conversationId: string, content: string, isUser: boolean): Promise<string> => {
  try {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const conversations = await getConversations();
    const conversationIndex = conversations.findIndex(conv => conv.id === conversationId);

    if (conversationIndex === -1) {
      throw new Error('Conversation not found');
    }

    const newMessage: Message = {
      id: messageId,
      content,
      is_user: isUser,
      created_at: new Date().toISOString()
    };

    conversations[conversationIndex].messages.push(newMessage);
    conversations[conversationIndex].updated_at = new Date().toISOString();

    await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));

    return messageId;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

export const getConversations = async (): Promise<Conversation[]> => {
  try {
    const conversationsData = await AsyncStorage.getItem(CONVERSATIONS_KEY);
    if (!conversationsData) {
      return [];
    }
    return JSON.parse(conversationsData);
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
};

export const getMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const conversations = await getConversations();
    const conversation = conversations.find(conv => conv.id === conversationId);
    return conversation ? conversation.messages : [];
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

export const updateConversationTimestamp = async (conversationId: string): Promise<void> => {
  try {
    const conversations = await getConversations();
    const conversationIndex = conversations.findIndex(conv => conv.id === conversationId);

    if (conversationIndex !== -1) {
      conversations[conversationIndex].updated_at = new Date().toISOString();
      await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    }
  } catch (error) {
    console.error('Error updating conversation timestamp:', error);
  }
};

export const saveCurrentConversation = async (conversationId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(CURRENT_CONVERSATION_KEY, conversationId);
  } catch (error) {
    console.error('Error saving current conversation:', error);
  }
};

export const getCurrentConversation = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(CURRENT_CONVERSATION_KEY);
  } catch (error) {
    console.error('Error getting current conversation:', error);
    return null;
  }
};
