import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useOrderStore } from '@/store/useOrderStore';
import { useMenuStore } from '@/store/useMenuStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRoleStore } from '@/store/useRoleStore';
import { Dish, Order, PaymentMethod } from '@/types';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function POSTerminalScreen() {
  const router = useRouter();
  const { orders, placeOrder, updatePaymentStatus, updateOrderStatus } = useOrderStore();
  const { dishes, categories } = useMenuStore();
  const { user, logout } = useAuthStore();
  const { setRole } = useRoleStore();

  // POS State
  const [posMode, setPosMode] = useState<'register' | 'orders'>('register');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchQ, setSearchQ] = useState<string>('');
  const [posCart, setPosCart] = useState<{ dish: Dish; qty: number }[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('Table 01');
  const [customerName, setCustomerName] = useState<string>('Walk-in Customer');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Receipt Modal
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const filteredDishes = dishes.filter((d) => {
    if (selectedCat !== 'all' && !d.category.toLowerCase().includes(selectedCat.toLowerCase())) {
      return false;
    }
    if (searchQ && !d.name.toLowerCase().includes(searchQ.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleAddToCart = (dish: Dish) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setPosCart((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish.id === dish.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { dish, qty: 1 }];
    });
  };

  const handleUpdateQty = (dishId: string, delta: number) => {
    setPosCart((prev) =>
      prev
        .map((item) => {
          if (item.dish.id === dishId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { dish: Dish; qty: number }[]
    );
  };

  const handleClearPosCart = () => {
    setPosCart([]);
  };

  // Math
  const subtotal = posCart.reduce((sum, item) => sum + item.dish.price * item.qty, 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const tax = Math.round((subtotal - discountAmount) * 0.05);
  const total = Math.max(0, subtotal - discountAmount + tax);

  const handleChargeAndPrint = () => {
    if (posCart.length === 0) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const cartItems = posCart.map((item) => ({
      cartItemId: `pos-${item.dish.id}-${Date.now()}`,
      dish: item.dish,
      quantity: item.qty,
      portion: { id: 'regular', name: 'Regular Portion', priceDelta: 0, serves: '1 Person' },
      spiceLevel: item.dish.spiceLevel,
      selectedAddons: [],
      unitPrice: item.dish.price,
      totalPrice: item.dish.price * item.qty,
    }));

    const newOrder = placeOrder({
      type: 'dine_in',
      tableNumber: selectedTable || 'Table 01',
      customerName: customerName.trim() || 'Walk-in Guest',
      items: cartItems,
      paymentMethod: selectedPayment,
      subtotal,
      tax,
      serviceFee: 0,
      deliveryFee: 0,
      discount: discountAmount,
      total,
      specialNotes: 'Counter Walk-in Order',
    });

    updatePaymentStatus(newOrder.id, 'paid');
    setReceiptOrder(newOrder);
    setPosCart([]);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Sign out of Staff account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {}
            logout();
            router.replace('/auth/signin' as any);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.navBar}>
        <View style={styles.brandRow}>
          <View style={styles.posBadge}>
            <Ionicons name="calculator" size={16} color={Colors.textLight} />
          </View>
          <View>
            <Text style={styles.navTitle}>POS Cashier Register</Text>
            <Text style={styles.navSub}>{user?.name || 'Tariq Khan'} • Terminal #01</Text>
          </View>
        </View>

        <View style={styles.navActionsRow}>
          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => {
              setRole('kds');
              router.push('/staff/kds' as any);
            }}
            hitSlop={6}
          >
            <Ionicons name="flame-outline" size={15} color={Colors.textSecondary} />
            <Text style={styles.actionPillText}>Kitchen KDS</Text>
          </TouchableOpacity>

          {user?.role === 'owner' && (
            <TouchableOpacity
              style={styles.actionPill}
              onPress={() => {
                setRole('owner');
                router.push('/staff/owner' as any);
              }}
              hitSlop={6}
            >
              <Ionicons name="stats-chart-outline" size={15} color={Colors.textSecondary} />
              <Text style={styles.actionPillText}>Owner</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleSignOut}
            hitSlop={6}
          >
            <Ionicons name="log-out-outline" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Mode Selector */}
      <View style={styles.modeTabBar}>
        <TouchableOpacity
          style={[styles.modeTabBtn, posMode === 'register' && styles.modeTabBtnActive]}
          onPress={() => setPosMode('register')}
        >
          <Text style={[styles.modeTabText, posMode === 'register' && styles.modeTabTextActive]}>
            Register
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTabBtn, posMode === 'orders' && styles.modeTabBtnActive]}
          onPress={() => setPosMode('orders')}
        >
          <Text style={[styles.modeTabText, posMode === 'orders' && styles.modeTabTextActive]}>
            Active Orders ({orders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {posMode === 'register' ? (
        <View style={styles.registerContainer}>
          {/* Top Search & Category Pills */}
          <View style={styles.filterSection}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search dishes to ring up..."
                placeholderTextColor={Colors.textMuted}
                value={searchQ}
                onChangeText={setSearchQ}
              />
              {searchQ ? (
                <TouchableOpacity onPress={() => setSearchQ('')}>
                  <Ionicons name="close-circle" size={15} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catScroll}
            >
              <TouchableOpacity
                style={[styles.catPill, selectedCat === 'all' && styles.catPillActive]}
                onPress={() => setSelectedCat('all')}
              >
                <Text style={[styles.catPillText, selectedCat === 'all' && styles.catPillTextActive]}>
                  All ({dishes.length})
                </Text>
              </TouchableOpacity>

              {categories.slice(1, 6).map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.catPill, selectedCat === c.name && styles.catPillActive]}
                  onPress={() => setSelectedCat(c.name)}
                >
                  <Text style={[styles.catPillText, selectedCat === c.name && styles.catPillTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Dual Area: Dish Grid & Cart Panel */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentScrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Dish Selection Grid */}
            <View style={styles.dishGridSection}>
              <Text style={styles.sectionHeading}>Tap items to ring up:</Text>
              <View style={styles.dishGrid}>
                {filteredDishes.slice(0, 16).map((dish) => {
                  const inCart = posCart.find((p) => p.dish.id === dish.id);
                  return (
                    <TouchableOpacity
                      key={dish.id}
                      style={[styles.dishCard, inCart && styles.dishCardActive]}
                      onPress={() => handleAddToCart(dish)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.dishCardName} numberOfLines={2}>
                        {dish.name}
                      </Text>
                      <View style={styles.dishCardBottom}>
                        <Text style={styles.dishCardPrice}>{dish.formattedPrice}</Text>
                        {inCart ? (
                          <View style={styles.dishCountBadge}>
                            <Text style={styles.dishCountText}>{inCart.qty}</Text>
                          </View>
                        ) : (
                          <Ionicons name="add-circle-outline" size={18} color={Colors.textSecondary} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Current Tab / Register Cart */}
            <View style={styles.registerCartCard}>
              <View style={styles.cartHeaderRow}>
                <View style={styles.cartMetaLeft}>
                  <Text style={styles.cartHeaderTitle}>Current Ticket</Text>
                  <TextInput
                    style={styles.tableInput}
                    value={selectedTable}
                    onChangeText={setSelectedTable}
                    placeholder="Table #"
                  />
                  <TextInput
                    style={styles.guestInput}
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Guest name"
                  />
                </View>

                {posCart.length > 0 && (
                  <TouchableOpacity onPress={handleClearPosCart} hitSlop={6}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              {posCart.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <Ionicons name="cart-outline" size={24} color={Colors.textMuted} />
                  <Text style={styles.emptyCartText}>No items added yet</Text>
                </View>
              ) : (
                <View style={styles.cartItemList}>
                  {posCart.map((item) => (
                    <View key={item.dish.id} style={styles.cartItemRow}>
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName} numberOfLines={1}>
                          {item.dish.name}
                        </Text>
                        <Text style={styles.cartItemUnit}>₱{item.dish.price} each</Text>
                      </View>

                      <View style={styles.stepperBox}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => handleUpdateQty(item.dish.id, -1)}
                        >
                          <Ionicons name="remove" size={14} color={Colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.qty}</Text>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => handleUpdateQty(item.dish.id, 1)}
                        >
                          <Ionicons name="add" size={14} color={Colors.text} />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.cartItemPrice}>
                        ₱{(item.dish.price * item.qty).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Discount Selector */}
              <View style={styles.discountRow}>
                <Text style={styles.discountLabel}>Discount:</Text>
                <View style={styles.discountBtns}>
                  {[0, 10, 20].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.discBtn, discountPercent === d && styles.discBtnActive]}
                      onPress={() => setDiscountPercent(d)}
                    >
                      <Text style={[styles.discBtnText, discountPercent === d && styles.discBtnTextActive]}>
                        {d === 0 ? 'None' : `${d}%`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Payment Method Selector */}
              <View style={styles.payMethodRow}>
                {(['cash', 'gcash', 'card'] as PaymentMethod[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.payMethodBtn, selectedPayment === m && styles.payMethodBtnActive]}
                    onPress={() => setSelectedPayment(m)}
                  >
                    <Text style={[styles.payMethodText, selectedPayment === m && styles.payMethodTextActive]}>
                      {m === 'cash' ? 'Cash' : m === 'gcash' ? 'GCash' : 'Card'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Totals Breakdown */}
              <View style={styles.mathBreakdown}>
                <View style={styles.mathRow}>
                  <Text style={styles.mathLabel}>Subtotal</Text>
                  <Text style={styles.mathVal}>₱{subtotal.toLocaleString()}</Text>
                </View>

                {discountAmount > 0 && (
                  <View style={styles.mathRow}>
                    <Text style={styles.mathLabel}>Discount ({discountPercent}%)</Text>
                    <Text style={styles.discountVal}>-₱{discountAmount.toLocaleString()}</Text>
                  </View>
                )}

                <View style={styles.mathRow}>
                  <Text style={styles.mathLabel}>Tax & VAT (5%)</Text>
                  <Text style={styles.mathVal}>₱{tax.toLocaleString()}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Grand Total</Text>
                  <Text style={styles.totalVal}>₱{total.toLocaleString()}</Text>
                </View>
              </View>

              {/* Charge Action Button */}
              <TouchableOpacity
                style={[styles.chargeBtn, posCart.length === 0 && styles.chargeBtnDisabled]}
                onPress={handleChargeAndPrint}
                disabled={posCart.length === 0}
                activeOpacity={0.88}
              >
                <Text style={styles.chargeBtnText}>
                  Charge ₱{total.toLocaleString()} & Send to Kitchen
                </Text>
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      ) : (
        /* Orders History Tab */
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.ordersScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {orders.map((o) => (
            <View key={o.id} style={styles.orderHistoryCard}>
              <View style={styles.orderHistoryHeader}>
                <View>
                  <Text style={styles.orderNum}>{o.orderNumber}</Text>
                  <Text style={styles.orderSub}>
                    {o.customerName} • {o.tableNumber || (o.type === 'delivery' ? 'Delivery' : 'Takeout')}
                  </Text>
                </View>

                <View style={styles.orderHeaderRight}>
                  <Text style={styles.orderHistoryTotal}>₱{o.total.toLocaleString()}</Text>
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidBadgeText}>{o.paymentStatus.toUpperCase()}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.orderItemsPreview}>
                {o.items.map((it) => `${it.quantity}x ${it.dish.name}`).join(', ')}
              </Text>

              <View style={styles.orderActionsRow}>
                <TouchableOpacity
                  style={styles.receiptActionBtn}
                  onPress={() => setReceiptOrder(o)}
                >
                  <Ionicons name="receipt-outline" size={14} color={Colors.text} />
                  <Text style={styles.receiptActionText}>View Receipt</Text>
                </TouchableOpacity>

                {o.status !== 'completed' && (
                  <TouchableOpacity
                    style={styles.completeOrderBtn}
                    onPress={() => updateOrderStatus(o.id, 'completed')}
                  >
                    <Text style={styles.completeOrderText}>Mark Completed</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Digital Receipt Modal */}
      <Modal visible={!!receiptOrder} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.receiptModalCard}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptRestaurantTitle}>Hasan's Flavors</Text>
              <Text style={styles.receiptSub}>Authentic Halal Cuisine</Text>
              <Text style={styles.receiptMeta}>
                Order: {receiptOrder?.orderNumber} • {receiptOrder?.tableNumber || 'Takeout'}
              </Text>
              <Text style={styles.receiptDate}>
                {receiptOrder ? new Date(receiptOrder.createdAt).toLocaleString() : ''}
              </Text>
            </View>

            <View style={styles.receiptDivider} />

            <ScrollView style={styles.receiptItemsScroll}>
              {receiptOrder?.items.map((it, idx) => (
                <View key={idx} style={styles.receiptItemRow}>
                  <Text style={styles.receiptItemQty}>{it.quantity}x</Text>
                  <Text style={styles.receiptItemName}>{it.dish.name}</Text>
                  <Text style={styles.receiptItemPrice}>₱{it.totalPrice.toLocaleString()}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.receiptDivider} />

            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalLabel}>PAID ({receiptOrder?.paymentMethod.toUpperCase()})</Text>
              <Text style={styles.receiptTotalValue}>₱{receiptOrder?.total.toLocaleString()}</Text>
            </View>

            <TouchableOpacity
              style={styles.closeReceiptBtn}
              onPress={() => setReceiptOrder(null)}
            >
              <Text style={styles.closeReceiptBtnText}>Done / Close Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  posBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  navSub: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  navActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  actionPillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  logoutBtn: {
    padding: 6,
  },
  modeTabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
  },
  modeTabBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  modeTabBtnActive: {
    borderBottomColor: Colors.text,
  },
  modeTabText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  modeTabTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  registerContainer: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: Colors.text,
  },
  catScroll: {
    gap: 6,
  },
  catPill: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catPillActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  catPillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  catPillTextActive: {
    color: Colors.textLight,
    fontWeight: '600',
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollContainer: {
    padding: Spacing.lg,
    paddingBottom: 90,
    gap: Spacing.md,
  },
  dishGridSection: {
    gap: 6,
  },
  sectionHeading: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dishGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dishCard: {
    width: (width - 48) / 2,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'space-between',
    minHeight: 72,
    ...Shadows.subtle,
  },
  dishCardActive: {
    borderColor: Colors.text,
    backgroundColor: Colors.surface,
  },
  dishCardName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  dishCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  dishCardPrice: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  dishCountBadge: {
    backgroundColor: Colors.text,
    borderRadius: Radius.round,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishCountText: {
    color: Colors.textLight,
    fontSize: 10,
    fontWeight: '700',
  },
  registerCartCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing.sm,
  },
  cartMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cartHeaderTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  tableInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    color: Colors.text,
    width: 70,
  },
  guestInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    color: Colors.text,
    flex: 1,
  },
  clearText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    fontWeight: '500',
  },
  emptyCartBox: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  emptyCartText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  cartItemList: {
    gap: 8,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.text,
  },
  cartItemUnit: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  qtyText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 16,
    textAlign: 'center',
  },
  cartItemPrice: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 50,
    textAlign: 'right',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  discountLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  discountBtns: {
    flexDirection: 'row',
    gap: 4,
  },
  discBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  discBtnActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  discBtnText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  discBtnTextActive: {
    color: Colors.textLight,
    fontWeight: '600',
  },
  payMethodRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  payMethodBtn: {
    flex: 1,
    paddingVertical: 7,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  payMethodBtnActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  payMethodText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  payMethodTextActive: {
    color: Colors.textLight,
    fontWeight: '600',
  },
  mathBreakdown: {
    gap: 4,
    paddingTop: 4,
  },
  mathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mathLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  mathVal: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text,
  },
  discountVal: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  totalVal: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  chargeBtn: {
    backgroundColor: Colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.md,
    gap: 6,
    marginTop: 4,
  },
  chargeBtnDisabled: {
    opacity: 0.5,
  },
  chargeBtnText: {
    color: Colors.textLight,
    fontWeight: '600',
    fontSize: Typography.fontSize.sm,
  },
  ordersScrollContent: {
    padding: Spacing.lg,
    paddingBottom: 90,
    gap: Spacing.md,
  },
  orderHistoryCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
    ...Shadows.subtle,
  },
  orderHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNum: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  orderSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  orderHeaderRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  orderHistoryTotal: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  paidBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  paidBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.halalGreen,
  },
  orderItemsPreview: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginVertical: 4,
  },
  orderActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  receiptActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    gap: 4,
  },
  receiptActionText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.text,
  },
  completeOrderBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.text,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  completeOrderText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textLight,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  receiptModalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.elevated,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  receiptRestaurantTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  receiptSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  receiptMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 6,
  },
  receiptDate: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  receiptItemsScroll: {
    maxHeight: 180,
  },
  receiptItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  receiptItemQty: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 20,
  },
  receiptItemName: {
    flex: 1,
    fontSize: 11,
    color: Colors.text,
  },
  receiptItemPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  receiptTotalLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  receiptTotalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  closeReceiptBtn: {
    backgroundColor: Colors.text,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  closeReceiptBtnText: {
    color: Colors.textLight,
    fontWeight: '600',
    fontSize: Typography.fontSize.sm,
  },
});
