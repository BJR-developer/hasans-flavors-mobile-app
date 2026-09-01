import { create } from 'zustand';
import { AddonOption, CartItem, Dish, PortionOption } from '@/types';
import { PORTION_OPTIONS, PROMO_CODES } from '@/data/options';

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  discountAmount: number;
  deliveryType: 'dine_in' | 'delivery' | 'takeout';
  
  // Actions
  addItem: (
    dish: Dish,
    quantity?: number,
    portion?: PortionOption,
    spiceLevel?: number,
    addons?: AddonOption[],
    specialNotes?: string
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  setDeliveryType: (type: 'dine_in' | 'delivery' | 'takeout') => void;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;

  // Computed Getters
  getItemCount: () => number;
  getSubtotal: () => number;
  getTax: () => number;
  getDeliveryFee: () => number;
  getServiceFee: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  promoCode: null,
  discountAmount: 0,
  deliveryType: 'delivery',

  addItem: (dish, quantity = 1, portion, spiceLevel = 2, addons = [], specialNotes = '') => {
    const selectedPortion = portion || PORTION_OPTIONS[0];
    const unitPrice = dish.price + selectedPortion.priceDelta + addons.reduce((sum, a) => sum + a.price, 0);
    const totalPrice = unitPrice * quantity;

    const cartItemId = `${dish.id}-${selectedPortion.id}-spice${spiceLevel}-${addons.map(a => a.id).sort().join('_')}`;

    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...state.items];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPrice: existing.unitPrice * newQty,
          specialNotes: specialNotes || existing.specialNotes,
        };
        return { items: updated };
      } else {
        const newItem: CartItem = {
          cartItemId,
          dish,
          quantity,
          portion: selectedPortion,
          spiceLevel,
          selectedAddons: addons,
          specialNotes,
          unitPrice,
          totalPrice,
        };
        return { items: [...state.items, newItem] };
      }
    });
  },

  removeItem: (cartItemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.cartItemId !== cartItemId),
    }));
  },

  updateQuantity: (cartItemId, delta) => {
    set((state) => {
      const updated = state.items
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
      return { items: updated };
    });
  },

  clearCart: () => {
    set({ items: [], promoCode: null, discountAmount: 0 });
  },

  setDeliveryType: (type) => {
    set({ deliveryType: type });
  },

  applyPromoCode: (code) => {
    const clean = code.trim().toUpperCase();
    const discount = PROMO_CODES[clean];
    if (discount !== undefined) {
      const subtotal = get().getSubtotal();
      let calculatedDiscount = 0;
      if (discount < 1) {
        calculatedDiscount = Math.round(subtotal * discount);
      } else {
        calculatedDiscount = Math.min(discount, subtotal);
      }
      set({ promoCode: clean, discountAmount: calculatedDiscount });
      return { success: true, message: `Promo code ${clean} applied!` };
    }
    return { success: false, message: 'Invalid promo code' };
  },

  removePromoCode: () => {
    set({ promoCode: null, discountAmount: 0 });
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.totalPrice, 0);
  },

  getTax: () => {
    return Math.round(get().getSubtotal() * 0.05); // 5% local tax/vat
  },

  getDeliveryFee: () => {
    const { deliveryType } = get();
    if (deliveryType === 'delivery') {
      const subtotal = get().getSubtotal();
      return subtotal >= 1000 ? 0 : 75; // Free delivery over ₱1000
    }
    return 0;
  },

  getServiceFee: () => {
    const { deliveryType } = get();
    if (deliveryType === 'dine_in') {
      return Math.round(get().getSubtotal() * 0.05); // 5% dine-in service charge
    }
    return 0;
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const tax = get().getTax();
    const delivery = get().getDeliveryFee();
    const service = get().getServiceFee();
    const discount = get().discountAmount;
    return Math.max(0, subtotal + tax + delivery + service - discount);
  },
}));
