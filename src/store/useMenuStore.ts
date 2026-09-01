import { create } from 'zustand';
import { Category, Dish } from '@/types';
import menuData from '@/data/menu.json';
import categoriesData from '@/data/categories.json';

interface MenuState {
  dishes: Dish[];
  categories: Category[];
  selectedCategoryId: string;
  searchQuery: string;
  selectedSpiceFilter: number | null;
  onlyChefSpecial: boolean;
  onlyHalal: boolean;

  // Actions
  setSelectedCategory: (categoryId: string) => void;
  setSearchQuery: (query: string) => void;
  setSpiceFilter: (level: number | null) => void;
  toggleChefSpecialFilter: () => void;
  toggleDishStock: (dishId: string) => void;
  getFilteredDishes: () => Dish[];
  getDishById: (dishId: string) => Dish | undefined;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  dishes: menuData as Dish[],
  categories: categoriesData as Category[],
  selectedCategoryId: 'all',
  searchQuery: '',
  selectedSpiceFilter: null,
  onlyChefSpecial: false,
  onlyHalal: false,

  setSelectedCategory: (categoryId) => {
    set({ selectedCategoryId: categoryId });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSpiceFilter: (level) => {
    set((state) => ({
      selectedSpiceFilter: state.selectedSpiceFilter === level ? null : level,
    }));
  },

  toggleChefSpecialFilter: () => {
    set((state) => ({ onlyChefSpecial: !state.onlyChefSpecial }));
  },

  toggleDishStock: (dishId) => {
    set((state) => ({
      dishes: state.dishes.map((d) => (d.id === dishId ? { ...d, inStock: !d.inStock } : d)),
    }));
  },

  getFilteredDishes: () => {
    const { dishes, selectedCategoryId, categories, searchQuery, selectedSpiceFilter, onlyChefSpecial } = get();

    return dishes.filter((dish) => {
      // Category filter
      if (selectedCategoryId !== 'all') {
        const cat = categories.find((c) => c.id === selectedCategoryId);
        if (cat && cat.match) {
          const reg = new RegExp(cat.match, 'i');
          const matches = reg.test(dish.name) || reg.test(dish.category);
          if (!matches) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = dish.name.toLowerCase().includes(q);
        const matchDesc = dish.description.toLowerCase().includes(q);
        const matchCat = dish.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      // Spice filter
      if (selectedSpiceFilter !== null && dish.spiceLevel !== selectedSpiceFilter) {
        return false;
      }

      // Chef special filter
      if (onlyChefSpecial && !dish.isChefSpecial) {
        return false;
      }

      return true;
    });
  },

  getDishById: (dishId) => {
    return get().dishes.find((d) => d.id === dishId);
  },
}));
