import { create } from 'zustand';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    loyaltyPoints: number;
    tier: 'Silver Member' | 'Gold VIP' | 'Platinum Gourmet';
    savedAddresses: Array<{
        id: string;
        label: string;
        address: string;
        isDefault: boolean;
    }>;
}

interface AuthState {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isOnboarded: boolean;
    hasSeenSplash: boolean;
    isLoading: boolean;

    login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
    signup: (data: {
        name: string;
        email: string;
        phone: string;
        password?: string;
    }) => Promise<{ success: boolean; message?: string }>;
    socialLogin: (provider: 'google' | 'apple') => Promise<{ success: boolean }>;
    logout: () => void;
    completeOnboarding: () => void;
    resetOnboarding: () => void;
    setHasSeenSplash: (seen: boolean) => void;
    updateProfile: (data: Partial<UserProfile>) => void;
}

const DEFAULT_USER: UserProfile = {
    id: 'usr_88291',
    name: 'Hasan Raza',
    email: 'hasan.raza@example.com',
    phone: '+1 (555) 349-2345',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    loyaltyPoints: 480,
    tier: 'Gold VIP',
    savedAddresses: [
        {
            id: 'addr_1',
            label: 'Home',
            address: '742 Evergreen Terrace, Apt 4B, Springfield',
            isDefault: true,
        },
        {
            id: 'addr_2',
            label: 'Office',
            address: 'Floor 12, Tech Innovation Hub, Downtown',
            isDefault: false,
        },
    ],
};

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isOnboarded: false,
    hasSeenSplash: false,
    isLoading: false,

    login: async (email: string, password?: string) => {
        set({ isLoading: true });
        // Simulate API network latency
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Dummy authentication logic: accepts any non-empty email
        const trimmedEmail = email.trim() || 'hasan.raza@example.com';
        const userName = trimmedEmail.split('@')[0].replace(/[._]/g, ' ') || 'Foodie Enthusiast';
        const capitalizedName = userName
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

        const loggedInUser: UserProfile = {
            ...DEFAULT_USER,
            name: capitalizedName || DEFAULT_USER.name,
            email: trimmedEmail,
        };

        set({
            user: loggedInUser,
            isAuthenticated: true,
            isOnboarded: true,
            isLoading: false,
        });

        return { success: true };
    },

    signup: async (data) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 900));

        const newUser: UserProfile = {
            ...DEFAULT_USER,
            id: `usr_${Math.floor(Math.random() * 90000 + 10000)}`,
            name: data.name.trim() || 'New Foodie',
            email: data.email.trim() || 'user@example.com',
            phone: data.phone.trim() || '+1 (555) 000-0000',
            loyaltyPoints: 100, // Welcome bonus points
        };

        set({
            user: newUser,
            isAuthenticated: true,
            isOnboarded: true,
            isLoading: false,
        });

        return { success: true };
    },

    socialLogin: async (provider: 'google' | 'apple') => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 700));

        const socialUser: UserProfile = {
            ...DEFAULT_USER,
            name: provider === 'apple' ? 'Apple Foodie' : 'Google Gourmet',
            email: provider === 'apple' ? 'apple.user@icloud.com' : 'google.user@gmail.com',
        };

        set({
            user: socialUser,
            isAuthenticated: true,
            isOnboarded: true,
            isLoading: false,
        });

        return { success: true };
    },

    logout: () => {
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
