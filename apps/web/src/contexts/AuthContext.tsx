'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import Cookies from 'js-cookie';

interface UserProfile {
  id: string;
  email?: string;
  google_id?: string;
  is_anonymous: boolean;
  credits: number;
  images_created: number;
  plan: 'free' | 'pro' | 'unlimited';
  polar_customer_id?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (returnTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  upgradeFromAnonymous: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  hasCredits: boolean;
  canCreateImage: boolean;
  needsUpgrade: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Create or get anonymous user
  const createAnonymousUser = async (): Promise<string> => {
    const existingAnonId = Cookies.get('anon_user_id');
    
    if (existingAnonId) {
      // Check if this anonymous user still exists in database
      const { data: existingUser } = await supabase
        .from('roast_me_ai_users')
        .select('*')
        .eq('id', existingAnonId)
        .eq('is_anonymous', true)
        .single();
      
      if (existingUser) {
        return existingAnonId;
      }
    }

    // Create new anonymous user
    const anonId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const { error } = await supabase
      .from('roast_me_ai_users')
      .insert({
        id: anonId,
        is_anonymous: true,
        credits: 3, // Free tier gets 3 credits
        images_created: 0,
        plan: 'free'
      });

    if (error) {
      console.error('Error creating anonymous user:', error);
      throw error;
    }

    // Store in cookie for 30 days
    Cookies.set('anon_user_id', anonId, { expires: 30 });
    return anonId;
  };

  // Fetch user profile from our custom table
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('roast_me_ai_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data as UserProfile;
  };

  // Initialize user on mount
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // Authenticated user
          setUser(authUser);
          const profile = await fetchUserProfile(authUser.id);
          
          if (!profile) {
            // Create profile for authenticated user if it doesn't exist
            const { error } = await supabase
              .from('roast_me_ai_users')
              .insert({
                id: authUser.id,
                email: authUser.email,
                google_id: authUser.user_metadata?.sub,
                is_anonymous: false,
                credits: 10, // Authenticated users get more credits
                images_created: 0,
                plan: 'free'
              });

            if (!error) {
              const newProfile = await fetchUserProfile(authUser.id);
              setUserProfile(newProfile);
            }
          } else {
            setUserProfile(profile);
          }
        } else {
          // No authenticated user, create/get anonymous user
          const anonId = await createAnonymousUser();
          const anonProfile = await fetchUserProfile(anonId);
          setUserProfile(anonProfile);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        let profile = await fetchUserProfile(session.user.id);
        
        // If profile doesn't exist, create it
        if (!profile) {
          const { error } = await supabase
            .from('roast_me_ai_users')
            .insert({
              id: session.user.id,
              email: session.user.email,
              google_id: session.user.user_metadata?.sub,
              is_anonymous: false,
              credits: 10, // Authenticated users get more credits
              images_created: 0,
              plan: 'free'
            });

          if (!error) {
            profile = await fetchUserProfile(session.user.id);
          }
        }
        
        setUserProfile(profile);
        // Clear anonymous cookie when user signs in
        Cookies.remove('anon_user_id');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        // Create new anonymous user
        const anonId = await createAnonymousUser();
        const anonProfile = await fetchUserProfile(anonId);
        setUserProfile(anonProfile);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async (returnTo?: string) => {
    const callbackUrl = returnTo 
      ? `${window.location.origin}/auth/callback?returnTo=${returnTo}`
      : `${window.location.origin}/auth/callback`;
      
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl
      }
    });
    
    if (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const upgradeFromAnonymous = async () => {
    if (!userProfile?.is_anonymous) return;
    
    try {
      // Use linkIdentity to connect Google OAuth to current anonymous session
      const { data, error } = await supabase.auth.linkIdentity({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('Error linking identity:', error);
        // Fallback to regular sign-in if linking fails
        await signInWithGoogle();
        return;
      }
      
      // linkIdentity will redirect to Google OAuth
      // The callback will handle the data migration
    } catch (error) {
      console.error('Error in upgradeFromAnonymous:', error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
    } else if (userProfile?.is_anonymous) {
      const anonId = Cookies.get('anon_user_id');
      if (anonId) {
        const profile = await fetchUserProfile(anonId);
        setUserProfile(profile);
      }
    }
  };

  // Helper computed values
  const hasCredits = userProfile ? userProfile.credits > 0 : false;
  const canCreateImage = userProfile ? (userProfile.plan !== 'free' || userProfile.credits > 0) : false;
  const needsUpgrade = userProfile ? (userProfile.is_anonymous && userProfile.images_created >= 3) : false;

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      signInWithGoogle,
      signOut,
      upgradeFromAnonymous,
      refreshUserProfile,
      hasCredits,
      canCreateImage,
      needsUpgrade
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};