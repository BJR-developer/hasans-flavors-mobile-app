import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRoleStore } from './useRoleStore';
import { validateEmail, validatePassword } from '@/lib/validation';

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

  const tier = role === 'owner' ? 'Executive Owner' : role === 'staff' ? 'Floor Manager' : 'Diner VIP';

  return {
    id: String(profile.id),
    name: profile.full_name || profile.email?.split('@')[0] || 'Diner',
    email: profile.email || '',
    phone: profile.phone || '',
    role,
    avatarUrl: profile.avatar_url || undefined,
    loyaltyPoints: 0,
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
  signup: (data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
  }) => Promise<{ success: boolean; role: 'customer' | 'staff' | 'owner'; message?: string }>;
  socialLogin: (provider: 'google' | 'apple') => Promise<{ success: boolean; role: 'customer' | 'staff' | 'owner'; message?: string }>;
  logout: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; message?: string }>;
  verifyPasswordResetOtp: (email: string, token: string) => Promise<{ success: boolean; message?: string }>;
  updateNewPassword: (newPassword: string) => Promise<{ success: boolean; message?: string }>;
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
      const [onboardedVal, splashVal] = await Promise.all([
        safeGetItem(STORAGE_KEYS.ONBOARDED),
        safeGetItem(STORAGE_KEYS.SPLASH_SEEN),
      ]);

      const isOnboarded = onboardedVal === 'true';
      const hasSeenSplash = splashVal === 'true';

      let user: UserProfile | null = null;

      // Check live Supabase Session
      try {
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        if (!sessionErr && session?.user) {
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!profileErr && profile) {
            user = mapProfileRow(profile);
            await safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
          } else {
            // User exists in auth but profile missing, create or map from auth metadata
            const meta = session.user.user_metadata || {};
            const role: 'customer' | 'staff' | 'owner' =
              meta.role === 'owner' ? 'owner' : meta.role === 'cashier' ? 'staff' : 'customer';
            const fallbackProfile: UserProfile = {
              id: session.user.id,
              name: meta.full_name || session.user.email?.split('@')[0] || 'Diner',
              email: session.user.email || '',
              phone: meta.phone || '',
              role,
              loyaltyPoints: 0,
              tier: 'Diner VIP',
              roleLabel: 'Customer Diner',
              savedAddresses: [],
            };
            user = fallbackProfile;
            await safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
          }
        } else {
          // No active Supabase session -> ensure profile is cleared
          await safeRemoveItem(STORAGE_KEYS.USER_PROFILE);
        }
      } catch (e) {
        console.warn('Supabase session check error:', e);
      }

      if (user) {
        if (user.role === 'owner') useRoleStore.getState().setRole('owner');
        else if (user.role === 'staff') useRoleStore.getState().setRole('pos');
        else useRoleStore.getState().setRole('customer');
      } else {
        useRoleStore.getState().setRole('customer');
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

    const emailCheck = validateEmail(cleanEmail);
    if (!emailCheck.isValid) {
      set({ isLoading: false });
      return { success: false, role: 'customer', message: emailCheck.error || 'Please enter a valid email address.' };
    }

    if (!password) {
      set({ isLoading: false });
      return { success: false, role: 'customer', message: 'Password is required to sign in.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        set({ isLoading: false });
        return { success: false, role: 'customer', message: error.message };
      }

      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const userProfile = profile
          ? mapProfileRow(profile)
          : {
              id: data.user.id,
              name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Diner',
              email: data.user.email || cleanEmail,
              phone: data.user.user_metadata?.phone || '',
              role: 'customer' as const,
              loyaltyPoints: 0,
              tier: 'Diner VIP',
              roleLabel: 'Customer Diner',
              savedAddresses: [],
            };

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
      return { success: false, role: 'customer', message: 'Invalid credentials' };
    } catch (err: any) {
      console.error('Login error:', err);
      set({ isLoading: false });
      return { success: false, role: 'customer', message: err?.message || 'Authentication failed' };
    }
  },

  signup: async (data) => {
    set({ isLoading: true });
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim();
    const cleanName = data.name.trim() || 'New Foodie';

    const emailCheck = validateEmail(cleanEmail);
    if (!emailCheck.isValid) {
      set({ isLoading: false });
      return { success: false, role: 'customer', message: emailCheck.error || 'Invalid email address.' };
    }

    const passCheck = validatePassword(data.password || '');
    if (!passCheck.isValid) {
      set({ isLoading: false });
      return { success: false, role: 'customer', message: passCheck.error || 'Password does not meet requirements.' };
    }

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.password!,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
            role: 'customer',
          },
        },
      });

      if (error) {
        set({ isLoading: false });
        return { success: false, role: 'customer', message: error.message };
      }

      if (!authData?.user) {
        set({ isLoading: false });
        return { success: false, role: 'customer', message: 'User registration could not be completed' };
      }

      // Upsert into public.profiles
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: cleanEmail,
          full_name: cleanName,
          phone: cleanPhone,
          role: 'customer',
        })
        .select()
        .single();

      if (profileError) {
        console.warn('Profile upsert warning:', profileError);
      }

      const userProfile: UserProfile = newProfile
        ? mapProfileRow(newProfile)
        : {
            id: authData.user.id,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            role: 'customer',
            loyaltyPoints: 0,
            tier: 'Diner VIP',
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
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider === 'apple' ? 'apple' : 'google',
      });
      if (error) {
        return { success: false, role: 'customer', message: error.message };
      }
      return { success: true, role: 'customer' };
    } catch (e: any) {
      return { success: false, role: 'customer', message: e?.message || 'Social login unavailable' };
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    await safeRemoveItem(STORAGE_KEYS.USER_PROFILE);
    useRoleStore.getState().setRole('customer');
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  sendPasswordResetEmail: async (email: string) => {
    set({ isLoading: true });
    const cleanEmail = email.trim().toLowerCase();
    const emailVal = validateEmail(cleanEmail);
    if (!emailVal.isValid) {
      set({ isLoading: false });
      return { success: false, message: emailVal.error || 'Invalid email address' };
    }

    try {
      const redirectUrl =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? `${window.location.origin}/auth/forgot-password`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      set({ isLoading: false });
      if (error) {
        return { success: false, message: error.message };
      }
      return {
        success: true,
        message: `Password reset verification instructions and code sent to ${cleanEmail}`,
      };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, message: err?.message || 'Failed to send reset email' };
    }
  },

  verifyPasswordResetOtp: async (email: string, token: string) => {
    set({ isLoading: true });
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    if (!cleanToken || cleanToken.length < 6) {
      set({ isLoading: false });
      return { success: false, message: 'Please enter the complete 6-digit verification code.' };
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'recovery',
      });

      set({ isLoading: false });
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Verification successful! Please choose a new password.' };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, message: err?.message || 'Verification failed. Please check the code.' };
    }
  },

  updateNewPassword: async (newPassword: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      set({ isLoading: false });
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Your password has been updated successfully.' };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, message: err?.message || 'Failed to update password' };
    }
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
