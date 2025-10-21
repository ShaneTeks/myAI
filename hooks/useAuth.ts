import { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { AuthService } from '../lib/authService'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error checking auth state:', error)
      } finally {
        setLoading(false)
        setInitializing(false)
      }
    }

    checkUser()

    // Listen for auth state changes
    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
      setInitializing(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const result = await AuthService.signIn(email, password)
    setLoading(false)
    return result
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    const result = await AuthService.signUp(email, password)
    setLoading(false)
    return result
  }

  const signOut = async () => {
    setLoading(true)
    const result = await AuthService.signOut()
    setUser(null)
    setLoading(false)
    return result
  }

  const resetPassword = async (email: string) => {
    setLoading(true)
    const result = await AuthService.resetPassword(email)
    setLoading(false)
    return result
  }

  return {
    user,
    loading,
    initializing,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!user
  }
}