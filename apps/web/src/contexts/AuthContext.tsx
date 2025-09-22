'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { signInWithGoogle, signOut } from '@/app/actions/auth-actions'

interface CreditBalance {
  dailyAvailable: number
  dailyUsed: number
  purchasedCredits: number
  totalAvailable: number
  nextResetTime: Date
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: (returnTo?: string) => Promise<void>
  signOut: () => Promise<void>
  getCredits: () => Promise<number>
  getCreditBalance: () => Promise<CreditBalance | null>
  useCredits: (amount: number, reason: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper functions for anonymous credit tracking
const ANON_CREDITS_KEY = 'roastme_anon_credits'
const ANON_RESET_KEY = 'roastme_anon_reset'

function getAnonCreditsData() {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem(ANON_CREDITS_KEY)
  const resetTime = localStorage.getItem(ANON_RESET_KEY)
  const now = new Date()
  
  // Check if we need to reset (past midnight UTC)
  if (resetTime) {
    const storedReset = new Date(resetTime)
    if (now > storedReset) {
      // Reset for new day
      const nextMidnight = new Date(now)
      nextMidnight.setUTCHours(24, 0, 0, 0)
      localStorage.setItem(ANON_CREDITS_KEY, '0')
      localStorage.setItem(ANON_RESET_KEY, nextMidnight.toISOString())
      return { used: 0, resetTime: nextMidnight }
    }
  } else {
    // First time - set up reset time
    const nextMidnight = new Date(now)
    nextMidnight.setUTCHours(24, 0, 0, 0)
    localStorage.setItem(ANON_RESET_KEY, nextMidnight.toISOString())
  }
  
  const used = stored ? parseInt(stored, 10) : 0
  return {
    used,
    resetTime: resetTime ? new Date(resetTime) : new Date(now.getTime() + 24 * 60 * 60 * 1000)
  }
}

function useAnonCredits(amount: number): boolean {
  if (typeof window === 'undefined') return false
  
  const data = getAnonCreditsData()
  if (!data) return false
  
  const available = 3 - data.used
  if (available < amount) return false
  
  localStorage.setItem(ANON_CREDITS_KEY, String(data.used + amount))
  return true
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [anonCreditsUsed, setAnonCreditsUsed] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    // Initialize anonymous credits tracking
    if (typeof window !== 'undefined') {
      const data = getAnonCreditsData()
      if (data) {
        setAnonCreditsUsed(data.used)
      }
    }
    
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
    if (!user) {
      // Anonymous users get 3 daily credits
      const data = getAnonCreditsData()
      return data ? Math.max(0, 3 - data.used) : 3
    }

    try {
      // Use the new get_credit_balance function
      const { data, error } = await supabase
        .rpc('get_credit_balance', { p_user_id: user.id })
        .single()

      if (error) {
        console.error('Error fetching credits:', error)
        // Fallback to old method if function doesn't exist yet
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single()
        
        return profile?.credits || 0
      }

      return (data as any)?.total_available || 0
    } catch (error) {
      console.error('Error in getCredits:', error)
      return 0
    }
  }

  const getCreditBalance = async (): Promise<CreditBalance | null> => {
    if (!user) {
      // Anonymous users get 3 daily credits
      const data = getAnonCreditsData()
      const used = data?.used || 0
      const available = Math.max(0, 3 - used)
      
      return {
        dailyAvailable: available,
        dailyUsed: used,
        purchasedCredits: 0,
        totalAvailable: available,
        nextResetTime: data?.resetTime || new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    }

    try {
      const { data, error } = await supabase
        .rpc('get_credit_balance', { p_user_id: user.id })
        .single()

      if (error) {
        console.error('Error fetching credit balance:', error)
        return null
      }

      return {
        dailyAvailable: (data as any).daily_available || 0,
        dailyUsed: (data as any).daily_used || 0,
        purchasedCredits: (data as any).purchased_credits || 0,
        totalAvailable: (data as any).total_available || 0,
        nextResetTime: new Date((data as any).next_reset_time)
      }
    } catch (error) {
      console.error('Error in getCreditBalance:', error)
      return null
    }
  }

  const useCredits = async (amount: number, reason: string): Promise<boolean> => {
    if (!user) {
      // Handle anonymous user credits
      const success = useAnonCredits(amount)
      if (success) {
        // Update state to trigger re-renders
        const data = getAnonCreditsData()
        setAnonCreditsUsed(data?.used || 0)
      }
      return success
    }

    try {
      // Use the new use_credits database function
      const { data, error } = await supabase
        .rpc('use_credits', {
          p_user_id: user.id,
          p_amount: amount,
          p_reason: reason
        })
        .single()

      if (error) {
        console.error('Error using credits (RPC):', error)
        
        // Fallback to old method if function doesn't exist yet
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
            payment_status: 'completed'
          })

        if (logError) {
          console.error('Error logging transaction:', logError)
        }

        return true
      }

      // Check if the operation was successful
      if (!(data as any)?.success) {
        console.log('Credit usage failed:', (data as any)?.error_message || 'Insufficient credits')
        return false
      }

      console.log('Credits used successfully:', {
        dailyUsed: (data as any).daily_used,
        purchasedUsed: (data as any).purchased_used,
        dailyRemaining: (data as any).daily_remaining,
        purchasedRemaining: (data as any).purchased_remaining
      })

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
    getCreditBalance,
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