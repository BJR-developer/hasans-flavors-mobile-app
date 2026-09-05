import { create } from 'zustand';
import { Category, Dish } from '@/types';
import menuFallback from '@/data/menu.json';
import categoriesFallback from '@/data/categories.json';
import { supabase } from '@/lib/supabase';

const mapDishRow = (row: any): Dish => ({
  id: String(row.id),
  name: row.name,
  slug: row.slug,
  price: Number(row.price),
  formattedPrice: row.formatted_price || `₱${Number(row.price).toLocaleString()}`,
  category: row.category_name,
  description: row.description || '',
  imageUrl: row.image_url || '',
  spiceLevel: Number(row.spice_level || 0),
  isHalal: row.is_halal ?? true,
  isChefSpecial: row.is_chef_special ?? false,
  isPopular: row.is_popular ?? false,
  inStock: row.in_stock ?? true,
  preparationTime: row.preparation_time || '15-20 mins',
  calories: row.calories || '',
  rating: String(row.rating || '4.8'),
  reviewCount: Number(row.review_count || 10),
});

interface MenuState {
  dishes: Dish[];
  categories: Category[];
  selectedCategoryId: string;
  searchQuery: string;
  selectedSpiceFilter: number | null;
  onlyChefSpecial: boolean;
  onlyHalal: boolean;
  isLoading: boolean;
  isRealtimeConnected: boolean;

  // Actions
  fetchMenuData: () => Promise<void>;
  setSelectedCategory: (categoryId: string) => void;
  setSearchQuery: (query: string) => void;
  setSpiceFilter: (level: number | null) => void;
  toggleChefSpecialFilter: () => void;
  toggleDishStock: (dishId: string) => Promise<void>;
  getFilteredDishes: () => Dish[];
  getDishById: (dishId: string) => Dish | undefined;
}

let realtimeSubscribed = false;

export const useMenuStore = create<MenuState>((set, get) => ({
  dishes: menuFallback as Dish[],
  categories: categoriesFallback as Category[],
  selectedCategoryId: 'all',
  searchQuery: '',
  selectedSpiceFilter: null,
  onlyChefSpecial: false,
  onlyHalal: false,
  isLoading: false,
  isRealtimeConnected: false,

  fetchMenuData: async () => {
    try {
      set({ isLoading: true });

      // 1. Fetch Dishes
      const { data: dishData, error: dishError } = await supabase
        .from('dishes')
        .select('*')
        .order('name');

      if (!dishError && dishData && dishData.length > 0) {
        set({ dishes: dishData.map(mapDishRow) });
      }

      // 2. Fetch Categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (!catError && catData && catData.length > 0) {
        const mappedCats: Category[] = catData.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          icon: c.icon || 'restaurant',
          count: 0,
          imageUrl: c.image_url,
          match: c.name,
        }));
        set({ categories: mappedCats });
      }

      // 3. Setup Supabase Realtime Subscription once
      if (!realtimeSubscribed) {
        realtimeSubscribed = true;
        supabase
          .channel('mobile:public:dishes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'dishes' },
            (payload) => {
              const currentDishes = get().dishes;
              if (payload.eventType === 'UPDATE') {
                const updatedDish = mapDishRow(payload.new);
                set({
                  dishes: currentDishes.map((d) =>
                    d.id === updatedDish.id ? updatedDish : d
                  ),
                });
              } else if (payload.eventType === 'INSERT') {
                const newDish = mapDishRow(payload.new);
                set({ dishes: [newDish, ...currentDishes] });
              } else if (payload.eventType === 'DELETE') {
                set({
                  dishes: currentDishes.filter((d) => d.id !== String(payload.old.id)),
                });
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              set({ isRealtimeConnected: true });
            }
          });
      }

      set({ isLoading: false });
    } catch (e) {
      console.warn('Failed to load menu from Supabase, using fallback:', e);
      set({ isLoading: false });
    }
  },

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

  toggleDishStock: async (dishId: string) => {
    const current = get().dishes.find((d) => d.id === dishId);
    if (!current) return;
    const newStock = !current.inStock;

    // Optimistic update
    set((state) => ({
      dishes: state.dishes.map((d) =>
        d.id === dishId ? { ...d, inStock: newStock } : d
      ),
    }));

    try {
      await supabase
        .from('dishes')
        .update({ in_stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', dishId);
    } catch (e) {
      console.error('Failed to toggle dish stock in Supabase:', e);
    }
  },

  getFilteredDishes: () => {
    const { dishes, selectedCategoryId, categories, searchQuery, selectedSpiceFilter, onlyChefSpecial } = get();

    return dishes.filter((dish) => {
      // Category filter
      if (selectedCategoryId !== 'all') {
        const cat = categories.find((c) => c.id === selectedCategoryId);
        if (cat) {
          const catNameLower = cat.name.toLowerCase();
          const dishCatLower = (dish.category || '').toLowerCase();
          const dishNameLower = dish.name.toLowerCase();
          const matches =
            dishCatLower.includes(catNameLower) ||
            catNameLower.includes(dishCatLower) ||
            (cat.match && new RegExp(cat.match, 'i').test(dish.name));
          if (!matches) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = dish.name.toLowerCase().includes(q);
        const matchDesc = (dish.description || '').toLowerCase().includes(q);
        const matchCat = (dish.category || '').toLowerCase().includes(q);
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
