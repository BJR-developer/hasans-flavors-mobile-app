import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useCartStore } from '@/store/useCartStore';
import { useOrderStore } from '@/store/useOrderStore';
import { useTableStore } from '@/store/useTableStore';
import { useAuthStore } from '@/store/useAuthStore';
import * as Haptics from 'expo-haptics';

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    items,
    deliveryType,
    promoCode,
    discountAmount,
    getSubtotal,
    getTax,
    getDeliveryFee,
    getServiceFee,
    getTotal,
    clearCart,
  } = useCartStore();

  const currentTable = useTableStore((state) => state.currentTable);
  const placeOrder = useOrderStore((state) => state.placeOrder);
  const user = useAuthStore((state) => state.user);

  const [specialInstructions, setSpecialInstructions] = useState('');

  const subtotal = getSubtotal();
  const tax = getTax();
  const deliveryFee = getDeliveryFee();
  const serviceFee = getServiceFee();
  const grandTotal = getTotal();

  const handlePlaceOrder = () => {
    if (items.length === 0) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const order = placeOrder({
      type: deliveryType === 'dine_in' ? 'dine_in' : 'takeout',
      items,
      customerName: user?.name || 'Customer',
      customerPhone: user?.phone || '+63 917 888 1234',
      tableNumber: deliveryType === 'dine_in' ? currentTable || 'Table 04' : undefined,
      paymentMethod: 'cash',
      subtotal,
      tax,
      serviceFee,
      deliveryFee,
      discount: discountAmount,
      total: grandTotal,
      specialNotes: specialInstructions.trim(),
    });

    clearCart();
    router.replace(`/track/${order.id}` as any);
  };

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.topSafeArea} edges={['top']}>
        <Header title="Checkout" showBack showCart={false} showScanTable={true} />
      </SafeAreaView>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 130 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Dining Mode Card */}
        <View style={styles.orderTypeCard}>
          <View style={styles.orderTypeIconCircle}>
            <Ionicons
              name={
                deliveryType === 'dine_in'
                  ? 'restaurant-outline'
                  : 'bag-handle-outline'
              }
              size={20}
              color={Colors.primary}
            />
          </View>
          <View style={styles.orderTypeInfo}>
            <Text style={styles.orderTypeTitle}>
              {deliveryType === 'dine_in'
                ? `Dine-In • ${currentTable || 'Table 04'}`
                : 'Takeout / Pickup'}
            </Text>
            <Text style={styles.orderTypeSub}>
              Estimated preparation: 15-20 mins
            </Text>
          </View>
        </View>

        {/* Payment Method Selector (Cash Only) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>

          <View style={styles.singlePaymentOption}>
            <View style={styles.paymentLeft}>
              <View style={styles.radioCircleActive}>
                <View style={styles.radioDot} />
              </View>
              <View style={styles.paymentTextCol}>
                <Text style={styles.paymentNameSelected}>
                  {deliveryType === 'dine_in'
                    ? 'Cash at Table / Counter'
                    : 'Cash on Pickup / Takeout'}
                </Text>
                <Text style={styles.paymentDesc}>Pay with cash upon service</Text>
              </View>
            </View>

            <View style={styles.cashIconBadge}>
              <Ionicons name="cash-outline" size={20} color={Colors.primary} />
            </View>
          </View>
        </View>

        {/* Special Cooking / Dining Instructions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Special Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            placeholder="E.g. less oil, extra gravy on side..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Order Summary Breakdown with Dish Images */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary ({items.length} items)</Text>

          <View style={styles.itemsListContainer}>
            {items.map((it) => (
              <View key={it.cartItemId} style={styles.summaryItemRow}>
                <Image
                  source={{ uri: it.dish.imageUrl }}
                  style={styles.dishThumbnail}
                  resizeMode="cover"
                />

                <View style={styles.summaryItemInfo}>
                  <View style={styles.itemNameRow}>
                    <Text style={styles.itemQtyBadge}>{it.quantity}x</Text>
                    <Text style={styles.summaryItemName} numberOfLines={1}>
                      {it.dish.name}
                    </Text>
                  </View>
                  <Text style={styles.summaryItemPortion}>{it.portion.name}</Text>
                  {it.selectedAddons && it.selectedAddons.length > 0 ? (
                    <Text style={styles.summaryAddons} numberOfLines={1}>
                      + {it.selectedAddons.map((a) => a.name).join(', ')}
                    </Text>
                  ) : null}
                </View>

                <Text style={styles.summaryItemPrice}>₱{it.totalPrice.toLocaleString()}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Subtotal</Text>
            <Text style={styles.calcVal}>₱{subtotal.toLocaleString()}</Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Tax & VAT (5%)</Text>
            <Text style={styles.calcVal}>₱{tax.toLocaleString()}</Text>
          </View>

          {deliveryType === 'dine_in' && (
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Service Charge (5%)</Text>
              <Text style={styles.calcVal}>₱{serviceFee.toLocaleString()}</Text>
            </View>
          )}

          {discountAmount > 0 && (
            <View style={styles.calcRow}>
              <Text style={styles.discountLabel}>Coupon ({promoCode})</Text>
              <Text style={styles.discountVal}>-₱{discountAmount.toLocaleString()}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.finalTotalRow}>
            <Text style={styles.finalTotalLabel}>Grand Total</Text>
            <Text style={styles.finalTotalVal}>₱{grandTotal.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Docked Full-Width Flush Bottom Bar */}
      <View
        style={[
          styles.flushBottomBar,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 20 },
        ]}
      >
        <View style={styles.footerInner}>
          <View style={styles.footerPriceCol}>
            <Text style={styles.footerTotalLabel}>Total Amount</Text>
            <Text style={styles.footerTotalAmount}>₱{grandTotal.toLocaleString()}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.placeOrderBtn}
            onPress={handlePlaceOrder}
          >
            <Text style={styles.placeOrderBtnText}>Place Order</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topSafeArea: {
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  orderTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  orderTypeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.round,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderTypeInfo: {
    flex: 1,
  },
  orderTypeTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  orderTypeSub: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  cardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  singlePaymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radioCircleActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  paymentTextCol: {
    flex: 1,
  },
  paymentNameSelected: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  paymentDesc: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  cashIconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.round,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  itemsListContainer: {
    gap: 10,
    marginTop: 4,
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dishThumbnail: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  summaryItemInfo: {
    flex: 1,
    gap: 2,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemQtyBadge: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  summaryItemName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    flex: 1,
  },
  summaryItemPortion: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
  },
  summaryAddons: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  summaryItemPrice: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  calcLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  calcVal: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text,
  },
  discountLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  discountVal: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  finalTotalLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  finalTotalVal: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.primary,
  },
  flushBottomBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    paddingHorizontal: Spacing.lg,
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.lg,
  },
  footerPriceCol: {
    gap: 2,
  },
  footerTotalLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
  },
  footerTotalAmount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
  },
  placeOrderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: Radius.md,
  },
  placeOrderBtnText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
  },
});
