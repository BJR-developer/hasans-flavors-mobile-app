import { create } from 'zustand';
import { UserRole } from '@/types';
import { useRoleStore } from './useRoleStore';

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
        id: 'usr_customer_01',
        name: 'Hasan Raza',
        email: 'customer@hasan.com',
        phone: '+63 917 888 1234',
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
        id: 'usr_staff_01',
        name: 'Tariq Khan',
        email: 'staff@hasan.com',
        phone: '+63 917 555 9012',
        role: 'staff',
        avatarUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=300&q=80',
        loyaltyPoints: 0,
        tier: 'Kitchen & Floor Lead',
        roleLabel: 'Staff (POS & KDS)',
        savedAddresses: [],
    },
    owner: {
        id: 'usr_owner_01',
        name: 'Malik Hasan',
        email: 'owner@hasan.com',
        phone: '+63 917 777 8888',
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

    login: (email: string, password?: string) => Promise<{ success: boolean; role: 'customer' | 'staff' | 'owner'; message?: string }>;
    quickLogin: (accountType: 'customer' | 'staff' | 'owner') => Promise<{ success: boolean; role: 'customer' | 'staff' | 'owner' }>;
    signup: (data: {
        name: string;
        email: string;
        phone: string;
        password?: string;
    }) => Promise<{ success: boolean; role: 'customer' | 'staff' | 'owner'; message?: string }>;
    socialLogin: (provider: 'google' | 'apple') => Promise<{ success: boolean; role: 'customer' | 'staff' | 'owner' }>;
    logout: () => void;
    completeOnboarding: () => void;
    resetOnboarding: () => void;
    setHasSeenSplash: (seen: boolean) => void;
    updateProfile: (data: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isOnboarded: false,
    hasSeenSplash: false,
    isLoading: false,

    login: async (email: string, password?: string) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));

        const lowerEmail = email.trim().toLowerCase();

        let profile: UserProfile;
        if (lowerEmail.includes('owner') || lowerEmail.includes('admin')) {
            profile = { ...DUMMY_ACCOUNTS.owner, email: lowerEmail };
            useRoleStore.getState().setRole('owner');
        } else if (lowerEmail.includes('staff') || lowerEmail.includes('pos') || lowerEmail.includes('kds') || lowerEmail.includes('chef')) {
            profile = { ...DUMMY_ACCOUNTS.staff, email: lowerEmail };
            useRoleStore.getState().setRole('pos');
        } else {
            // Default to Customer
            const userName = lowerEmail.split('@')[0].replace(/[._]/g, ' ') || 'Hasan Raza';
            const capitalizedName = userName
                .split(' ')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');

            profile = {
                ...DUMMY_ACCOUNTS.customer,
                name: capitalizedName || DUMMY_ACCOUNTS.customer.name,
                email: lowerEmail || DUMMY_ACCOUNTS.customer.email,
            };
            useRoleStore.getState().setRole('customer');
        }

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
        await new Promise((resolve) => setTimeout(resolve, 300));

        const profile = DUMMY_ACCOUNTS[accountType];
        if (accountType === 'owner') {
            useRoleStore.getState().setRole('owner');
        } else if (accountType === 'staff') {
            useRoleStore.getState().setRole('pos');
        } else {
            useRoleStore.getState().setRole('customer');
        }

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
        await new Promise((resolve) => setTimeout(resolve, 600));

        const newUser: UserProfile = {
            ...DUMMY_ACCOUNTS.customer,
            id: `usr_${Math.floor(Math.random() * 90000 + 10000)}`,
            name: data.name.trim() || 'New Foodie',
            email: data.email.trim() || 'user@example.com',
            phone: data.phone.trim() || '+63 917 000 0000',
            loyaltyPoints: 100,
            role: 'customer',
        };

        useRoleStore.getState().setRole('customer');

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
        await new Promise((resolve) => setTimeout(resolve, 400));

        const socialUser: UserProfile = {
            ...DUMMY_ACCOUNTS.customer,
            name: provider === 'apple' ? 'Apple Foodie' : 'Google Gourmet',
            email: provider === 'apple' ? 'apple.user@icloud.com' : 'google.user@gmail.com',
            role: 'customer',
        };

        useRoleStore.getState().setRole('customer');

        set({
            user: socialUser,
            isAuthenticated: true,
            isOnboarded: true,
            isLoading: false,
        });

        return { success: true, role: 'customer' };
    },

    logout: () => {
        useRoleStore.getState().setRole('customer');
        set({
            user: null,
            isAuthenticated: false,
        });
    },

    completeOnboarding: () => {
        set({ isOnboarded: true });
    },

    resetOnboarding: () => {
        set({ isOnboarded: false, hasSeenSplash: false });
    },

    setHasSeenSplash: (seen: boolean) => {
        set({ hasSeenSplash: seen });
    },

    updateProfile: (data) => {
        const current = get().user;
        if (current) {
            set({ user: { ...current, ...data } });
        }
    },
}));
