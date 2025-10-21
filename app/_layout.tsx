import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/components/AuthProvider';
import CustomDrawerContent from '@/components/custom-drawer';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={DarkTheme}>
        <AuthProvider>
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
          </Drawer>
        </AuthProvider>
        <StatusBar style="light" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
