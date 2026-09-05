import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRoleStore } from './useRoleStore';

const STORAGE_KEYS = {
  ONBOARDED: '@hasan_onboarded_v2',
  SPLASH_SEEN: '@hasan_splash_seen_v2',
  USER_PROFILE: '@hasan_user_profile_v2',
};

const safeGetItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web' && typeof window === 'undefined') return null;
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web' && typeof window === 'undefined') return;
  try {
    await AsyncStorage.setItem(key, value);
  } catch {}
};

const safeRemoveItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web' && typeof window === 'undefined') return;
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
};

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'staff' | 'owner';
  avatarUrl?: string;
  loyaltyPoints: number;
  tier: string;
  roleLabel: string;
  savedAddresses: Array<{
    id: string;
    label: string;
    address: string;
    isDefault: boolean;
  }>;
}

const mapProfileRow = (profile: any): UserProfile => {
  const role: 'customer' | 'staff' | 'owner' =
    profile.role === 'owner' ? 'owner' : profile.role === 'cashier' ? 'staff' : 'customer';

  const roleLabel =
    role === 'owner'
      ? 'Owner & Admin'
      : role === 'staff'
      ? 'Staff (POS & KDS)'
      : 'Customer Diner';

  const tier = role === 'owner' ? 'Executive Owner' : role === 'staff' ? 'Floor Manager' : 'Gold VIP';

  return {
    id: String(profile.id),
    name: profile.full_name || profile.email?.split('@')[0] || 'Diner',
    email: profile.email || '',
    phone: profile.phone || '',
    role,
    avatarUrl: profile.avatar_url || undefined,
    loyaltyPoints: role === 'owner' ? 1250 : role === 'staff' ? 0 : 350,
    tier,
    roleLabel,
    savedAddresses: [],
  };
};

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  hasSeenSplash: boolean;
  isLoading: boolean;

  initializeAuth: () => Promise<void>;
  login: (email: string, password?: string) => Promise<{ success: boolean; role: 'customer' | 'staff' | 'owner'; message?: string }>;
  quickLogin: (accountType: 'customer' | 'staff' | 'owner') => Promise<{ success: boolean; role: 'customer' | 'staff' | 'owner' }>;
  signup: (data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
  }) => Promise<{ success: boolean; role: 'customer' | 'staff' | 'owner'; message?: string }>;
  socialLogin: (provider: 'google' | 'apple') => Promise<{ success: boolean; role: 'customer' | 'staff' | 'owner' }>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  setHasSeenSplash: (seen: boolean) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isOnboarded: false,
  hasSeenSplash: false,
  isLoading: true,

  initializeAuth: async () => {
    try {
      set({ isLoading: true });
      const [onboardedVal, splashVal, storedProfile] = await Promise.all([
        safeGetItem(STORAGE_KEYS.ONBOARDED),
        safeGetItem(STORAGE_KEYS.SPLASH_SEEN),
        safeGetItem(STORAGE_KEYS.USER_PROFILE),
      ]);

      const isOnboarded = onboardedVal === 'true';
      const hasSeenSplash = splashVal === 'true';

      let user: UserProfile | null = null;
      if (storedProfile) {
        try {
          user = JSON.parse(storedProfile);
        } catch {}
      }

      // Check live Supabase Session
      if (Platform.OS !== 'web' || typeof window !== 'undefined') {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              user = mapProfileRow(profile);
              await safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
            }
          }
        } catch (e) {
          console.warn('Supabase session check error:', e);
        }
      }

      if (user) {
        if (user.role === 'owner') useRoleStore.getState().setRole('owner');
        else if (user.role === 'staff') useRoleStore.getState().setRole('pos');
        else useRoleStore.getState().setRole('customer');
      }

      set({
        isOnboarded,
        hasSeenSplash,
        user,
        isAuthenticated: !!user,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to initialize auth store:', err);
      set({ isLoading: false });
    }
  },

  login: async (email: string, password?: string) => {
    set({ isLoading: true });
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Supabase Auth with password
      if (password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            const userProfile = mapProfileRow(profile);
            if (userProfile.role === 'owner') useRoleStore.getState().setRole('owner');
            else if (userProfile.role === 'staff') useRoleStore.getState().setRole('pos');
            else useRoleStore.getState().setRole('customer');

            await safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
            await safeSetItem(STORAGE_KEYS.ONBOARDED, 'true');

            set({
              user: userProfile,
              isAuthenticated: true,
              isOnboarded: true,
              isLoading: false,
            });

            return { success: true, role: userProfile.role };
          }
        }
      }

      // 2. Fetch profile directly from live database table
      const { data: dbProfile, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .single();

      if (!dbError && dbProfile) {
        const userProfile = mapProfileRow(dbProfile);
        if (userProfile.role === 'owner') useRoleStore.getState().setRole('owner');
        else if (userProfile.role === 'staff') useRoleStore.getState().setRole('pos');
        else useRoleStore.getState().setRole('customer');

        await safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
        await safeSetItem(STORAGE_KEYS.ONBOARDED, 'true');

        set({
          user: userProfile,
          isAuthenticated: true,
          isOnboarded: true,
          isLoading: false,
        });

        return { success: true, role: userProfile.role };
      }

      set({ isLoading: false });
      return { success: false, role: 'customer', message: 'User profile not found in database.' };
    } catch (err: any) {
      console.error('Login error:', err);
      set({ isLoading: false });
      return { success: false, role: 'customer', message: err?.message || 'Authentication failed' };
    }
  },

  quickLogin: async (accountType) => {
    set({ isLoading: true });
    const targetEmail =
      accountType === 'owner'
        ? 'owner@hasan.com'
        : accountType === 'staff'
        ? 'cashier@hasan.com'
        : 'customer@hasan.com';

    try {
      // 1. Try Supabase Auth first
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: 'Password123!',
      });

      let profileData = null;
      if (!error && data?.user) {
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        profileData = p;
      }

      // 2. Fallback to direct profiles table lookup
      if (!profileData) {
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', targetEmail)
          .single();
        profileData = p;
      }

      if (profileData) {
        const userProfile = mapProfileRow(profileData);
        if (userProfile.role === 'owner') useRoleStore.getState().setRole('owner');
        else if (userProfile.role === 'staff') useRoleStore.getState().setRole('pos');
        else useRoleStore.getState().setRole('customer');

        await safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
        await safeSetItem(STORAGE_KEYS.ONBOARDED, 'true');

        set({
          user: userProfile,
          isAuthenticated: true,
          isOnboarded: true,
          isLoading: false,
        });

        return { success: true, role: userProfile.role };
      }

      set({ isLoading: false });
      return { success: false, role: accountType };
    } catch (e) {
      console.error('Quick login error:', e);
      set({ isLoading: false });
      return { success: false, role: accountType };
    }
  },

  signup: async (data) => {
    set({ isLoading: true });
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim();
    const cleanName = data.name.trim() || 'New Foodie';

    try {
      let supabaseUserId = `usr_${Date.now()}`;
      if (data.password) {
        const { data: authData, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: data.password,
          options: {
            data: {
              full_name: cleanName,
              phone: cleanPhone,
              role: 'customer',
            },
          },
        });

        if (authData?.user) {
          supabaseUserId = authData.user.id;
        }
      }

      // Insert into public.profiles
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: supabaseUserId,
          email: cleanEmail,
          full_name: cleanName,
          phone: cleanPhone,
          role: 'customer',
        })
        .select()
        .single();

      const userProfile: UserProfile = newProfile
        ? mapProfileRow(newProfile)
        : {
            id: supabaseUserId,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            role: 'customer',
            loyaltyPoints: 100,
            tier: 'Gold VIP',
            roleLabel: 'Customer Diner',
            savedAddresses: [],
          };

      useRoleStore.getState().setRole('customer');
      await safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
      await safeSetItem(STORAGE_KEYS.ONBOARDED, 'true');

      set({
        user: userProfile,
        isAuthenticated: true,
        isOnboarded: true,
        isLoading: false,
      });

      return { success: true, role: 'customer' };
    } catch (e: any) {
      console.error('Signup error:', e);
      set({ isLoading: false });
      return { success: false, role: 'customer', message: e?.message || 'Failed to create account' };
    }
  },

  socialLogin: async (provider: 'google' | 'apple') => {
    // For social login, query or create customer profile
    const email = provider === 'apple' ? 'apple.user@icloud.com' : 'google.user@gmail.com';
    const name = provider === 'apple' ? 'Apple Foodie' : 'Google Gourmet';

    const { data: profile } = await supabase
      .from('profiles')
      .upsert({
        id: `usr_${Date.now()}`,
        email,
        full_name: name,
        phone: '+63 917 000 0000',
        role: 'customer',
      })
      .select()
      .single();

    const userProfile = profile ? mapProfileRow(profile) : {
      id: `usr_${Date.now()}`,
      name,
      email,
      phone: '+63 917 000 0000',
      role: 'customer' as const,
      loyaltyPoints: 100,
      tier: 'Gold VIP',
      roleLabel: 'Customer Diner',
      savedAddresses: [],
    };

    useRoleStore.getState().setRole('customer');
    await safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
    await safeSetItem(STORAGE_KEYS.ONBOARDED, 'true');

    set({
      user: userProfile,
      isAuthenticated: true,
      isOnboarded: true,
      isLoading: false,
    });

    return { success: true, role: 'customer' };
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    await safeRemoveItem(STORAGE_KEYS.USER_PROFILE);
    useRoleStore.getState().setRole('customer');
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  completeOnboarding: async () => {
    await safeSetItem(STORAGE_KEYS.ONBOARDED, 'true');
    set({ isOnboarded: true });
  },

  resetOnboarding: async () => {
    await safeRemoveItem(STORAGE_KEYS.ONBOARDED);
    await safeRemoveItem(STORAGE_KEYS.SPLASH_SEEN);
    set({ isOnboarded: false, hasSeenSplash: false });
  },

  setHasSeenSplash: async (seen: boolean) => {
    if (seen) {
      await safeSetItem(STORAGE_KEYS.SPLASH_SEEN, 'true');
    } else {
      await safeRemoveItem(STORAGE_KEYS.SPLASH_SEEN);
    }
    set({ hasSeenSplash: seen });
  },

  updateProfile: async (data) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...data };
      safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
      set({ user: updated });

      try {
        await supabase
          .from('profiles')
          .update({
            full_name: updated.name,
            phone: updated.phone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', current.id);
      } catch (e) {
        console.error('Failed to update profile in Supabase:', e);
      }
    }
  },
}));
