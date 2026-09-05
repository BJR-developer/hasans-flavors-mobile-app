import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const FAVORITES_KEY = '@hasan_favorites_v2';

const safeGetFavorites = async (): Promise<string[]> => {
  if (Platform.OS === 'web' && typeof window === 'undefined') return [];
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const safeSetFavorites = async (ids: string[]): Promise<void> => {
  if (Platform.OS === 'web' && typeof window === 'undefined') return;
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {}
};

interface FavoritesState {
  favoriteIds: string[];
  isLoading: boolean;
  loadFavorites: () => Promise<void>;
  toggleFavorite: (dishId: string) => void;
  isFavorite: (dishId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favoriteIds: [],
  isLoading: false,

  loadFavorites: async () => {
    set({ isLoading: true });
    const ids = await safeGetFavorites();
    set({ favoriteIds: ids, isLoading: false });
  },

  toggleFavorite: (dishId: string) => {
    const current = get().favoriteIds;
    const exists = current.includes(dishId);
    const updated = exists ? current.filter((id) => id !== dishId) : [...current, dishId];

    set({ favoriteIds: updated });
    safeSetFavorites(updated);
  },

  isFavorite: (dishId: string) => {
    return get().favoriteIds.includes(dishId);
  },
}));
