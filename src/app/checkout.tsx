import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useCartStore } from '@/store/useCartStore';
import { useOrderStore } from '@/store/useOrderStore';
import { useTableStore } from '@/store/useTableStore';
import { PaymentMethod } from '@/types';
import * as Haptics from 'expo-haptics';

export default function CheckoutScreen() {
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

  // Form State
  const [customerName, setCustomerName] = useState('Jamilur Rahman');
  const [customerPhone, setCustomerPhone] = useState('+63 917 888 2345');
  const [deliveryAddress, setDeliveryAddress] = useState('Tower 2, Unit 1804, Makati Central, Metro Manila');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [tipAmount, setTipAmount] = useState<number>(50);

  const subtotal = getSubtotal();
  const tax = getTax();
  const deliveryFee = getDeliveryFee();
  const serviceFee = getServiceFee();
  const grandTotal = getTotal() + tipAmount;

  const handlePlaceOrder = () => {
    if (items.length === 0) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const order = placeOrder({
      type: deliveryType,
      items,
      customerName: customerName.trim() || 'Valued Customer',
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryType === 'delivery' ? deliveryAddress.trim() : undefined,
      tableNumber: deliveryType === 'dine_in' ? currentTable || 'Table 04' : undefined,
      paymentMethod,
      subtotal,
      tax,
      serviceFee,
      deliveryFee,
      discount: discountAmount,
      total: grandTotal,
      specialNotes: specialInstructions.trim(),
    });

    clearCart();

    // Route to live tracker
    router.replace(`/track/${order.id}` as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Checkout" showBack />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Type Confirmation Banner */}
        <View style={styles.orderTypeCard}>
          <View style={styles.orderTypeLeft}>
            <View style={styles.orderTypeIconCircle}>
              <Text style={styles.orderTypeEmoji}>
                {deliveryType === 'dine_in' ? '🍽️' : deliveryType === 'delivery' ? '🛵' : '🛍️'}
              </Text>
            </View>
            <View>
              <Text style={styles.orderTypeTitle}>
                {deliveryType === 'dine_in'
                  ? `Dine-In (${currentTable || 'Table 04'})`
                  : deliveryType === 'delivery'
                  ? 'Delivery to Your Address'
                  : 'Self-Pickup Takeout'}
              </Text>
              <Text style={styles.orderTypeSub}>
                Estimated preparation: {deliveryType === 'delivery' ? '30-40 mins' : '15-20 mins'}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Contact & Delivery Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Customer Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="+63 9xx xxx xxxx"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          {deliveryType === 'delivery' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivery Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="Complete delivery address, floor, unit number"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={2}
              />
            </View>
          )}

          {deliveryType === 'dine_in' && (
            <View style={styles.tableInfoBox}>
              <Ionicons name="restaurant" size={18} color={Colors.halalGreen} />
              <Text style={styles.tableInfoText}>
                Order will be dispatched directly to <Text style={styles.bold}>{currentTable || 'Table 04'}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Payment Method Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Select Payment Method</Text>

          <View style={styles.paymentList}>
            {/* GCash Option */}
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'gcash' && styles.paymentOptionSelected]}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                setPaymentMethod('gcash');
              }}
            >
              <View style={styles.paymentLeft}>
                <View style={[styles.radioCircle, paymentMethod === 'gcash' && styles.radioActive]}>
                  {paymentMethod === 'gcash' && <View style={styles.radioDot} />}
                </View>
                <View style={[styles.paymentIconBox, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={styles.paymentLogoText}>GC</Text>
                </View>
                <View>
                  <Text style={styles.paymentName}>GCash / QR Ph</Text>
                  <Text style={styles.paymentDesc}>Fast & instant digital wallet</Text>
                </View>
              </View>
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>POPULAR</Text>
              </View>
            </TouchableOpacity>

            {/* Cash on Delivery / Counter Option */}
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionSelected]}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                setPaymentMethod('cash');
              }}
            >
              <View style={styles.paymentLeft}>
                <View style={[styles.radioCircle, paymentMethod === 'cash' && styles.radioActive]}>
                  {paymentMethod === 'cash' && <View style={styles.radioDot} />}
                </View>
                <View style={[styles.paymentIconBox, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="cash-outline" size={20} color={Colors.halalGreen} />
                </View>
                <View>
                  <Text style={styles.paymentName}>
                    {deliveryType === 'dine_in' ? 'Pay at Counter / Table Cash' : 'Cash on Delivery (COD)'}
                  </Text>
                  <Text style={styles.paymentDesc}>Pay exact cash upon arrival</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Card / Visa Mastercard */}
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionSelected]}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                setPaymentMethod('card');
              }}
            >
              <View style={styles.paymentLeft}>
                <View style={[styles.radioCircle, paymentMethod === 'card' && styles.radioActive]}>
                  {paymentMethod === 'card' && <View style={styles.radioDot} />}
                </View>
                <View style={[styles.paymentIconBox, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="card-outline" size={20} color={Colors.saffronDark} />
                </View>
                <View>
                  <Text style={styles.paymentName}>Credit / Debit Card</Text>
                  <Text style={styles.paymentDesc}>Visa, Mastercard, JCB</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tip for Staff & Kitchen */}
        <View style={styles.card}>
          <View style={styles.tipHeader}>
            <Text style={styles.cardTitle}>3. Tip for Restaurant Staff</Text>
            <Text style={styles.tipSub}>100% goes to staff & cooks</Text>
          </View>

          <View style={styles.tipRow}>
            {[0, 30, 50, 100].map((amount) => {
              const active = tipAmount === amount;
              return (
                <TouchableOpacity
                  key={amount}
                  style={[styles.tipPill, active && styles.tipPillActive]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setTipAmount(amount);
                  }}
                >
                  <Text style={[styles.tipPillText, active && styles.tipPillTextActive]}>
                    {amount === 0 ? 'No Tip' : `₱${amount}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Special Instructions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>4. Special Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            placeholder="Special gate code, buzzer, or packaging preference..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Order Summary Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary ({items.length} items)</Text>

          {items.map((it) => (
            <View key={it.cartItemId} style={styles.summaryItemRow}>
              <Text style={styles.summaryItemQty}>{it.quantity}x</Text>
              <View style={styles.summaryItemInfo}>
                <Text style={styles.summaryItemName} numberOfLines={1}>
                  {it.dish.name}
                </Text>
                <Text style={styles.summaryItemPortion}>{it.portion.name}</Text>
              </View>
              <Text style={styles.summaryItemPrice}>₱{it.totalPrice.toLocaleString()}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Subtotal</Text>
            <Text style={styles.calcVal}>₱{subtotal.toLocaleString()}</Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Tax & VAT (5%)</Text>
            <Text style={styles.calcVal}>₱{tax.toLocaleString()}</Text>
          </View>

          {deliveryType === 'delivery' && (
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Delivery Fee</Text>
              <Text style={styles.calcVal}>{deliveryFee === 0 ? 'FREE' : `₱${deliveryFee}`}</Text>
            </View>
          )}

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

          {tipAmount > 0 && (
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Staff Tip</Text>
              <Text style={styles.calcVal}>₱{tipAmount.toLocaleString()}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.finalTotalRow}>
            <Text style={styles.finalTotalLabel}>Grand Total</Text>
            <Text style={styles.finalTotalVal}>₱{grandTotal.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order CTA Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerTotalLabel}>Total to Pay</Text>
          <Text style={styles.footerTotalAmount}>₱{grandTotal.toLocaleString()}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.placeOrderBtn}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.placeOrderBtnText}>Place Order Now</Text>
          <Ionicons name="checkmark-circle" size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 110,
    gap: Spacing.md,
  },
  orderTypeCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.subtle,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  orderTypeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderTypeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.round,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderTypeEmoji: {
    fontSize: 20,
  },
  orderTypeTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
  },
  orderTypeSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.subtle,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FAF9F8',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.fontSize.xs,
    color: Colors.text,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  tableInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    gap: 8,
    marginTop: 4,
  },
  tableInfoText: {
    fontSize: 11,
    color: Colors.halalGreenDark,
  },
  bold: {
    fontWeight: '800',
  },
  paymentList: {
    gap: Spacing.sm,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FAF9F8',
  },
  paymentOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF8F8',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  paymentIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentLogoText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1565C0',
  },
  paymentName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  paymentDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  popularBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  popularBadgeText: {
    color: Colors.primaryDark,
    fontSize: 9,
    fontWeight: '800',
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tipSub: {
    fontSize: 11,
    color: Colors.halalGreen,
    fontWeight: '600',
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tipPill: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#FAF9F8',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  tipPillActive: {
    backgroundColor: '#FFEBEE',
    borderColor: Colors.primary,
  },
  tipPillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tipPillTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryItemQty: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
    color: Colors.primary,
    width: 28,
  },
  summaryItemInfo: {
    flex: 1,
  },
  summaryItemName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryItemPortion: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  summaryItemPrice: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calcLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  calcVal: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  discountLabel: {
    fontSize: 11,
    color: Colors.halalGreen,
  },
  discountVal: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.halalGreen,
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finalTotalLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: '900',
    color: Colors.text,
  },
  finalTotalVal: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '900',
    color: Colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.elevated,
  },
  footerTotalLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  footerTotalAmount: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '900',
    color: Colors.primary,
  },
  placeOrderBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    gap: 8,
    ...Shadows.card,
  },
  placeOrderBtnText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontSize: Typography.fontSize.sm,
  },
});
