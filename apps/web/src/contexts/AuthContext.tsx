'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { signInWithGoogle, signOut } from '@/app/actions/auth-actions'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: (returnTo?: string) => Promise<void>
  signOut: () => Promise<void>
  getCredits: () => Promise<number>
  useCredits: (amount: number, reason: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const getCredits = async (): Promise<number> => {
    if (!user) return 0

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching credits:', error)
        return 0
      }

      return data?.credits || 0
    } catch (error) {
      console.error('Error in getCredits:', error)
      return 0
    }
  }

  const useCredits = async (amount: number, reason: string): Promise<boolean> => {
    if (!user) return false

    try {
      // Start transaction
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

      if (fetchError || !profile) {
        console.error('Error fetching profile:', fetchError)
        return false
      }

      const currentCredits = profile.credits || 0
      
      if (currentCredits < amount) {
        console.log('Insufficient credits')
        return false
      }

      // Deduct credits
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: currentCredits - amount })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating credits:', updateError)
        return false
      }

      // Log transaction
      const { error: logError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: -amount,
          type: 'usage',
          description: reason,
          balance_after: currentCredits - amount
        })

      if (logError) {
        console.error('Error logging transaction:', logError)
      }

      return true
    } catch (error) {
      console.error('Error in useCredits:', error)
      return false
    }
  }

  const contextValue: AuthContextType = {
    user,
    loading,
    signInWithGoogle: async (returnTo?: string) => {
      // Get anonymous session ID from localStorage
      const anonSessionId = typeof window !== 'undefined' ? localStorage.getItem('anonSessionId') : null
      await signInWithGoogle(returnTo, anonSessionId || undefined)
    },
    signOut: async () => {
      await signOut()
    },
    getCredits,
    useCredits
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}