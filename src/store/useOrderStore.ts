import { create } from 'zustand';
import { DailyStats, Order, OrderStatus, PaymentMethod, PaymentStatus } from '@/types';
import { CartItem } from '@/types';

const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: '#HF-8821',
    type: 'dine_in',
    tableNumber: 'Table 04',
    customerName: 'Ahmad Al-Mansoor',
    customerPhone: '+63 917 555 1290',
    items: [
      {
        cartItemId: 'mock-1',
        dish: {
          id: '4066',
          name: 'Chicken Biryani Bilao – Good for 8 People',
          slug: 'chicken-biryani-bilao',
          price: 1100,
          formattedPrice: '₱1,100',
          category: 'Rice & Biryani',
          description: 'Special fragrant basmati with tender marinated chicken and boiled eggs.',
          imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop',
          spiceLevel: 3,
          isHalal: true,
          isChefSpecial: true,
          isPopular: true,
          inStock: true,
          preparationTime: '20-25 mins',
          calories: '650 kcal',
          rating: '4.9',
          reviewCount: 120,
        },
        quantity: 1,
        portion: { id: 'family', name: 'Family Platter / Bilao', priceDelta: 0, serves: '8 People' },
        spiceLevel: 3,
        selectedAddons: [
          { id: 'raitha', name: 'Extra Mint Cucumber Raitha', price: 45 },
          { id: 'gulab', name: 'Gulab Jamun Dessert (2 pcs)', price: 75 },
        ],
        specialNotes: 'Extra spicy on the side',
        unitPrice: 1220,
        totalPrice: 1220,
      },
    ],
    subtotal: 1220,
    tax: 61,
    serviceFee: 61,
    deliveryFee: 0,
    discount: 0,
    total: 1342,
    status: 'preparing',
    paymentMethod: 'gcash',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    estimatedMinutes: 20,
    specialNotes: 'VIP Guest, cutlery for 4',
  },
  {
    id: 'ord-102',
    orderNumber: '#HF-8822',
    type: 'delivery',
    customerName: 'Fatima Z.',
    customerPhone: '+63 928 443 8912',
    deliveryAddress: 'Unit 402, Greenbelt Residences, Makati City',
    items: [
      {
        cartItemId: 'mock-2',
        dish: {
          id: '4070',
          name: 'Crunchy Bite – Full Spicy Meat Roll',
          slug: 'crunchy-bite-meat',
          price: 280,
          formattedPrice: '₱280',
          category: 'Snacks & Street Bites',
          description: 'Crispy flaky paratha wrapped around spiced tender meat chunks.',
          imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop',
          spiceLevel: 3,
          isHalal: true,
          isChefSpecial: false,
          isPopular: true,
          inStock: true,
          preparationTime: '10-15 mins',
          calories: '480 kcal',
          rating: '4.8',
          reviewCount: 65,
        },
        quantity: 2,
        portion: { id: 'regular', name: 'Regular Portion', priceDelta: 0, serves: '1 Person' },
        spiceLevel: 2,
        selectedAddons: [],
        unitPrice: 280,
        totalPrice: 560,
      },
    ],
    subtotal: 560,
    tax: 28,
    serviceFee: 0,
    deliveryFee: 75,
    discount: 50,
    total: 613,
    status: 'pending',
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    estimatedMinutes: 30,
    specialNotes: 'Leave at front desk with security guard.',
  },
  {
    id: 'ord-103',
    orderNumber: '#HF-8820',
    type: 'dine_in',
    tableNumber: 'Table 07',
    customerName: 'Rashid Khan',
    customerPhone: '+63 919 123 9876',
    items: [
      {
        cartItemId: 'mock-3',
        dish: {
          id: '4075',
          name: 'Chicken Haleem & Paratha Combo',
          slug: 'chicken-haleem',
          price: 340,
          formattedPrice: '₱340',
          category: 'Non-Veg Curries & Specials',
          description: 'Slow-cooked lentil and meat stew with aromatic spices, ginger, and fried onions.',
          imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800&auto=format&fit=crop',
          spiceLevel: 2,
          isHalal: true,
          isChefSpecial: true,
          isPopular: true,
          inStock: true,
          preparationTime: '15 mins',
          calories: '520 kcal',
          rating: '4.9',
          reviewCount: 94,
        },
        quantity: 2,
        portion: { id: 'regular', name: 'Regular Portion', priceDelta: 0, serves: '1 Person' },
        spiceLevel: 2,
        selectedAddons: [{ id: 'roti', name: 'Fresh Hot Tandoori Roti', price: 35 }],
        unitPrice: 375,
        totalPrice: 750,
      },
    ],
    subtotal: 750,
    tax: 37,
    serviceFee: 37,
    deliveryFee: 0,
    discount: 0,
    total: 824,
    status: 'ready',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    estimatedMinutes: 20,
    specialNotes: 'Served to table',
  },
];

