export interface Dish {
  id: string;
  name: string;
  slug: string;
  price: number;
  formattedPrice: string;
  category: string;
  description: string;
  imageUrl: string;
  spiceLevel: number; // 1 (Mild) to 4 (Fiery)
  isHalal: boolean;
  isChefSpecial: boolean;
  isPopular: boolean;
  inStock: boolean;
  preparationTime: string;
  calories: string;
  rating: string;
  reviewCount: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  match?: string;
  imageUrl?: string;
}

export interface PortionOption {
  id: string;
  name: string;
  priceDelta: number;
  serves: string;
}

export interface AddonOption {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  cartItemId: string;
  dish: Dish;
  quantity: number;
  portion: PortionOption;
  spiceLevel: number;
  selectedAddons: AddonOption[];
  specialNotes?: string;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type DeliveryType = 'dine_in' | 'delivery' | 'takeout';
export type PaymentMethod = 'cash' | 'gcash' | 'maya' | 'card';
export type UserRole = 'customer' | 'staff' | 'kds' | 'owner';

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  title: string;
  description: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryType: DeliveryType;
  tableNumber?: string;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  orderNotes?: string;
  estimatedTime: string;
  createdAt: string;
  timeline: OrderTimeline[];
}
