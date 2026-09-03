import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  useWindowDimensions,
  Alert,
  Platform,
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

export default function POSTerminalScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isLargeDesktop = width >= 1100;

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
  const [customerName, setCustomerName] = useState<string>('Walk-in Guest');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Digital Receipt Modal
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Filter dishes
  const filteredDishes = useMemo(() => {
    return dishes.filter((d) => {
      if (selectedCat !== 'all' && !d.category.toLowerCase().includes(selectedCat.toLowerCase())) {
        return false;
      }
      if (searchQ && !d.name.toLowerCase().includes(searchQ.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [dishes, selectedCat, searchQ]);

  // Cart operations
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

  // Calculations
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
      specialNotes: 'Counter POS Order',
    });

    updatePaymentStatus(newOrder.id, 'paid');
    setReceiptOrder(newOrder);
    setPosCart([]);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Sign out of Staff terminal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/auth/signin' as any);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Navbar */}
      <View style={styles.navBar}>
        <View style={styles.brandRow}>
          <View style={styles.posBadge}>
            <Ionicons name="calculator" size={16} color={Colors.textLight} />
          </View>
          <View>
            <Text style={styles.navTitle}>POS Cashier Terminal</Text>
            <Text style={styles.navSub}>{user?.name || 'Staff User'} • Register #01</Text>
          </View>
        </View>

        {/* Mode Switcher */}
        <View style={styles.navCenterToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, posMode === 'register' && styles.toggleBtnActive]}
            onPress={() => setPosMode('register')}
          >
            <Ionicons
              name="keypad-outline"
              size={14}
              color={posMode === 'register' ? Colors.textLight : Colors.textSecondary}
            />
            <Text style={[styles.toggleBtnText, posMode === 'register' && styles.toggleBtnTextActive]}>
              Register
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, posMode === 'orders' && styles.toggleBtnActive]}
            onPress={() => setPosMode('orders')}
          >
            <Ionicons
              name="receipt-outline"
              size={14}
              color={posMode === 'orders' ? Colors.textLight : Colors.textSecondary}
            />
            <Text style={[styles.toggleBtnText, posMode === 'orders' && styles.toggleBtnTextActive]}>
              Orders ({orders.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Nav Actions */}
        <View style={styles.navActionsRow}>
          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => {
              setRole('kds');
              router.push('/staff/kds' as any);
            }}
          >
            <Ionicons name="flame-outline" size={14} color={Colors.primary} />
            <Text style={styles.actionPillText}>KDS</Text>
          </TouchableOpacity>

          {user?.role === 'owner' && (
            <TouchableOpacity
              style={styles.actionPill}
              onPress={() => {
                setRole('owner');
                router.push('/staff/owner' as any);
              }}
            >
              <Ionicons name="stats-chart-outline" size={14} color={Colors.halalGreen} />
              <Text style={styles.actionPillText}>Owner</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* POS Content Body */}
      {posMode === 'register' ? (
        <View style={[styles.mainLayout, isDesktop ? styles.desktopLayout : styles.mobileLayout]}>
          {/* LEFT: Menu Catalog & Categories */}
          <View style={[styles.catalogPane, isDesktop && styles.desktopCatalogPane]}>
            {/* Search & Category Filter */}
            <View style={styles.catalogFilterBar}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={15} color={Colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Quick search dishes..."
                  placeholderTextColor={Colors.textMuted}
                  value={searchQ}
                  onChangeText={setSearchQ}
                />
                {searchQ ? (
                  <TouchableOpacity onPress={() => setSearchQ('')}>
                    <Ionicons name="close-circle" size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                <TouchableOpacity
                  style={[styles.catPill, selectedCat === 'all' && styles.catPillActive]}
                  onPress={() => setSelectedCat('all')}
                >
                  <Text style={[styles.catPillText, selectedCat === 'all' && styles.catPillTextActive]}>
                    All ({dishes.length})
                  </Text>
                </TouchableOpacity>

                {categories.slice(1).map((c) => (
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

            {/* Dish Grid */}
            <ScrollView
              style={styles.dishGridScroll}
              contentContainerStyle={styles.dishGridContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.dishGridWrapper}>
                {filteredDishes.map((dish) => {
                  const inCart = posCart.find((p) => p.dish.id === dish.id);
                  return (
                    <TouchableOpacity
                      key={dish.id}
                      style={[
                        styles.dishCard,
                        isLargeDesktop
                          ? styles.dishCard4Col
                          : isDesktop
                          ? styles.dishCard3Col
                          : styles.dishCard2Col,
                        inCart && styles.dishCardActive,
                        !dish.inStock && styles.dishCardOutOfStock,
                      ]}
                      onPress={() => dish.inStock && handleAddToCart(dish)}
                      activeOpacity={0.8}
                      disabled={!dish.inStock}
                    >
                      <View style={styles.dishTopRow}>
                        <Text style={styles.dishCategoryTag} numberOfLines={1}>
                          {dish.category}
                        </Text>
                        {inCart && (
                          <View style={styles.dishBadgeCount}>
                            <Text style={styles.dishBadgeText}>{inCart.qty}</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.dishName} numberOfLines={2}>
                        {dish.name}
                      </Text>

                      <View style={styles.dishFooterRow}>
                        <Text style={styles.dishPrice}>{dish.formattedPrice}</Text>
                        {dish.inStock ? (
                          <View style={styles.dishAddIcon}>
                            <Ionicons name="add" size={14} color={Colors.textLight} />
                          </View>
                        ) : (
                          <Text style={styles.outOfStockText}>Out</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* RIGHT: Ticket Builder & Register Checkout */}
          <View style={[styles.ticketPane, isDesktop && styles.desktopTicketPane]}>
            {/* Ticket Header & Table Selector */}
            <View style={styles.ticketHeader}>
              <View style={styles.ticketMetaInputs}>
                <View style={styles.tableInputWrapper}>
                  <Ionicons name="restaurant-outline" size={13} color={Colors.primary} />
                  <TextInput
                    style={styles.tableInput}
                    value={selectedTable}
                    onChangeText={setSelectedTable}
                    placeholder="Table #"
                  />
                </View>
                <TextInput
                  style={styles.guestInput}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Guest name"
                />
              </View>

              {posCart.length > 0 && (
                <TouchableOpacity onPress={handleClearPosCart} hitSlop={6}>
                  <Text style={styles.clearTicketText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Cart Items List */}
            <ScrollView style={styles.cartItemsScroll} showsVerticalScrollIndicator={false}>
              {posCart.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <Ionicons name="bag-outline" size={28} color={Colors.textMuted} />
                  <Text style={styles.emptyCartTitle}>No items on ticket</Text>
                  <Text style={styles.emptyCartSub}>Tap dishes on the catalog to ring up</Text>
                </View>
              ) : (
                <View style={styles.cartItemsList}>
                  {posCart.map((item) => (
                    <View key={item.dish.id} style={styles.cartItemRow}>
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName} numberOfLines={1}>
                          {item.dish.name}
                        </Text>
                        <Text style={styles.cartItemUnit}>₱{item.dish.price} each</Text>
                      </View>

                      {/* Stepper */}
                      <View style={styles.stepperBox}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleUpdateQty(item.dish.id, -1)}
                        >
                          <Ionicons name="remove" size={13} color={Colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.stepperQty}>{item.qty}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleUpdateQty(item.dish.id, 1)}
                        >
                          <Ionicons name="add" size={13} color={Colors.text} />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.cartItemTotal}>
                        ₱{(item.dish.price * item.qty).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Discount & Payment Configuration */}
            <View style={styles.ticketFooterSection}>
              {/* Discount Row */}
              <View style={styles.discountRow}>
                <Text style={styles.sectionSmallLabel}>Discount:</Text>
                <View style={styles.discountPillsRow}>
                  {[0, 10, 20].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.discPill, discountPercent === d && styles.discPillActive]}
                      onPress={() => setDiscountPercent(d)}
                    >
                      <Text style={[styles.discPillText, discountPercent === d && styles.discPillTextActive]}>
                        {d === 0 ? 'None' : `${d}%`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Payment Methods */}
              <View style={styles.payMethodsRow}>
                {(['cash', 'gcash', 'card'] as PaymentMethod[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.payBtn, selectedPayment === m && styles.payBtnActive]}
                    onPress={() => setSelectedPayment(m)}
                  >
                    <Ionicons
                      name={
                        m === 'cash' ? 'cash-outline' : m === 'gcash' ? 'qr-code-outline' : 'card-outline'
                      }
                      size={14}
                      color={selectedPayment === m ? Colors.textLight : Colors.textSecondary}
                    />
                    <Text style={[styles.payBtnText, selectedPayment === m && styles.payBtnTextActive]}>
                      {m === 'cash' ? 'Cash' : m === 'gcash' ? 'GCash' : 'Card'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Math Totals */}
              <View style={styles.totalsBox}>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Subtotal</Text>
                  <Text style={styles.totalsVal}>₱{subtotal.toLocaleString()}</Text>
                </View>
                {discountAmount > 0 && (
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>Discount ({discountPercent}%)</Text>
                    <Text style={styles.totalsDiscount}>-₱{discountAmount.toLocaleString()}</Text>
                  </View>
                )}
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Tax & VAT (5%)</Text>
                  <Text style={styles.totalsVal}>₱{tax.toLocaleString()}</Text>
                </View>
                <View style={styles.totalsDivider} />
                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLabel}>Grand Total</Text>
                  <Text style={styles.grandTotalVal}>₱{total.toLocaleString()}</Text>
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
                  Charge ₱{total.toLocaleString()} & Send Order
                </Text>
                <Ionicons name="checkmark-circle-outline" size={17} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        /* Orders History Tab */
        <ScrollView
          style={styles.ordersScroll}
          contentContainerStyle={styles.ordersScrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.ordersGrid}>
            {orders.map((o) => (
              <View
                key={o.id}
                style={[
                  styles.orderHistoryCard,
                  isDesktop && styles.orderHistoryCardDesktop,
                ]}
              >
                <View style={styles.orderHistoryHeader}>
                  <View>
                    <Text style={styles.orderNum}>{o.orderNumber}</Text>
                    <Text style={styles.orderSub}>
                      {o.customerName} • {o.tableNumber || (o.type === 'delivery' ? 'Delivery' : 'Takeout')}
                    </Text>
                  </View>
                  <View style={styles.orderRightMeta}>
                    <Text style={styles.orderHistoryTotal}>₱{o.total.toLocaleString()}</Text>
                    <View style={styles.paidTag}>
                      <Text style={styles.paidTagText}>{o.paymentStatus.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.orderItemsSummary}>
                  {o.items.map((it) => `${it.quantity}x ${it.dish.name}`).join(', ')}
                </Text>

                <View style={styles.orderActionsRow}>
                  <TouchableOpacity
                    style={styles.orderReceiptBtn}
                    onPress={() => setReceiptOrder(o)}
                  >
                    <Ionicons name="receipt-outline" size={14} color={Colors.primary} />
                    <Text style={styles.orderReceiptText}>Receipt</Text>
                  </TouchableOpacity>

                  {o.status !== 'completed' && (
                    <TouchableOpacity
                      style={styles.orderCompleteBtn}
                      onPress={() => updateOrderStatus(o.id, 'completed')}
                    >
                      <Text style={styles.orderCompleteText}>Complete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Digital Receipt Modal */}
      <Modal visible={!!receiptOrder} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptBrandTitle}>Hasan's Flavors</Text>
              <Text style={styles.receiptBrandSub}>Authentic Halal Cuisine</Text>
              <Text style={styles.receiptOrderMeta}>
                Order #{receiptOrder?.orderNumber} • {receiptOrder?.tableNumber || 'Takeout'}
              </Text>
              <Text style={styles.receiptDate}>
                {receiptOrder ? new Date(receiptOrder.createdAt).toLocaleString() : ''}
              </Text>
            </View>

            <View style={styles.receiptDivider} />

            <ScrollView style={styles.receiptItemsScroll}>
              {receiptOrder?.items.map((it, idx) => (
                <View key={idx} style={styles.receiptRow}>
                  <Text style={styles.receiptQty}>{it.quantity}x</Text>
                  <Text style={styles.receiptName}>{it.dish.name}</Text>
                  <Text style={styles.receiptPrice}>₱{it.totalPrice.toLocaleString()}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.receiptDivider} />

            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalLabel}>
                PAID ({receiptOrder?.paymentMethod.toUpperCase()})
              </Text>
              <Text style={styles.receiptTotalVal}>₱{receiptOrder?.total.toLocaleString()}</Text>
            </View>

            <TouchableOpacity
              style={styles.closeReceiptBtn}
              onPress={() => setReceiptOrder(null)}
            >
              <Text style={styles.closeReceiptText}>Close / Next Transaction</Text>
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
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  posBadge: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  navSub: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  navCenterToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.xs,
    gap: 5,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: Colors.textLight,
    fontWeight: '700',
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
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  logoutBtn: {
    padding: 6,
  },
  mainLayout: {
    flex: 1,
  },
  desktopLayout: {
    flexDirection: 'row',
  },
  mobileLayout: {
    flexDirection: 'column',
  },
  catalogPane: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  desktopCatalogPane: {
    flex: 0.65,
  },
  catalogFilterBar: {
    padding: Spacing.md,
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
  categoryScroll: {
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
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  catPillTextActive: {
    color: Colors.textLight,
    fontWeight: '700',
  },
  dishGridScroll: {
    flex: 1,
  },
  dishGridContent: {
    padding: Spacing.md,
  },
  dishGridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dishCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'space-between',
    minHeight: 88,
    ...Shadows.subtle,
  },
  dishCard2Col: {
    width: '48.5%',
  },
  dishCard3Col: {
    width: '31.8%',
  },
  dishCard4Col: {
    width: '23.8%',
  },
  dishCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  dishCardOutOfStock: {
    opacity: 0.5,
  },
  dishTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dishCategoryTag: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
    flex: 1,
  },
  dishBadgeCount: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.round,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishBadgeText: {
    color: Colors.textLight,
    fontSize: 10,
    fontWeight: '700',
  },
  dishName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 16,
  },
  dishFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dishPrice: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  dishAddIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    fontSize: 10,
    color: Colors.error,
    fontWeight: '600',
  },
  ticketPane: {
    backgroundColor: Colors.card,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  desktopTicketPane: {
    flex: 0.35,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  ticketMetaInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  tableInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xs,
    paddingHorizontal: 6,
    gap: 4,
  },
  tableInput: {
    fontSize: 11,
    color: Colors.text,
    width: 60,
    paddingVertical: 3,
    fontWeight: '600',
  },
  guestInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    color: Colors.text,
    flex: 1,
  },
  clearTicketText: {
    fontSize: 11,
    color: Colors.error,
    fontWeight: '600',
  },
  cartItemsScroll: {
    flex: 1,
    maxHeight: 280,
  },
  emptyCartBox: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptyCartTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  emptyCartSub: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  cartItemsList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 8,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
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
  stepperBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  stepperQty: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 16,
    textAlign: 'center',
  },
  cartItemTotal: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 46,
    textAlign: 'right',
  },
  ticketFooterSection: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
    gap: 8,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionSmallLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  discountPillsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  discPill: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  discPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  discPillText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  discPillTextActive: {
    color: Colors.textLight,
    fontWeight: '700',
  },
  payMethodsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  payBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  payBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  payBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  payBtnTextActive: {
    color: Colors.textLight,
    fontWeight: '700',
  },
  totalsBox: {
    gap: 3,
    paddingTop: 2,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalsLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  totalsVal: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text,
  },
  totalsDiscount: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  totalsDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 3,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  grandTotalVal: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.primary,
  },
  chargeBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: Radius.md,
    gap: 6,
  },
  chargeBtnDisabled: {
    opacity: 0.45,
  },
  chargeBtnText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.xs,
  },
  ordersScroll: {
    flex: 1,
  },
  ordersScrollContainer: {
    padding: Spacing.md,
  },
  ordersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  orderHistoryCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    ...Shadows.subtle,
  },
  orderHistoryCardDesktop: {
    width: '49%',
  },
  orderHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderNum: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  orderSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  orderRightMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  orderHistoryTotal: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
    color: Colors.primary,
  },
  paidTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  paidTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.halalGreen,
  },
  orderItemsSummary: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  orderActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 6,
  },
  orderReceiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    borderRadius: Radius.xs,
    gap: 4,
  },
  orderReceiptText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  orderCompleteBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    borderRadius: Radius.xs,
  },
  orderCompleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  receiptCard: {
    width: Platform.OS === 'web' ? 380 : '100%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.elevated,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  receiptBrandTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
  },
  receiptBrandSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  receiptOrderMeta: {
    fontSize: 11,
    fontWeight: '700',
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
    marginVertical: Spacing.sm,
  },
  receiptItemsScroll: {
    maxHeight: 160,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    gap: 6,
  },
  receiptQty: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    width: 20,
  },
  receiptName: {
    flex: 1,
    fontSize: 11,
    color: Colors.text,
  },
  receiptPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  receiptTotalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  receiptTotalVal: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.primary,
  },
  closeReceiptBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  closeReceiptText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.xs,
  },
});
