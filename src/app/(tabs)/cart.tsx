import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { SpiceMeter } from '@/components/SpiceMeter';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useCartStore } from '@/store/useCartStore';
import { useTableStore } from '@/store/useTableStore';
import * as Haptics from 'expo-haptics';

export default function CartScreen() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    deliveryType,
    setDeliveryType,
    promoCode,
    applyPromoCode,
    removePromoCode,
    discountAmount,
    getSubtotal,
    getTax,
    getDeliveryFee,
    getServiceFee,
    getTotal,
  } = useCartStore();

  const currentTable = useTableStore((state) => state.currentTable);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const subtotal = getSubtotal();
  const tax = getTax();
  const deliveryFee = getDeliveryFee();
  const serviceFee = getServiceFee();
  const total = getTotal();

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput);
    if (res.success) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setPromoError('');
    } else {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      setPromoError('Invalid coupon code. Try HASAN10 or BIRYANI20');
    }
  };

  const handleProceedToCheckout = () => {
    if (items.length === 0) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    router.push('/checkout' as any);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Your Cart" />
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>
            Explore our authentic Halal dishes and add items to begin your order.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/menu' as any)}
          >
            <Text style={styles.browseButtonText}>Explore Menu</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Your Cart" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dining Mode Segmented Selector */}
        <View style={styles.diningTypeCard}>
          <Text style={styles.sectionTitle}>Dining Method</Text>
          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[styles.typeButton, deliveryType === 'dine_in' && styles.activeTypeButton]}
              onPress={() => {
                setDeliveryType('dine_in');
                if (!currentTable) router.push('/qr-scan' as any);
              }}
            >
              <Ionicons
                name="restaurant-outline"
                size={16}
                color={deliveryType === 'dine_in' ? Colors.textLight : Colors.textSecondary}
              />
              <Text style={[styles.typeLabel, deliveryType === 'dine_in' && styles.activeTypeLabel]}>
                Dine-In {currentTable ? `(${currentTable})` : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, deliveryType === 'delivery' && styles.activeTypeButton]}
              onPress={() => setDeliveryType('delivery')}
            >
              <Ionicons
                name="bicycle-outline"
                size={16}
                color={deliveryType === 'delivery' ? Colors.textLight : Colors.textSecondary}
              />
              <Text style={[styles.typeLabel, deliveryType === 'delivery' && styles.activeTypeLabel]}>
                Delivery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, deliveryType === 'takeout' && styles.activeTypeButton]}
              onPress={() => setDeliveryType('takeout')}
            >
              <Ionicons
                name="bag-handle-outline"
                size={16}
                color={deliveryType === 'takeout' ? Colors.textLight : Colors.textSecondary}
              />
              <Text style={[styles.typeLabel, deliveryType === 'takeout' && styles.activeTypeLabel]}>
                Takeout
              </Text>
            </TouchableOpacity>
          </View>

          {deliveryType === 'dine_in' && (
            <View style={styles.dineInNotice}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.saffron} />
              <Text style={styles.dineInNoticeText}>
                {currentTable
                  ? `Assigned to ${currentTable}. Service will be delivered to your table.`
                  : 'Please select your table number for direct table delivery.'}
              </Text>
              {!currentTable && (
                <TouchableOpacity onPress={() => router.push('/qr-scan' as any)}>
                  <Text style={styles.pickTableLink}>Select Table</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {deliveryType === 'delivery' && (
            <View style={styles.freeDeliveryProgressBar}>
              <View style={styles.deliveryProgressHeader}>
                <Text style={styles.deliveryProgressTitle}>
                  {subtotal >= 1000 ? 'Free delivery unlocked' : `Add ₱${1000 - subtotal} more for free delivery`}
                </Text>
                <Text style={styles.deliveryProgressPct}>
                  {Math.min(100, Math.round((subtotal / 1000) * 100))}%
                </Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, (subtotal / 1000) * 100)}%` },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* Cart Item Rows */}
        <View style={styles.itemsCard}>
          <View style={styles.itemsCardHeader}>
            <Text style={styles.sectionTitle}>Order Items ({items.length})</Text>
            <TouchableOpacity onPress={clearCart} hitSlop={6}>
              <Text style={styles.clearCartText}>Clear all</Text>
            </TouchableOpacity>
          </View>

          {items.map((item) => (
            <View key={item.cartItemId} style={styles.itemRow}>
              <Image source={{ uri: item.dish.imageUrl }} style={styles.itemImage} resizeMode="cover" />

              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.dish.name}
                </Text>

                <View style={styles.itemCustomizationRow}>
                  <Text style={styles.itemPortionText}>{item.portion.name}</Text>
                  <SpiceMeter level={item.spiceLevel} size="sm" />
                </View>

                {item.selectedAddons.length > 0 && (
                  <Text style={styles.addonsText} numberOfLines={2}>
                    + {item.selectedAddons.map((a) => a.name).join(', ')}
                  </Text>
                )}

                {item.specialNotes ? (
                  <Text style={styles.specialNoteText} numberOfLines={1}>
                    Note: "{item.specialNotes}"
                  </Text>
                ) : null}

                <View style={styles.itemBottomRow}>
                  <Text style={styles.itemPrice}>₱{item.totalPrice.toLocaleString()}</Text>

                  {/* Quantity Stepper */}
                  <View style={styles.quantityStepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updateQuantity(item.cartItemId, -1)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                        size={15}
                        color={item.quantity === 1 ? Colors.error : Colors.text}
                      />
                    </TouchableOpacity>

                    <Text style={styles.qtyText}>{item.quantity}</Text>

                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updateQuantity(item.cartItemId, 1)}
                      hitSlop={8}
                    >
                      <Ionicons name="add" size={15} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Promo Code Box */}
        <View style={styles.promoCard}>
          <Text style={styles.sectionTitle}>Promotions</Text>
          {promoCode ? (
            <View style={styles.activePromoRow}>
              <View style={styles.activePromoLeft}>
                <Ionicons name="pricetag-outline" size={16} color={Colors.primary} />
                <View>
                  <Text style={styles.appliedCode}>{promoCode}</Text>
                  <Text style={styles.appliedSavings}>Saved ₱{discountAmount.toLocaleString()}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={removePromoCode} hitSlop={6}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.promoInputRow}>
                <TextInput
                  style={styles.promoInput}
                  placeholder="Enter coupon code (e.g. HASAN10)"
                  placeholderTextColor={Colors.textMuted}
                  value={promoInput}
                  onChangeText={(t) => {
                    setPromoInput(t);
                    setPromoError('');
                  }}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.applyBtn} onPress={handleApplyPromo}>
                  <Text style={styles.applyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
              {promoError ? <Text style={styles.promoErrorText}>{promoError}</Text> : null}
            </View>
          )}

          {!promoCode && (
            <View style={styles.quickCouponsRow}>
              <TouchableOpacity
                style={styles.quickCouponPill}
                onPress={() => {
                  setPromoInput('HASAN10');
                  applyPromoCode('HASAN10');
                }}
              >
                <Text style={styles.quickCouponText}>HASAN10 (10% OFF)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bill Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>₱{subtotal.toLocaleString()}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax & VAT (5%)</Text>
            <Text style={styles.summaryVal}>₱{tax.toLocaleString()}</Text>
          </View>

          {deliveryType === 'delivery' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryVal}>
                {deliveryFee === 0 ? 'FREE' : `₱${deliveryFee}`}
              </Text>
            </View>
          )}

          {deliveryType === 'dine_in' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Charge (5%)</Text>
              <Text style={styles.summaryVal}>₱{serviceFee.toLocaleString()}</Text>
            </View>
          )}

          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>Coupon Discount</Text>
              <Text style={styles.discountVal}>-₱{discountAmount.toLocaleString()}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.grandTotalVal}>₱{total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Docked Bottom Checkout Footer */}
      <View style={styles.footerContainer}>
        <View style={styles.footerTotalCol}>
          <Text style={styles.footerTotalLabel}>Total Amount</Text>
          <Text style={styles.footerTotalAmount}>₱{total.toLocaleString()}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.checkoutBtn}
          onPress={handleProceedToCheckout}
        >
          <Text style={styles.checkoutBtnText}>Checkout</Text>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: Radius.md,
    gap: 8,
  },
  browseButtonText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.sm,
  },
  diningTypeCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 9,
    gap: 6,
  },
  activeTypeButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeTypeLabel: {
    color: Colors.textLight,
    fontWeight: '700',
  },
  dineInNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
    gap: 6,
  },
  dineInNoticeText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  pickTableLink: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  freeDeliveryProgressBar: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  deliveryProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  deliveryProgressTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  deliveryProgressPct: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  itemsCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  itemsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  clearCartText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  itemCustomizationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  itemPortionText: {
    fontSize: 11,
    color: Colors.saffron,
    fontWeight: '600',
  },
  addonsText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  specialNoteText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  itemPrice: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    color: Colors.primary,
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 18,
    textAlign: 'center',
  },
  promoCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promoInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.xs,
    color: Colors.text,
    height: 38,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.xs,
  },
  promoErrorText: {
    color: Colors.error,
    fontSize: 11,
    marginTop: 4,
  },
  activePromoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  activePromoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appliedCode: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  appliedSavings: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  quickCouponsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.sm,
  },
  quickCouponPill: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickCouponText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  summaryVal: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.text,
  },
  discountLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
  },
  discountVal: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
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
  grandTotalVal: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.primary,
  },
  footerContainer: {
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
  footerTotalCol: {},
  footerTotalLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  footerTotalAmount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.primary,
  },
  checkoutBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: Radius.md,
    gap: 8,
  },
  checkoutBtnText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.sm,
  },
});
