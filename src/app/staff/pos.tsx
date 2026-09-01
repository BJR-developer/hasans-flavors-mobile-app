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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useOrderStore } from '@/store/useOrderStore';
import { useMenuStore } from '@/store/useMenuStore';
import { useRoleStore } from '@/store/useRoleStore';
import { Dish, Order, PaymentMethod, PaymentStatus } from '@/types';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function POSTerminalScreen() {
  const router = useRouter();
  const { orders, placeOrder, updatePaymentStatus, updateOrderStatus } = useOrderStore();
  const { dishes, categories } = useMenuStore();
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
      tableNumber: selectedTable,
      customerName: customerName || 'Walk-in Guest',
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top POS Header */}
      <View style={styles.posNavBar}>
        <View style={styles.navLeft}>
          <View style={styles.posIconCircle}>
            <Ionicons name="calculator" size={20} color={Colors.textLight} />
          </View>
          <View>
            <Text style={styles.posNavTitle}>Cashier POS Register</Text>
            <Text style={styles.posNavSub}>Terminal #01 • Cashier: Staff 04</Text>
          </View>
        </View>

        <View style={styles.navRight}>
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeToggleBtn, posMode === 'register' && styles.modeToggleBtnActive]}
              onPress={() => setPosMode('register')}
            >
              <Text
                style={[
                  styles.modeToggleText,
                  posMode === 'register' && styles.modeToggleTextActive,
                ]}
              >
                Register
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeToggleBtn, posMode === 'orders' && styles.modeToggleBtnActive]}
              onPress={() => setPosMode('orders')}
            >
              <Text
                style={[
                  styles.modeToggleText,
                  posMode === 'orders' && styles.modeToggleTextActive,
                ]}
              >
                Orders ({orders.length})
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => {
              setRole('customer');
              router.replace('/(tabs)' as any);
            }}
          >
            <Ionicons name="exit-outline" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {posMode === 'register' ? (
        <View style={styles.mainLayout}>
          {/* Left Column: Menu Items Grid */}
          <View style={styles.leftCol}>
            {/* Search & Category Pills */}
            <View style={styles.searchCategoryBar}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Quick search dishes..."
                  placeholderTextColor={Colors.textMuted}
                  value={searchQ}
                  onChangeText={setSearchQ}
                />
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

                {['Biryani', 'Curries', 'Snacks', 'Veg', 'Breads'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.catPill, selectedCat === c && styles.catPillActive]}
                    onPress={() => setSelectedCat(c)}
                  >
                    <Text style={[styles.catPillText, selectedCat === c && styles.catPillTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Quick Dish Grid */}
            <ScrollView
              style={styles.dishGridScroll}
              contentContainerStyle={styles.dishGridContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredDishes.map((dish) => (
                <TouchableOpacity
                  key={dish.id}
                  style={styles.posDishBtn}
                  onPress={() => handleAddToCart(dish)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.posDishName} numberOfLines={2}>
                    {dish.name}
                  </Text>
                  <View style={styles.posDishBottom}>
                    <Text style={styles.posDishPrice}>{dish.formattedPrice}</Text>
                    <View style={styles.posAddCircle}>
                      <Ionicons name="add" size={14} color={Colors.textLight} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Right Column: Register Bill & Payment */}
          <View style={styles.rightCol}>
            {/* Table & Guest Selector Header */}
            <View style={styles.cartMetaRow}>
              <View style={styles.tableSelectorBox}>
                <Ionicons name="restaurant-outline" size={14} color={Colors.primary} />
                <TextInput
                  style={styles.tableInput}
                  value={selectedTable}
                  onChangeText={setSelectedTable}
                  placeholder="Table"
                />
              </View>
              <TextInput
                style={styles.guestInput}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Guest"
              />
            </View>

            {/* Cart Items List */}
            <ScrollView style={styles.posCartList} showsVerticalScrollIndicator={false}>
              {posCart.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <Ionicons name="cart-outline" size={32} color={Colors.textMuted} />
                  <Text style={styles.emptyCartText}>Tap dishes to add to tab</Text>
                </View>
              ) : (
                posCart.map((item) => (
                  <View key={item.dish.id} style={styles.posCartItemRow}>
                    <View style={styles.cartItemTextCol}>
                      <Text style={styles.cartItemName} numberOfLines={1}>
                        {item.dish.name}
                      </Text>
                      <Text style={styles.cartItemUnit}>₱{item.dish.price} each</Text>
                    </View>

                    <View style={styles.qtyControl}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => handleUpdateQty(item.dish.id, -1)}
                      >
                        <Ionicons name="remove" size={14} color={Colors.text} />
                      </TouchableOpacity>
                      <Text style={styles.qtyVal}>{item.qty}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => handleUpdateQty(item.dish.id, 1)}
                      >
                        <Ionicons name="add" size={14} color={Colors.text} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.cartItemTotal}>
                      ₱{(item.dish.price * item.qty).toLocaleString()}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Discount & Math Summary */}
            <View style={styles.posSummaryCard}>
              <View style={styles.discountRow}>
                <Text style={styles.summaryLabel}>Discount:</Text>
                <View style={styles.discountBtns}>
                  {[0, 10, 20].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.discPill, discountPercent === d && styles.discPillActive]}
                      onPress={() => setDiscountPercent(d)}
                    >
                      <Text
                        style={[
                          styles.discPillText,
                          discountPercent === d && styles.discPillTextActive,
                        ]}
                      >
                        {d === 0 ? 'None' : `${d}%`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.posMathRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₱{subtotal.toLocaleString()}</Text>
              </View>

              {discountAmount > 0 && (
                <View style={styles.posMathRow}>
                  <Text style={styles.summaryLabel}>Discount ({discountPercent}%)</Text>
                  <Text style={styles.summaryDiscount}>-₱{discountAmount.toLocaleString()}</Text>
                </View>
              )}

              <View style={styles.posMathRow}>
                <Text style={styles.summaryLabel}>Tax & VAT (5%)</Text>
                <Text style={styles.summaryValue}>₱{tax.toLocaleString()}</Text>
              </View>

              <View style={styles.totalDivider} />

              <View style={styles.posTotalRow}>
                <Text style={styles.posTotalLabel}>TOTAL</Text>
                <Text style={styles.posTotalValue}>₱{total.toLocaleString()}</Text>
              </View>

              {/* Payment Method Selector */}
              <View style={styles.payMethodRow}>
                {(['cash', 'gcash', 'card'] as PaymentMethod[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.payMethodBtn, selectedPayment === m && styles.payMethodBtnActive]}
                    onPress={() => setSelectedPayment(m)}
                  >
                    <Text
                      style={[
                        styles.payMethodText,
                        selectedPayment === m && styles.payMethodTextActive,
                      ]}
                    >
                      {m.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.posActionRow}>
                <TouchableOpacity style={styles.clearBtn} onPress={handleClearPosCart}>
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chargeBtn, posCart.length === 0 && styles.chargeBtnDisabled]}
                  onPress={handleChargeAndPrint}
                  disabled={posCart.length === 0}
                >
                  <Text style={styles.chargeBtnText}>Charge ₱{total.toLocaleString()} & Receipt</Text>
                  <Ionicons name="receipt-outline" size={18} color={Colors.textLight} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ) : (
        /* Orders & Open Tabs Table View */
        <ScrollView style={styles.ordersTableContainer} contentContainerStyle={styles.ordersTableContent}>
          <Text style={styles.tableHeaderSectionTitle}>Active Restaurant Orders & Bills</Text>

          {orders.map((o) => (
            <View key={o.id} style={styles.posOrderRow}>
              <View style={styles.posOrderLeft}>
                <View style={styles.posOrderNumberRow}>
                  <Text style={styles.posOrderNum}>{o.orderNumber}</Text>
                  <View style={styles.posTableTag}>
                    <Text style={styles.posTableTagText}>{o.tableNumber || 'Delivery'}</Text>
                  </View>
                </View>
                <Text style={styles.posCustomerName}>{o.customerName}</Text>
                <Text style={styles.posItemsOverview}>
                  {o.items.map((i) => `${i.quantity}x ${i.dish.name}`).join(', ')}
                </Text>
              </View>

              <View style={styles.posOrderRight}>
                <Text style={styles.posOrderTotal}>₱{o.total.toLocaleString()}</Text>
                <View
                  style={[
                    styles.payStatusBadge,
                    o.paymentStatus === 'paid' ? styles.paidBadge : styles.unpaidBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.payStatusText,
                      o.paymentStatus === 'paid' ? styles.paidText : styles.unpaidText,
                    ]}
                  >
                    {o.paymentStatus.toUpperCase()} ({o.paymentMethod.toUpperCase()})
                  </Text>
                </View>

                {o.paymentStatus === 'unpaid' ? (
                  <TouchableOpacity
                    style={styles.markPaidBtn}
                    onPress={() => {
                      updatePaymentStatus(o.id, 'paid');
                      try {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      } catch {}
                    }}
                  >
                    <Text style={styles.markPaidBtnText}>Mark Paid ✓</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.viewReceiptBtn}
                    onPress={() => setReceiptOrder(o)}
                  >
                    <Text style={styles.viewReceiptBtnText}>Receipt 📄</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Digital Receipt Modal */}
      {receiptOrder && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setReceiptOrder(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.receiptPaper}>
              {/* Receipt Header */}
              <View style={styles.receiptHeader}>
                <Text style={styles.receiptBrand}>HASAN'S FLAVORS</Text>
                <Text style={styles.receiptSub}>Authentic Halal Cuisine</Text>
                <Text style={styles.receiptSub}>Makati City • www.halalfood.com.ph</Text>
                <Text style={styles.receiptDashedLine}>--------------------------------</Text>
              </View>

              {/* Metadata */}
              <View style={styles.receiptMeta}>
                <Text style={styles.receiptMetaText}>Order: {receiptOrder.orderNumber}</Text>
                <Text style={styles.receiptMetaText}>
                  Date: {new Date(receiptOrder.createdAt).toLocaleString()}
                </Text>
                <Text style={styles.receiptMetaText}>Table: {receiptOrder.tableNumber || 'Takeout/Delivery'}</Text>
                <Text style={styles.receiptMetaText}>Cashier: Staff 04</Text>
                <Text style={styles.receiptDashedLine}>--------------------------------</Text>
              </View>

              {/* Items */}
              <View style={styles.receiptItemsList}>
                {receiptOrder.items.map((it, idx) => (
                  <View key={idx} style={styles.receiptItemRow}>
                    <Text style={styles.receiptItemName} numberOfLines={1}>
                      {it.quantity}x {it.dish.name}
                    </Text>
                    <Text style={styles.receiptItemPrice}>₱{it.totalPrice.toLocaleString()}</Text>
                  </View>
                ))}
                <Text style={styles.receiptDashedLine}>--------------------------------</Text>
              </View>

              {/* Totals */}
              <View style={styles.receiptTotals}>
                <View style={styles.receiptTotalRow}>
                  <Text style={styles.receiptTotalLabel}>Subtotal:</Text>
                  <Text style={styles.receiptTotalVal}>₱{receiptOrder.subtotal.toLocaleString()}</Text>
                </View>
                <View style={styles.receiptTotalRow}>
                  <Text style={styles.receiptTotalLabel}>Tax & VAT (5%):</Text>
                  <Text style={styles.receiptTotalVal}>₱{receiptOrder.tax.toLocaleString()}</Text>
                </View>
                <View style={styles.receiptTotalRow}>
                  <Text style={styles.receiptGrandLabel}>GRAND TOTAL:</Text>
                  <Text style={styles.receiptGrandVal}>₱{receiptOrder.total.toLocaleString()}</Text>
                </View>
                <View style={styles.receiptTotalRow}>
                  <Text style={styles.receiptTotalLabel}>Payment Method:</Text>
                  <Text style={styles.receiptTotalVal}>{receiptOrder.paymentMethod.toUpperCase()} (PAID)</Text>
                </View>
              </View>

              {/* Barcode Mock */}
              <View style={styles.barcodeBox}>
                <Text style={styles.barcodeText}>||| | |||| | |||||| || |||| | |||</Text>
                <Text style={styles.thankYouText}>Thank you for dining with us!</Text>
              </View>

              <TouchableOpacity
                style={styles.closeReceiptBtn}
                onPress={() => setReceiptOrder(null)}
              >
                <Text style={styles.closeReceiptText}>Close & Print Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F3F0',
  },
  posNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadows.subtle,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  posIconCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  posNavTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
  },
  posNavSub: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#EAE8E3',
    borderRadius: Radius.sm,
    padding: 2,
  },
  modeToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  modeToggleBtnActive: {
    backgroundColor: Colors.card,
    ...Shadows.subtle,
  },
  modeToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  modeToggleTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  exitBtn: {
    padding: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: Radius.sm,
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  leftCol: {
    flex: 1.2,
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
    backgroundColor: '#FAF9F8',
  },
  searchCategoryBar: {
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    height: 36,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
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
    backgroundColor: Colors.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catPillActive: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  catPillTextActive: {
    color: Colors.textLight,
  },
  dishGridScroll: {
    flex: 1,
  },
  dishGridContent: {
    padding: Spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  posDishBtn: {
    width: (width > 600 ? 160 : 105),
    height: 90,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'space-between',
    ...Shadows.subtle,
  },
  posDishName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 14,
  },
  posDishBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  posDishPrice: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
    color: Colors.primary,
  },
  posAddCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightCol: {
    flex: 1,
    backgroundColor: Colors.card,
    display: 'flex',
    flexDirection: 'column',
  },
  cartMetaRow: {
    flexDirection: 'row',
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 6,
  },
  tableSelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F8',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 4,
    height: 30,
    gap: 2,
  },
  tableInput: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text,
    width: 46,
    padding: 0,
  },
  guestInput: {
    flex: 1,
    backgroundColor: '#FAF9F8',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    fontSize: 10,
    color: Colors.text,
    height: 30,
    paddingVertical: 0,
  },
  posCartList: {
    flex: 1,
    padding: Spacing.sm,
  },
  emptyCartBox: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCartText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  posCartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cartItemTextCol: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  cartItemUnit: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F8',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 6,
  },
  qtyBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyVal: {
    fontSize: 11,
    fontWeight: '800',
    minWidth: 18,
    textAlign: 'center',
  },
  cartItemTotal: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.text,
    minWidth: 45,
    textAlign: 'right',
  },
  posSummaryCard: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    padding: Spacing.sm,
    backgroundColor: '#FAF9F8',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  discountBtns: {
    flexDirection: 'row',
    gap: 4,
  },
  discPill: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  discPillActive: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },
  discPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  discPillTextActive: {
    color: Colors.textLight,
  },
  posMathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryDiscount: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.halalGreen,
  },
  totalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  posTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  posTotalLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '900',
    color: Colors.text,
  },
  posTotalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '900',
    color: Colors.primary,
  },
  payMethodRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  payMethodBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  payMethodBtnActive: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },
  payMethodText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  payMethodTextActive: {
    color: Colors.textLight,
  },
  posActionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  clearBtn: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  chargeBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.sm,
    gap: 6,
  },
  chargeBtnDisabled: {
    opacity: 0.5,
  },
  chargeBtnText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontSize: 11,
  },
  ordersTableContainer: {
    flex: 1,
  },
  ordersTableContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  tableHeaderSectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  posOrderRow: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.subtle,
  },
  posOrderLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  posOrderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  posOrderNum: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    color: Colors.text,
  },
  posTableTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  posTableTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.halalGreenDark,
  },
  posCustomerName: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  posItemsOverview: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  posOrderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  posOrderTotal: {
    fontSize: Typography.fontSize.md,
    fontWeight: '900',
    color: Colors.primary,
  },
  payStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  paidBadge: {
    backgroundColor: '#E8F5E9',
  },
  unpaidBadge: {
    backgroundColor: '#FFEBEE',
  },
  payStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  paidText: {
    color: Colors.halalGreenDark,
  },
  unpaidText: {
    color: Colors.error,
  },
  markPaidBtn: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  markPaidBtnText: {
    color: Colors.textLight,
    fontSize: 10,
    fontWeight: '700',
  },
  viewReceiptBtn: {
    backgroundColor: '#F0EFEA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  viewReceiptBtnText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  receiptPaper: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadows.floating,
  },
  receiptHeader: {
    alignItems: 'center',
  },
  receiptBrand: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  receiptSub: {
    fontSize: 10,
    color: '#555',
  },
  receiptDashedLine: {
    color: '#888',
    marginVertical: 4,
  },
  receiptMeta: {
    gap: 2,
  },
  receiptMetaText: {
    fontSize: 11,
    color: '#333',
  },
  receiptItemsList: {
    gap: 4,
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptItemName: {
    fontSize: 11,
    color: '#111',
    flex: 1,
  },
  receiptItemPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111',
  },
  receiptTotals: {
    gap: 4,
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptTotalLabel: {
    fontSize: 11,
    color: '#555',
  },
  receiptTotalVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111',
  },
  receiptGrandLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '900',
    color: '#000',
  },
  receiptGrandVal: {
    fontSize: Typography.fontSize.md,
    fontWeight: '900',
    color: '#000',
  },
  barcodeBox: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  barcodeText: {
    fontFamily: 'Courier',
    fontSize: 16,
    letterSpacing: 2,
    color: '#111',
  },
  thankYouText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  closeReceiptBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  closeReceiptText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontSize: Typography.fontSize.xs,
  },
});
