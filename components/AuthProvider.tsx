import React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { LoginScreen } from './LoginScreen'

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, initializing } = useAuth()

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
})