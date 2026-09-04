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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useOrderStore } from '@/store/useOrderStore';
import { useMenuStore } from '@/store/useMenuStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRoleStore } from '@/store/useRoleStore';
import { Dish, Order, OrderType } from '@/types';
import * as Haptics from 'expo-haptics';

const CASH_PRESETS = [100, 200, 500, 1000, 2000];

export default function POSTerminalScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isLargeDesktop = width >= 1100;

  const { orders, placeOrder, updateOrderStatus } = useOrderStore();
  const { dishes, categories } = useMenuStore();
  const { user, logout } = useAuthStore();
  const { setRole } = useRoleStore();

  // Mode & Filters
  const [posMode, setPosMode] = useState<'register' | 'orders'>('register');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchQ, setSearchQ] = useState<string>('');

  // Cart & Order details
  const [posCart, setPosCart] = useState<{ dish: Dish; qty: number }[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [selectedTable, setSelectedTable] = useState<string>('Table 01');
  const [customerName, setCustomerName] = useState<string>('Walk-in Guest');
  const [cashTendered, setCashTendered] = useState<string>('');

  // Digital Receipt Modal
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Filtered dishes with image support
  const filteredDishes = useMemo(() => {
    return dishes.filter((d) => {
      // Category filter matching
      if (selectedCatId !== 'all') {
        const cat = categories.find((c) => c.id === selectedCatId);
        if (cat && cat.match) {
          const reg = new RegExp(cat.match, 'i');
          const matches = reg.test(d.name) || reg.test(d.category);
          if (!matches) return false;
        }
      }
      if (searchQ.trim()) {
        const q = searchQ.trim().toLowerCase();
        const matches =
          d.name.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [dishes, selectedCatId, searchQ, categories]);

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
    setCashTendered('');
  };

  // Pure Math (Subtotal + 5% VAT, No discounts per user requirement)
  const subtotal = useMemo(
    () => posCart.reduce((sum, item) => sum + item.dish.price * item.qty, 0),
    [posCart]
  );
  const tax = useMemo(() => Math.round(subtotal * 0.05), [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  // Cash Calculation
  const tenderedNumber = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNumber - total);

  // Complete Payment & Show Receipt (Cash Only)
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
      type: orderType,
      tableNumber: orderType === 'dine_in' ? selectedTable || 'Table 01' : undefined,
      customerName: customerName.trim() || 'Walk-in Guest',
      items: cartItems,
      paymentMethod: 'cash',
      subtotal,
      tax,
      serviceFee: 0,
      deliveryFee: 0,
      discount: 0, // No discounts
      total,
      specialNotes: `Counter POS (Cash Only) • Cashier: ${user?.name || 'Staff'}`,
    });

    setReceiptOrder(newOrder);
    setPosCart([]);
    setCashTendered('');
  };

  // Browser / System Print
  const handlePrintReceipt = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    } else {
      Alert.alert('Print Order', 'Sending receipt to thermal receipt printer...');
    }
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
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.navLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.navTitle}>Hasan's POS Terminal</Text>
            <Text style={styles.navSub}>
              {user?.name || 'Staff Cashier'} • Register #01 • Cash Only • {dishes.length} Items
            </Text>
          </View>
        </View>

        {/* Mode Switcher */}
        <View style={styles.navCenterToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, posMode === 'register' && styles.toggleBtnActive]}
            onPress={() => setPosMode('register')}
          >
            <Ionicons
              name="keypad"
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
              name="receipt"
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
            <Ionicons name="flame" size={14} color={Colors.primary} />
            <Text style={styles.actionPillText}>Kitchen KDS</Text>
          </TouchableOpacity>

          {user?.role === 'owner' && (
            <TouchableOpacity
              style={styles.actionPill}
              onPress={() => {
                setRole('owner');
                router.push('/staff/owner' as any);
              }}
            >
              <Ionicons name="stats-chart" size={14} color={Colors.halalGreen} />
              <Text style={styles.actionPillText}>Owner</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut} hitSlop={8}>
            <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main POS Content */}
      {posMode === 'register' ? (
        <View style={[styles.mainLayout, isDesktop ? styles.desktopLayout : styles.mobileLayout]}>
          {/* LEFT: Menu Catalog & Categories */}
          <View style={[styles.catalogPane, isDesktop && styles.desktopCatalogPane]}>
            {/* Search & Category Filter */}
            <View style={styles.catalogFilterBar}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Quick search dishes or soft drinks..."
                  placeholderTextColor={Colors.textMuted}
                  value={searchQ}
                  onChangeText={setSearchQ}
                  autoCorrect={false}
                />
                {searchQ ? (
                  <TouchableOpacity onPress={() => setSearchQ('')} hitSlop={6}>
                    <Ionicons name="close-circle" size={15} color={Colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {categories.map((c) => {
                  const isActive = selectedCatId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.categoryCardItem}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {}
                        setSelectedCatId(c.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.categoryImageWrapper,
                          isActive && styles.categoryImageWrapperActive,
                        ]}
                      >
                        <Image
                          source={{
                            uri:
                              c.imageUrl ||
                              'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80',
                          }}
                          style={styles.categoryImage}
                          resizeMode="cover"
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryNameText,
                          isActive && styles.categoryNameTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Dish Catalog Grid with Item Images */}
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
                      {/* Dish Thumbnail Image */}
                      <View style={styles.dishImageWrapper}>
                        <Image
                          source={{ uri: dish.imageUrl }}
                          style={styles.dishImage}
                          resizeMode="cover"
                        />
                        {inCart && (
                          <View style={styles.dishBadgeCount}>
                            <Text style={styles.dishBadgeText}>{inCart.qty}</Text>
                          </View>
                        )}
                      </View>

                      {/* Info & Price */}
                      <View style={styles.dishDetails}>
                        <Text style={styles.dishCategoryTag} numberOfLines={1}>
                          {dish.category}
                        </Text>
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
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* RIGHT: Ticket Builder & Register Checkout */}
          <View style={[styles.ticketPane, isDesktop && styles.desktopTicketPane]}>
            {/* Order Type & Table Selector */}
            <View style={styles.ticketHeader}>
              <View style={styles.orderTypeTabs}>
                {(['dine_in', 'takeout', 'delivery'] as OrderType[]).map((type) => {
                  const isSelected = orderType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.orderTypeBtn, isSelected && styles.orderTypeBtnActive]}
                      onPress={() => setOrderType(type)}
                    >
                      <Ionicons
                        name={
                          type === 'dine_in'
                            ? 'restaurant-outline'
                            : type === 'takeout'
                            ? 'bag-handle-outline'
                            : 'bicycle-outline'
                        }
                        size={12}
                        color={isSelected ? Colors.textLight : Colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.orderTypeBtnText,
                          isSelected && styles.orderTypeBtnTextActive,
                        ]}
                      >
                        {type === 'dine_in' ? 'Dine In' : type === 'takeout' ? 'Takeout' : 'Delivery'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.ticketMetaInputs}>
                {orderType === 'dine_in' && (
                  <View style={styles.tableInputWrapper}>
                    <Ionicons name="restaurant" size={12} color={Colors.primary} />
                    <TextInput
                      style={styles.tableInput}
                      value={selectedTable}
                      onChangeText={setSelectedTable}
                      placeholder="Table #"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                )}
                <TextInput
                  style={styles.guestInput}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Guest name"
                  placeholderTextColor={Colors.textMuted}
                />
                {posCart.length > 0 && (
                  <TouchableOpacity onPress={handleClearPosCart} hitSlop={6}>
                    <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Cart Items List with Images */}
            <ScrollView style={styles.cartItemsScroll} showsVerticalScrollIndicator={false}>
              {posCart.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <Ionicons name="receipt-outline" size={32} color={Colors.textMuted} />
                  <Text style={styles.emptyCartTitle}>Ticket is empty</Text>
                  <Text style={styles.emptyCartSub}>Tap dishes on the catalog to ring up</Text>
                </View>
              ) : (
                <View style={styles.cartItemsList}>
                  {posCart.map((item) => (
                    <View key={item.dish.id} style={styles.cartItemRow}>
                      <Image
                        source={{ uri: item.dish.imageUrl }}
                        style={styles.cartItemThumb}
                        resizeMode="cover"
                      />
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

            {/* Bottom Checkout & Payment Section (Cash Only) */}
            <View style={styles.ticketFooterSection}>
              {/* Payment Method Badge (Cash Only) */}
              <View style={styles.cashOnlyBadgeRow}>
                <View style={styles.cashOnlyPill}>
                  <Ionicons name="cash" size={15} color={Colors.halalGreen} />
                  <Text style={styles.cashOnlyPillText}>CASH PAYMENT ONLY</Text>
                </View>
                <Text style={styles.cashOnlySubText}>Exact or Cash Change Supported</Text>
              </View>

              {/* Quick Cash Presets & Tendered Input */}
              <View style={styles.cashTenderBox}>
                <View style={styles.presetButtonsRow}>
                  <TouchableOpacity
                    style={styles.presetBtn}
                    onPress={() => setCashTendered(total.toString())}
                  >
                    <Text style={styles.presetBtnText}>Exact</Text>
                  </TouchableOpacity>
                  {CASH_PRESETS.map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={styles.presetBtn}
                      onPress={() => setCashTendered(amt.toString())}
                    >
                      <Text style={styles.presetBtnText}>₱{amt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.tenderInputRow}>
                  <Text style={styles.tenderLabel}>Tendered:</Text>
                  <View style={styles.tenderInputWrapper}>
                    <Text style={styles.pesoSymbol}>₱</Text>
                    <TextInput
                      style={styles.tenderInput}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={Colors.textMuted}
                      value={cashTendered}
                      onChangeText={setCashTendered}
                    />
                  </View>
                  <View style={styles.changeDueBox}>
                    <Text style={styles.changeDueLabel}>Change:</Text>
                    <Text style={styles.changeDueVal}>₱{changeDue.toLocaleString()}</Text>
                  </View>
                </View>
              </View>

              {/* Math Totals (No discounts) */}
              <View style={styles.totalsBox}>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Subtotal</Text>
                  <Text style={styles.totalsVal}>₱{subtotal.toLocaleString()}</Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Tax &amp; VAT (5%)</Text>
                  <Text style={styles.totalsVal}>₱{tax.toLocaleString()}</Text>
                </View>
                <View style={styles.totalsDivider} />
                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLabel}>Total Due</Text>
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
                  Cash ₱{total.toLocaleString()} &amp; Print Thermal Bill
                </Text>
                <Ionicons name="print-outline" size={17} color={Colors.textLight} />
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

                {/* Items breakdown with quantity */}
                <Text style={styles.orderItemsSummary}>
                  {o.items.map((it) => `${it.quantity}x ${it.dish.name}`).join(', ')}
                </Text>

                <View style={styles.orderActionsRow}>
                  <TouchableOpacity
                    style={styles.orderReceiptBtn}
                    onPress={() => setReceiptOrder(o)}
                  >
                    <Ionicons name="receipt-outline" size={14} color={Colors.primary} />
                    <Text style={styles.orderReceiptText}>View / Print Receipt</Text>
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

      {/* Dedicated Authentic Thermal Receipt Slip Modal */}
      <Modal visible={!!receiptOrder} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentWrapper}>
            {/* Pure Printable Slip Container - ISOLATED from buttons */}
            <View nativeID="pos-printable-receipt" style={styles.thermalReceiptSlip}>
              {/* Store Header */}
              <View style={styles.thermalHeader}>
                <Text style={styles.thermalStars}>================================</Text>
                <Text style={styles.thermalBrandTitle}>HASAN'S FLAVORS</Text>
                <Text style={styles.thermalBrandSub}>AUTHENTIC HALAL CUISINE</Text>
                <Text style={styles.thermalTagline}>100% Zabihah Halal • Manila</Text>
                <Text style={styles.thermalStars}>================================</Text>
              </View>

              {/* Order & Metadata */}
              <View style={styles.thermalMetaSection}>
                <View style={styles.thermalMetaRow}>
                  <Text style={styles.thermalMetaText}>ORDER: {receiptOrder?.orderNumber}</Text>
                  <Text style={styles.thermalMetaText}>
                    TYPE: {(receiptOrder?.type || 'dine_in').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.thermalMetaRow}>
                  <Text style={styles.thermalMetaText}>
                    TABLE: {receiptOrder?.tableNumber || 'COUNTER'}
                  </Text>
                  <Text style={styles.thermalMetaText}>
                    GUEST: {receiptOrder?.customerName || 'GUEST'}
                  </Text>
                </View>
                <View style={styles.thermalMetaRow}>
                  <Text style={styles.thermalMetaText}>
                    DATE: {receiptOrder ? new Date(receiptOrder.createdAt).toLocaleDateString() : ''}
                  </Text>
                  <Text style={styles.thermalMetaText}>
                    TIME: {receiptOrder ? new Date(receiptOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                </View>
                <Text style={styles.thermalMetaText}>
                  CASHIER: REGISTER #01 ({user?.name || 'Staff'})
                </Text>
              </View>

              <Text style={styles.thermalDashes}>--------------------------------</Text>
              <View style={styles.thermalColumnHeader}>
                <Text style={styles.thermalColQty}>QTY</Text>
                <Text style={styles.thermalColItem}>ITEM DESCRIPTION</Text>
                <Text style={styles.thermalColAmount}>AMOUNT</Text>
              </View>
              <Text style={styles.thermalDashes}>--------------------------------</Text>

              {/* Itemized Lines */}
              <View style={styles.thermalItemsList}>
                {receiptOrder?.items.map((it, idx) => (
                  <View key={idx} style={styles.thermalItemLine}>
                    <Text style={styles.thermalItemQty}>{it.quantity}x</Text>
                    <Text style={styles.thermalItemName} numberOfLines={1}>
                      {it.dish.name}
                    </Text>
                    <Text style={styles.thermalItemAmount}>
                      {it.totalPrice.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={styles.thermalDashes}>--------------------------------</Text>

              {/* Math Totals */}
              <View style={styles.thermalMathBox}>
                <View style={styles.thermalMathRow}>
                  <Text style={styles.thermalMathLabel}>SUBTOTAL:</Text>
                  <Text style={styles.thermalMathVal}>
                    ₱{(receiptOrder?.subtotal || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.thermalMathRow}>
                  <Text style={styles.thermalMathLabel}>TAX &amp; VAT (5%):</Text>
                  <Text style={styles.thermalMathVal}>
                    ₱{(receiptOrder?.tax || 0).toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.thermalDashes}>--------------------------------</Text>
                <View style={styles.thermalTotalRow}>
                  <Text style={styles.thermalTotalLabel}>TOTAL DUE:</Text>
                  <Text style={styles.thermalTotalVal}>
                    ₱{(receiptOrder?.total || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.thermalMathRow}>
                  <Text style={styles.thermalMathLabel}>PAYMENT METHOD:</Text>
                  <Text style={styles.thermalMathVal}>CASH ONLY</Text>
                </View>
                <View style={styles.thermalMathRow}>
                  <Text style={styles.thermalMathLabel}>TOTAL ITEMS:</Text>
                  <Text style={styles.thermalMathVal}>
                    {receiptOrder?.items.reduce((acc, it) => acc + it.quantity, 0)} PCS
                  </Text>
                </View>
              </View>

              {/* Footer Notice */}
              <Text style={styles.thermalStars}>================================</Text>
              <View style={styles.thermalFooterNote}>
                <Text style={styles.thermalNoticeText}>*** THANK YOU FOR DINING! ***</Text>
                <Text style={styles.thermalNoticeSub}>Please visit Hasan's Flavors again</Text>
                <Text style={styles.thermalNoticeSub}>WiFi: HasansGuest • Pass: spice1234</Text>
                <Text style={styles.thermalNoticeSub}>VAT Reg. TIN: 402-891-233-000</Text>
                <Text style={styles.thermalCustomerCopy}>--- CUSTOMER OFFICIAL SLIP ---</Text>
              </View>
              <Text style={styles.thermalStars}>================================</Text>
            </View>

            {/* Screen Controls (Completely OUTSIDE the printable receipt container) */}
            <View nativeID="no-print" style={styles.screenReceiptActions}>
              <TouchableOpacity
                style={styles.printThermalBtn}
                onPress={handlePrintReceipt}
                activeOpacity={0.8}
              >
                <Ionicons name="print" size={17} color={Colors.textLight} />
                <Text style={styles.printThermalBtnText}>Print Thermal Slip (80mm)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeThermalBtn}
                onPress={() => setReceiptOrder(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeThermalBtnText}>Close / Next Order</Text>
              </TouchableOpacity>
            </View>
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
    height: 58,
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
    gap: 10,
  },
  navLogo: {
    width: 38,
    height: 38,
  },
  navTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
  },
  navSub: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
  },
  navCenterToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 3,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.round,
    gap: 5,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: Colors.textLight,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
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
    paddingVertical: 6,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
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
    flex: 0.63,
  },
  catalogFilterBar: {
    padding: Spacing.sm,
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
    borderRadius: Radius.round,
    paddingHorizontal: Spacing.md,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text,
  },
  categoryScroll: {
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  categoryCardItem: {
    alignItems: 'center',
    gap: 5,
    width: 68,
  },
  categoryImageWrapper: {
    width: 54,
    height: 54,
    borderRadius: Radius.round,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  categoryImageWrapperActive: {
    borderColor: Colors.primary,
    borderWidth: 2.5,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryNameText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  categoryNameTextActive: {
    color: Colors.primary,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
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
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
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
    borderWidth: 1.5,
  },
  dishCardOutOfStock: {
    opacity: 0.5,
  },
  dishImageWrapper: {
    width: '100%',
    height: 80,
    position: 'relative',
    backgroundColor: Colors.surface,
  },
  dishImage: {
    width: '100%',
    height: '100%',
  },
  dishBadgeCount: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.round,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.subtle,
  },
  dishBadgeText: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
  },
  dishDetails: {
    padding: Spacing.sm,
  },
  dishCategoryTag: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dishName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    lineHeight: 16,
    marginTop: 2,
    minHeight: 32,
  },
  dishFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dishPrice: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.primary,
  },
  dishAddIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    flex: 0.37,
  },
  ticketHeader: {
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  orderTypeTabs: {
    flexDirection: 'row',
    gap: 6,
  },
  orderTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 5,
    borderRadius: Radius.round,
  },
  orderTypeBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  orderTypeBtnText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },
  orderTypeBtnTextActive: {
    color: Colors.textLight,
    fontWeight: '700',
  },
  ticketMetaInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.round,
    paddingHorizontal: 8,
    gap: 4,
  },
  tableInput: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text,
    width: 54,
    paddingVertical: 4,
  },
  guestInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.round,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text,
    flex: 1,
  },
  cartItemsScroll: {
    flex: 1,
    maxHeight: 280,
  },
  emptyCartBox: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyCartTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textSecondary,
  },
  emptyCartSub: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
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
  cartItemThumb: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  cartItemUnit: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  stepperQty: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
    minWidth: 16,
    textAlign: 'center',
  },
  cartItemTotal: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
    minWidth: 48,
    textAlign: 'right',
  },
  ticketFooterSection: {
    padding: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
    gap: 8,
  },
  cashOnlyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  cashOnlyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.halalGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.halalGreen,
  },
  cashOnlyPillText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.halalGreen,
    letterSpacing: 0.5,
  },
  cashOnlySubText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
  },
  cashTenderBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.xs,
    borderRadius: Radius.md,
    gap: 6,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  presetBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    paddingVertical: 5,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetBtnText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textSecondary,
  },
  tenderInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tenderLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tenderInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xs,
    paddingHorizontal: 6,
    height: 30,
  },
  pesoSymbol: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginRight: 2,
  },
  tenderInput: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    paddingVertical: 0,
  },
  changeDueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeDueLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  changeDueVal: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.halalGreen,
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
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  totalsVal: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text,
  },
  totalsDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
  },
  grandTotalVal: {
    fontSize: Typography.fontSize.md,
    fontWeight: '900',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.primary,
  },
  chargeBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.round,
    gap: 8,
    ...Shadows.card,
  },
  chargeBtnDisabled: {
    opacity: 0.45,
  },
  chargeBtnText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
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
    borderRadius: Radius.lg,
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
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
  },
  orderSub: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
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
    backgroundColor: Colors.halalGreenLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.round,
  },
  paidTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.halalGreen,
  },
  orderItemsSummary: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  orderActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 8,
  },
  orderReceiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 7,
    borderRadius: Radius.round,
    gap: 4,
  },
  orderReceiptText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  orderCompleteBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 7,
    borderRadius: Radius.round,
  },
  orderCompleteText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textLight,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContentWrapper: {
    width: Platform.OS === 'web' ? 340 : '100%',
    alignItems: 'center',
  },
  /* Authentic 80mm ESC/POS Thermal Receipt Layout */
  thermalReceiptSlip: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    ...Shadows.elevated,
  },
  thermalHeader: {
    alignItems: 'center',
    marginBottom: 2,
  },
  thermalStars: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#000000',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  thermalDashes: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#000000',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginVertical: 1,
  },
  thermalBrandTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: 2,
  },
  thermalBrandSub: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginTop: 1,
  },
  thermalTagline: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 2,
  },
  thermalMetaSection: {
    marginVertical: 2,
    gap: 2,
  },
  thermalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  thermalMetaText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#000000',
    fontWeight: '600',
  },
  thermalColumnHeader: {
    flexDirection: 'row',
    paddingVertical: 1,
  },
  thermalColQty: {
    width: 32,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  thermalColItem: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  thermalColAmount: {
    width: 60,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'right',
  },
  thermalItemsList: {
    maxHeight: 200,
    marginVertical: 1,
  },
  thermalItemLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 2,
  },
  thermalItemQty: {
    width: 32,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  thermalItemName: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#000000',
  },
  thermalItemAmount: {
    width: 60,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'right',
  },
  thermalMathBox: {
    gap: 2,
    marginVertical: 1,
  },
  thermalMathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  thermalMathLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#000000',
    fontWeight: '600',
  },
  thermalMathVal: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  thermalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  thermalTotalLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
  },
  thermalTotalVal: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
  },
  thermalFooterNote: {
    alignItems: 'center',
    marginVertical: 3,
    gap: 2,
  },
  thermalNoticeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
  thermalNoticeSub: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 9,
    color: '#333333',
    textAlign: 'center',
  },
  thermalCustomerCopy: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginTop: 2,
  },
  screenReceiptActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  printThermalBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 11,
    borderRadius: Radius.md,
    gap: 6,
    ...Shadows.subtle,
  },
  printThermalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
  },
  closeThermalBtn: {
    flex: 0.8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 11,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  closeThermalBtnText: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 11,
    fontFamily: Typography.fontFamily.semiBold,
  },
});