interface OrderState {
  orders: Order[];
  activeOrderId: string | null;

  // Actions
  placeOrder: (params: {
    type: 'dine_in' | 'delivery' | 'takeout';
    items: CartItem[];
    customerName: string;
    customerPhone?: string;
    deliveryAddress?: string;
    tableNumber?: string;
    paymentMethod: PaymentMethod;
    subtotal: number;
    tax: number;
    serviceFee: number;
    deliveryFee: number;
    discount: number;
    total: number;
    specialNotes?: string;
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  setActiveOrder: (orderId: string | null) => void;
  getOrderById: (orderId: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getDailyStats: () => DailyStats;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: INITIAL_MOCK_ORDERS,
  activeOrderId: 'ord-101',

  placeOrder: (params) => {
    const newSeq = 8820 + get().orders.length + 1;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `#HF-${newSeq}`,
      type: params.type,
      tableNumber: params.tableNumber,
      customerName: params.customerName || 'Valued Guest',
      customerPhone: params.customerPhone,
      deliveryAddress: params.deliveryAddress,
      items: params.items,
      subtotal: params.subtotal,
      tax: params.tax,
      serviceFee: params.serviceFee,
      deliveryFee: params.deliveryFee,
      discount: params.discount,
      total: params.total,
      status: 'pending',
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentMethod === 'cash' ? 'unpaid' : 'paid',
      createdAt: new Date().toISOString(),
      estimatedMinutes: params.type === 'delivery' ? 35 : 20,
      specialNotes: params.specialNotes,
    };

    set((state) => ({
      orders: [newOrder, ...state.orders],
      activeOrderId: newOrder.id,
    }));

    return newOrder;
  },

  updateOrderStatus: (orderId, status) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    }));
  },

  updatePaymentStatus: (orderId, status) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, paymentStatus: status } : o)),
    }));
  },

  setActiveOrder: (orderId) => {
    set({ activeOrderId: orderId });
  },

  getOrderById: (orderId) => {
    return get().orders.find((o) => o.id === orderId);
  },

  getOrdersByStatus: (status) => {
    return get().orders.filter((o) => o.status === status);
  },

  getDailyStats: () => {
    const orders = get().orders;
    const todayRevenue = orders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);

    const activeTables = new Set(
      orders
        .filter((o) => o.type === 'dine_in' && (o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'))
        .map((o) => o.tableNumber)
        .filter(Boolean)
    ).size;

    // Calculate top selling
    const dishSales: Record<string, { name: string; sold: number; revenue: number }> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const name = item.dish.name;
        if (!dishSales[name]) {
          dishSales[name] = { name, sold: 0, revenue: 0 };
        }
        dishSales[name].sold += item.quantity;
        dishSales[name].revenue += item.totalPrice;
      });
    });

    const topSellingItems = Object.values(dishSales)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    return {
      todayRevenue,
      orderCount: orders.length,
      activeTables,
      avgPrepTimeMinutes: 18,
      topSellingItems,
    };
  },
}));
