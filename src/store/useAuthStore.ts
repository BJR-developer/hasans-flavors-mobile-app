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

// Safe storage wrapper for Web SSR and Native
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

export const DUMMY_ACCOUNTS: Record<'customer' | 'staff' | 'owner', UserProfile> = {
  customer: {
    id: 'e90a408f-a26c-44f5-9f3d-f79351b66e65',
    name: 'Tariq Customer',
    email: 'customer@hasan.com',
    phone: '+63 917 123 4569',
    role: 'customer',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    loyaltyPoints: 480,
    tier: 'Gold VIP',
    roleLabel: 'Customer Diner',
    savedAddresses: [
      {
        id: 'addr_1',
        label: 'Home',
        address: 'Tower 2, Unit 1804, Makati Central, Metro Manila',
        isDefault: true,
      },
      {
        id: 'addr_2',
        label: 'Office',
        address: 'Floor 12, Enterprise Center, Ayala Ave, Makati',
        isDefault: false,
      },
    ],
  },
  staff: {
    id: '89479ead-04c9-4845-81e4-08aa9bfea71b',
    name: 'Main POS Cashier',
    email: 'cashier@hasan.com',
    phone: '+63 917 123 4568',
    role: 'staff',
    avatarUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=300&q=80',
    loyaltyPoints: 0,
    tier: 'Kitchen & Floor Lead',
    roleLabel: 'Staff (POS & KDS)',
    savedAddresses: [],
  },
  owner: {
    id: 'bc4be3cf-66fb-4c0c-ba5d-a8b3609f9a72',
    name: 'Hasan Restaurant Owner',
    email: 'owner@hasan.com',
    phone: '+63 917 123 4567',
    role: 'owner',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    loyaltyPoints: 1250,
    tier: 'General Manager & Owner',
    roleLabel: 'Restaurant Owner & Admin',
    savedAddresses: [],
  },
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
  updateProfile: (data: Partial<UserProfile>) => void;
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

      // Check live Supabase Session if on client
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
              const role: 'customer' | 'staff' | 'owner' =
                profile.role === 'owner' ? 'owner' : profile.role === 'cashier' ? 'staff' : 'customer';

              user = {
                id: profile.id,
                name: profile.full_name || session.user.email?.split('@')[0] || 'Diner',
                email: profile.email || session.user.email || '',
                phone: profile.phone || '',
                role,
                avatarUrl: profile.avatar_url,
                loyaltyPoints: role === 'owner' ? 1250 : 250,
                tier: role === 'owner' ? 'Owner' : 'Gold VIP',
                roleLabel: role === 'owner' ? 'Owner & Admin' : role === 'staff' ? 'Staff (POS & KDS)' : 'Customer Diner',
                savedAddresses: user?.savedAddresses || [],
              };

              await safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
            }
          }
        } catch (e) {
          console.warn('Supabase session check warning:', e);
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

    // 1. Try Supabase Auth first
    if (password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          console.warn('Supabase sign-in error:', error.message);
        } else if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const role: 'customer' | 'staff' | 'owner' =
            profile?.role === 'owner' ? 'owner' : profile?.role === 'cashier' ? 'staff' : 'customer';

          const userProfile: UserProfile = {
            id: data.user.id,
            name: profile?.full_name || cleanEmail.split('@')[0],
            email: cleanEmail,
            phone: profile?.phone || '',
            role,
            avatarUrl: profile?.avatar_url,
            loyaltyPoints: role === 'owner' ? 1250 : 250,
            tier: role === 'owner' ? 'Owner' : 'Gold VIP',
            roleLabel: role === 'owner' ? 'Owner & Admin' : role === 'staff' ? 'Staff (POS & KDS)' : 'Customer Diner',
            savedAddresses: [],
          };

          if (role === 'owner') useRoleStore.getState().setRole('owner');
          else if (role === 'staff') useRoleStore.getState().setRole('pos');
          else useRoleStore.getState().setRole('customer');

          await safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
          await safeSetItem(STORAGE_KEYS.ONBOARDED, 'true');

          set({
            user: userProfile,
            isAuthenticated: true,
            isOnboarded: true,
            isLoading: false,
          });

          return { success: true, role };
        }
      } catch (err: any) {
        console.warn('Supabase sign in failed, falling back to local role check:', err?.message);
      }
    }

    // 2. Local role match fallback for quick testing
    let profile: UserProfile;
    if (cleanEmail.includes('owner')) {
      profile = { ...DUMMY_ACCOUNTS.owner, email: cleanEmail };
      useRoleStore.getState().setRole('owner');
    } else if (cleanEmail.includes('staff') || cleanEmail.includes('cashier') || cleanEmail.includes('pos')) {
      profile = { ...DUMMY_ACCOUNTS.staff, email: cleanEmail };
      useRoleStore.getState().setRole('pos');
    } else {
      const userName = cleanEmail.split('@')[0].replace(/[._]/g, ' ') || 'Hasan Diner';
      const capitalizedName = userName
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      profile = {
        ...DUMMY_ACCOUNTS.customer,
        name: capitalizedName,
        email: cleanEmail,
      };
      useRoleStore.getState().setRole('customer');
    }

    await safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    await safeSetItem(STORAGE_KEYS.ONBOARDED, 'true');

    set({
      user: profile,
      isAuthenticated: true,
      isOnboarded: true,
      isLoading: false,
    });

    return { success: true, role: profile.role };
  },

  quickLogin: async (accountType) => {
    set({ isLoading: true });
    const profile = DUMMY_ACCOUNTS[accountType];

    if (accountType === 'owner') {
      useRoleStore.getState().setRole('owner');
    } else if (accountType === 'staff') {
      useRoleStore.getState().setRole('pos');
    } else {
      useRoleStore.getState().setRole('customer');
    }

    await safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    await safeSetItem(STORAGE_KEYS.ONBOARDED, 'true');

    set({
      user: profile,
      isAuthenticated: true,
      isOnboarded: true,
      isLoading: false,
    });

    return { success: true, role: profile.role };
  },

  signup: async (data) => {
    set({ isLoading: true });
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim();
    const cleanName = data.name.trim() || 'New Foodie';

    // 1. Supabase Signup
    let supabaseUserId = `usr_${Date.now()}`;
    if (data.password) {
      try {
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

        if (error) {
          console.warn('Supabase signup error:', error.message);
        } else if (authData?.user) {
          supabaseUserId = authData.user.id;
          await supabase.from('profiles').upsert({
            id: supabaseUserId,
            email: cleanEmail,
            full_name: cleanName,
            phone: cleanPhone,
            role: 'customer',
          });
        }
      } catch (e: any) {
        console.warn('Supabase signup exception:', e?.message);
      }
    }

    const newUser: UserProfile = {
      ...DUMMY_ACCOUNTS.customer,
      id: supabaseUserId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      loyaltyPoints: 100,
      role: 'customer',
    };

    useRoleStore.getState().setRole('customer');

    await safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(newUser));
    await safeSetItem(STORAGE_KEYS.ONBOARDED, 'true');

    set({
      user: newUser,
      isAuthenticated: true,
      isOnboarded: true,
      isLoading: false,
    });

    return { success: true, role: 'customer' };
  },

  socialLogin: async (provider: 'google' | 'apple') => {
    set({ isLoading: true });
    const socialUser: UserProfile = {
      ...DUMMY_ACCOUNTS.customer,
      name: provider === 'apple' ? 'Apple Foodie' : 'Google Gourmet',
      email: provider === 'apple' ? 'apple.user@icloud.com' : 'google.user@gmail.com',
      role: 'customer',
    };

    useRoleStore.getState().setRole('customer');
    await safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(socialUser));
    await safeSetItem(STORAGE_KEYS.ONBOARDED, 'true');

    set({
      user: socialUser,
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

  updateProfile: (data) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...data };
      safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
      set({ user: updated });
    }
  },
}));
