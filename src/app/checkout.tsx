import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
      customerName: customerName.trim() || 'Customer',
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
    router.replace(`/track/${order.id}` as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Header title="Checkout" showBack />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Type Confirmation */}
        <View style={styles.orderTypeCard}>
          <Ionicons
            name={
              deliveryType === 'dine_in'
                ? 'restaurant-outline'
                : deliveryType === 'delivery'
                ? 'bicycle-outline'
                : 'bag-handle-outline'
            }
            size={20}
            color={Colors.text}
          />
          <View style={styles.orderTypeInfo}>
            <Text style={styles.orderTypeTitle}>
              {deliveryType === 'dine_in'
                ? `Dine-In • ${currentTable || 'Table 04'}`
                : deliveryType === 'delivery'
                ? 'Delivery'
                : 'Takeout'}
            </Text>
            <Text style={styles.orderTypeSub}>
              Estimated preparation: {deliveryType === 'delivery' ? '30-40 mins' : '15-20 mins'}
            </Text>
          </View>
        </View>

        {/* Customer Contact & Delivery Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Details</Text>

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
                placeholder="Unit, building, street, city"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={2}
              />
            </View>
          )}
        </View>

        {/* Payment Method Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>

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
                <View>
                  <Text style={styles.paymentName}>GCash / QR Ph</Text>
                  <Text style={styles.paymentDesc}>Digital wallet instant payment</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Cash Option */}
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
                <View>
                  <Text style={styles.paymentName}>
                    {deliveryType === 'dine_in' ? 'Cash at Table / Counter' : 'Cash on Delivery (COD)'}
                  </Text>
                  <Text style={styles.paymentDesc}>Pay upon receipt</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Card Option */}
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
                <View>
                  <Text style={styles.paymentName}>Credit / Debit Card</Text>
                  <Text style={styles.paymentDesc}>Visa, Mastercard</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Staff Tip */}
        <View style={styles.card}>
          <View style={styles.tipHeader}>
            <Text style={styles.cardTitle}>Staff Gratuity</Text>
            <Text style={styles.tipSub}>Directly to kitchen team</Text>
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
                    {amount === 0 ? 'None' : `₱${amount}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Special Instructions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Special Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            placeholder="Gate code, dietary notes, or packaging request..."
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
              <Text style={styles.calcLabel}>Staff Gratuity</Text>
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

      {/* Docked Place Order Footer */}
      <View style={styles.footer}>
        <View>
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
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  orderTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...Shadows.subtle,
  },
  orderTypeInfo: {
    flex: 1,
  },
  orderTypeTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  orderTypeSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  cardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    fontSize: Typography.fontSize.xs,
    color: Colors.text,
  },
  textArea: {
    height: 56,
    textAlignVertical: 'top',
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
    backgroundColor: Colors.surface,
  },
  paymentOptionSelected: {
    borderColor: Colors.text,
    backgroundColor: Colors.card,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: Colors.text,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text,
  },
  paymentName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tipSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tipPill: {
    flex: 1,
    paddingVertical: 9,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  tipPillActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  tipPillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tipPillTextActive: {
    color: Colors.textLight,
    fontWeight: '600',
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryItemQty: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 24,
  },
  summaryItemInfo: {
    flex: 1,
  },
  summaryItemName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.text,
  },
  summaryItemPortion: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  summaryItemPrice: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
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
    fontWeight: '500',
    color: Colors.text,
  },
  discountLabel: {
    fontSize: 11,
    color: Colors.primary,
  },
  discountVal: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finalTotalLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  finalTotalVal: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  footer: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.elevated,
  },
  footerTotalLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  footerTotalAmount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  placeOrderBtn: {
    backgroundColor: Colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: Radius.md,
    gap: 8,
  },
  placeOrderBtnText: {
    color: Colors.textLight,
    fontWeight: '600',
    fontSize: Typography.fontSize.sm,
  },
});
