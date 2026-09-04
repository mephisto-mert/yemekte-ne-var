import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { UserProfile, SubscriptionTier } from '../types';

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isPro: boolean;
  isConfigured: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  isProfileModalOpen: boolean;
  isSubscriptionModalOpen: boolean;
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  openSubscriptionModal: () => void;
  closeSubscriptionModal: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
  upgradeToPro: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_KEY = 'cookly_demo_user';
const DEMO_PROFILE_KEY = 'cookly_demo_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const openAuthModal = useCallback((mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);
  const openProfileModal = useCallback(() => setIsProfileModalOpen(true), []);
  const closeProfileModal = useCallback(() => setIsProfileModalOpen(false), []);
  const openSubscriptionModal = useCallback(() => setIsSubscriptionModalOpen(true), []);
  const closeSubscriptionModal = useCallback(() => setIsSubscriptionModalOpen(false), []);

  const loadProfile = useCallback(async (userId: string, userEmail?: string, rawMeta?: any) => {
    if (!isSupabaseConfigured || !supabase) {
      const savedProfile = localStorage.getItem(DEMO_PROFILE_KEY);
      if (savedProfile) {
        try {
          setProfile(JSON.parse(savedProfile));
          return;
        } catch {
          // fall through
        }
      }
      const defaultProfile: UserProfile = {
        id: userId,
        email: userEmail || 'demo@cookly.app',
        displayName: rawMeta?.display_name || userEmail?.split('@')[0] || 'Aşçı Şef',
        dietaryPreference: 'all',
        allergens: [],
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString(),
      };
      setProfile(defaultProfile);
      localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(defaultProfile));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        // Fallback default profile
        const newProfile: UserProfile = {
          id: userId,
          email: userEmail || '',
          displayName: rawMeta?.display_name || userEmail?.split('@')[0] || 'Kullanıcı',
          avatarUrl: rawMeta?.avatar_url,
          dietaryPreference: 'all',
          allergens: [],
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
          createdAt: new Date().toISOString(),
        };
        setProfile(newProfile);
      } else {
        setProfile({
          id: data.id,
          email: data.email || userEmail || '',
          displayName: data.display_name || 'Kullanıcı',
          avatarUrl: data.avatar_url,
          dietaryPreference: data.dietary_preference || 'all',
          allergens: data.allergens || [],
          subscriptionTier: (data.subscription_tier as SubscriptionTier) || 'free',
          subscriptionStatus: data.subscription_status || 'active',
          createdAt: data.created_at,
        });
      }
    } catch (err) {
      console.warn('Profile fetch fallback:', err);
    }
  }, []);

  // Initialize Session
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            setUser({ id: session.user.id, email: session.user.email });
            await loadProfile(session.user.id, session.user.email, session.user.user_metadata);
          }
        } catch (e) {
          console.warn('Session init error:', e);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!isMounted) return;
          if (session?.user) {
            setUser({ id: session.user.id, email: session.user.email });
            await loadProfile(session.user.id, session.user.email, session.user.user_metadata);
          } else {
            setUser(null);
            setProfile(null);
          }
        });

        if (isMounted) setIsLoading(false);
        return () => subscription.unsubscribe();
      } else {
        // Demo / Guest mode fallback
        const savedDemo = localStorage.getItem(DEMO_USER_KEY);
        if (savedDemo && isMounted) {
          try {
            const parsedUser = JSON.parse(savedDemo);
            setUser(parsedUser);
            await loadProfile(parsedUser.id, parsedUser.email);
          } catch {
            localStorage.removeItem(DEMO_USER_KEY);
          }
        }
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();
    return () => {
      isMounted = false;
    };
  }, [loadProfile]);

  // Auth Operations
  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email });
        await loadProfile(data.user.id, data.user.email, data.user.user_metadata);
      }
      return { error: null };
    } else {
      // Local demo mode authentication
      const demoUser = { id: 'demo-' + Math.random().toString(36).substring(2, 9), email };
      setUser(demoUser);
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      await loadProfile(demoUser.id, demoUser.email);
      return { error: null };
    }
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string): Promise<{ error: string | null }> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });
      if (error) return { error: error.message };
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email });
        await loadProfile(data.user.id, data.user.email, { display_name: displayName });
      }
      return { error: null };
    } else {
      // Local demo mode sign up
      const demoUser = { id: 'demo-' + Math.random().toString(36).substring(2, 9), email };
      setUser(demoUser);
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      const newProfile: UserProfile = {
        id: demoUser.id,
        email,
        displayName: displayName || email.split('@')[0],
        dietaryPreference: 'all',
        allergens: [],
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString(),
      };
      setProfile(newProfile);
      localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(newProfile));
      return { error: null };
    }
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(DEMO_USER_KEY);
    localStorage.removeItem(DEMO_PROFILE_KEY);
    setUser(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<{ error: string | null }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { error: error.message };
      return { error: null };
    } else {
      return { error: null }; // Simulated success in demo
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Kullanıcı oturumu bulunamadı' };

    const updatedProfile: UserProfile = {
      ...(profile || {
        id: user.id,
        email: user.email || '',
        displayName: 'Kullanıcı',
        dietaryPreference: 'all',
        allergens: [],
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString(),
      }),
      ...updates,
    };

    setProfile(updatedProfile);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: updatedProfile.displayName,
          avatar_url: updatedProfile.avatarUrl,
          dietary_preference: updatedProfile.dietaryPreference,
          allergens: updatedProfile.allergens,
          subscription_tier: updatedProfile.subscriptionTier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) return { error: error.message };
    } else {
      localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(updatedProfile));
    }

    return { error: null };
  }, [user, profile]);

  const upgradeToPro = useCallback(() => {
    if (profile) {
      const proProfile: UserProfile = {
        ...profile,
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
      };
      setProfile(proProfile);
      if (!isSupabaseConfigured) {
        localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(proProfile));
      }
    }
  }, [profile]);

  const isPro = useMemo(() => {
    return profile?.subscriptionTier === 'pro' || profile?.subscriptionTier === 'enterprise';
  }, [profile]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    profile,
    isLoading,
    isPro,
    isConfigured: isSupabaseConfigured,
    isAuthModalOpen,
    authModalMode,
    isProfileModalOpen,
    isSubscriptionModalOpen,
    openAuthModal,
    closeAuthModal,
    openProfileModal,
    closeProfileModal,
    openSubscriptionModal,
    closeSubscriptionModal,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    upgradeToPro,
  }), [
    user,
    profile,
    isLoading,
    isPro,
    isAuthModalOpen,
    authModalMode,
    isProfileModalOpen,
    isSubscriptionModalOpen,
    openAuthModal,
    closeAuthModal,
    openProfileModal,
    closeProfileModal,
    openSubscriptionModal,
    closeSubscriptionModal,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    upgradeToPro,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
