import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/components/AuthProvider';
import CustomDrawerContent from '@/components/custom-drawer';
import { ChatProvider } from '@/contexts/ChatContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TextToSpeechService } from '@/lib/textToSpeechService';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Initialize TextToSpeech service
    TextToSpeechService.initialize();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={DarkTheme}>
          <AuthProvider>
            <ChatProvider>
              <Drawer
              drawerContent={CustomDrawerContent}
              screenOptions={{
                headerShown: false,
                drawerStyle: {
                  backgroundColor: '#1a1a1a',
                  width: 280,
                },
                drawerActiveTintColor: '#764ba2',
                drawerInactiveTintColor: '#a0a0a0',
              }}
            >
              <Drawer.Screen
                name="index"
                options={{
                  title: 'Chat',
                }}
              />
              <Drawer.Screen
                name="settings"
                options={{
                  title: 'Settings',
                }}
              />
              <Drawer.Screen
                name="widget-test"
                options={{
                  title: 'Widget Test',
                }}
              />
            </Drawer>
            </ChatProvider>
          </AuthProvider>
          <StatusBar style="light" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
