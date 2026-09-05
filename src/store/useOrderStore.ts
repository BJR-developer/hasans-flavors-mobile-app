import { create } from 'zustand';
import { DailyStats, Order, OrderStatus, PaymentMethod, PaymentStatus, CartItem } from '@/types';
import { supabase } from '@/lib/supabase';

const mapOrderRow = (row: any): Order => ({
  id: String(row.id),
  orderNumber: row.order_number,
  type: row.type || 'dine_in',
  tableNumber: row.table_number || undefined,
  customerName: row.customer_name || 'Diner',
  customerPhone: row.customer_phone || undefined,
  deliveryAddress: row.notes || undefined,
  items: Array.isArray(row.items) ? row.items : [],
  subtotal: Number(row.subtotal || 0),
  tax: Number(row.tax || 0),
  serviceFee: 0,
  deliveryFee: Number(row.delivery_fee || 0),
  discount: 0,
  total: Number(row.total || 0),
  status: row.status as OrderStatus,
  paymentMethod: row.payment_method as PaymentMethod,
  paymentStatus: row.payment_status as PaymentStatus,
  createdAt: row.created_at,
  estimatedMinutes: 20,
  specialNotes: row.notes || undefined,
});

export interface PlaceOrderParams {
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
}

interface OrderState {
  orders: Order[];
  activeFilter: OrderStatus | 'all';
  searchQuery: string;
  selectedOrder: Order | null;
  activeOrderId: string | null;
  isLoading: boolean;

  // Actions
  fetchOrders: () => Promise<void>;
  placeOrder: (params: PlaceOrderParams) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updatePaymentStatus: (orderId: string, paymentStatus: PaymentStatus, method?: PaymentMethod) => Promise<void>;
  setActiveOrder: (orderId: string | null) => void;
  setActiveFilter: (filter: OrderStatus | 'all') => void;
  setSearchQuery: (query: string) => void;
  setSelectedOrder: (order: Order | null) => void;
  getOrderById: (orderId: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getFilteredOrders: () => Order[];
  getDailyStats: () => DailyStats;
  getStats: () => DailyStats;
}

let realtimeSubscribed = false;

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  activeFilter: 'all',
  searchQuery: '',
  selectedOrder: null,
  activeOrderId: null,
  isLoading: false,

  fetchOrders: async () => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map(mapOrderRow);
        set({
          orders: mapped,
          activeOrderId: mapped[0]?.id || null,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      // Realtime subscription
      if (!realtimeSubscribed) {
        realtimeSubscribed = true;
        supabase
          .channel('mobile:public:orders')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            (payload) => {
              const currentOrders = get().orders;
              if (payload.eventType === 'INSERT') {
                const newOrder = mapOrderRow(payload.new);
                set({ orders: [newOrder, ...currentOrders] });
              } else if (payload.eventType === 'UPDATE') {
                const updatedOrder = mapOrderRow(payload.new);
                set({
                  orders: currentOrders.map((o) =>
                    o.id === updatedOrder.id ? updatedOrder : o
                  ),
                });
                if (get().selectedOrder?.id === updatedOrder.id) {
                  set({ selectedOrder: updatedOrder });
                }
              } else if (payload.eventType === 'DELETE') {
                set({
                  orders: currentOrders.filter((o) => o.id !== String(payload.old.id)),
                });
              }
            }
          )
          .subscribe();
      }
    } catch (e) {
      console.warn('Error fetching orders from Supabase:', e);
      set({ isLoading: false });
    }
  },

  placeOrder: (params: PlaceOrderParams): Order => {
    const newSeq = 8820 + get().orders.length + 1;
    const newOrder: Order = {
      id: `ord_${Date.now()}`,
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

    // Optimistically update store
    set((state) => ({
      orders: [newOrder, ...state.orders],
      activeOrderId: newOrder.id,
      selectedOrder: newOrder,
    }));

    // Async push to Supabase
    const dbPayload = {
      id: newOrder.id,
      order_number: newOrder.orderNumber,
      customer_name: newOrder.customerName,
      customer_phone: newOrder.customerPhone || null,
      table_number: newOrder.tableNumber || null,
      type: newOrder.type,
      status: newOrder.status,
      payment_status: newOrder.paymentStatus,
      payment_method: newOrder.paymentMethod,
      subtotal: newOrder.subtotal,
      tax: newOrder.tax,
      delivery_fee: newOrder.deliveryFee || 0,
      total: newOrder.total,
      notes: newOrder.specialNotes || newOrder.deliveryAddress || null,
      items: newOrder.items,
      created_at: newOrder.createdAt,
      updated_at: new Date().toISOString(),
    };

    supabase
      .from('orders')
      .insert(dbPayload)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to sync order to Supabase:', error);
        }
      });

    return newOrder;
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    }));

    try {
      await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    } catch (e) {
      console.error('Failed to update order status:', e);
    }
  },

  updatePaymentStatus: async (orderId: string, paymentStatus: PaymentStatus, method?: PaymentMethod) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? { ...o, paymentStatus, ...(method ? { paymentMethod: method } : {}) }
          : o
      ),
    }));

    try {
      const updates: any = { payment_status: paymentStatus, updated_at: new Date().toISOString() };
      if (method) updates.payment_method = method;
      await supabase.from('orders').update(updates).eq('id', orderId);
    } catch (e) {
      console.error('Failed to update payment status:', e);
    }
  },

  setActiveOrder: (orderId: string | null) => {
    set({ activeOrderId: orderId });
  },

  setActiveFilter: (filter) => {
    set({ activeFilter: filter });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSelectedOrder: (order) => {
    set({ selectedOrder: order });
  },

  getOrderById: (orderId) => {
    return get().orders.find((o) => o.id === orderId || o.orderNumber === orderId);
  },

  getOrdersByStatus: (status: OrderStatus) => {
    return get().orders.filter((o) => o.status === status);
  },

  getFilteredOrders: () => {
    const { orders, activeFilter, searchQuery } = get();

    return orders.filter((order) => {
      if (activeFilter !== 'all' && order.status !== activeFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = order.orderNumber.toLowerCase().includes(q);
        const matchCustomer = order.customerName.toLowerCase().includes(q);
        const matchTable = (order.tableNumber || '').toLowerCase().includes(q);
        const matchItems = order.items.some((i) => i.dish.name.toLowerCase().includes(q));

        if (!matchNum && !matchCustomer && !matchTable && !matchItems) {
          return false;
        }
      }

      return true;
    });
  },

  getDailyStats: () => {
    const { orders } = get();
    const paidOrders = orders.filter((o) => o.paymentStatus === 'paid' && o.status !== 'cancelled');
    const todayRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

    const activeTables = new Set(
      orders
        .filter((o) => o.type === 'dine_in' && (o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'))
        .map((o) => o.tableNumber)
        .filter(Boolean)
    ).size;

    // Calculate dynamic top selling dishes from real orders
    const dishSales: Record<string, { name: string; sold: number; revenue: number }> = {};
    orders.forEach((o) => {
      if (o.status === 'cancelled') return;
      (o.items || []).forEach((item) => {
        const name = item.dish?.name;
        if (!name) return;
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
      activeTables: activeTables || 0,
      avgPrepTimeMinutes: 18,
      topSellingItems,
    };
  },

  getStats: () => {
    return get().getDailyStats();
  },
}));
