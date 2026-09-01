import { create } from 'zustand';

interface FavoritesState {
  favoriteIds: string[];
  toggleFavorite: (dishId: string) => void;
  isFavorite: (dishId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favoriteIds: ['4066', '4070', '4075'], // Pre-favorite popular biryani & haleem

  toggleFavorite: (dishId: string) => {
    set((state) => {
      const exists = state.favoriteIds.includes(dishId);
      if (exists) {
        return { favoriteIds: state.favoriteIds.filter((id) => id !== dishId) };
      } else {
        return { favoriteIds: [...state.favoriteIds, dishId] };
      }
    });
  },

  isFavorite: (dishId: string) => {
    return get().favoriteIds.includes(dishId);
  },
}));
