import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { SpiceMeter } from '@/components/SpiceMeter';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useCartStore } from '@/store/useCartStore';
import { useTableStore } from '@/store/useTableStore';
import { useAuthStore } from '@/store/useAuthStore';
import * as Haptics from 'expo-haptics';

export default function CartScreen() {
  const router = useRouter();
  const {
    items,
    deliveryType,
    promoCode,
    promoError,
    discountAmount,
    setDeliveryType,
    updateQuantity,
    clearCart,
    applyPromoCode,
    removePromoCode,
    setPromoError,
    getSubtotal,
    getDeliveryFee,
    getTax,
    getTotal,
    getFreeDeliveryProgress,
  } = useCartStore();

  const currentTable = useTableStore((state) => state.currentTable);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [promoInput, setPromoInput] = useState('');

  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const tax = getTax();
  const total = getTotal();
  const freeDeliveryProgress = getFreeDeliveryProgress();

  const handleApplyPromo = () => {
    if (!promoInput.trim()) {
      setPromoError('Please enter a coupon code');
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const success = applyPromoCode(promoInput.trim().toUpperCase());
    if (success) {
      setPromoInput('');
    }
  };

  const handleSelectDelivery = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    Alert.alert(
      'Coming soon to you..',
      'Delivery service is currently being rolled out in your area. For now, please enjoy our Dine-In or Takeout ordering.',
      [{ text: 'Got it' }]
    );
  };

  const handleCheckout = () => {
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
              onPress={handleSelectDelivery}
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

        {/* 
          PROMOTIONS & COUPONS SECTION:
          Hidden temporarily per request. We will implement and activate coupon redemption in the next release.
        */}
        {/*
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
        */}

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

          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.discountText]}>Discount</Text>
              <Text style={[styles.summaryVal, styles.discountText]}>
                -₱{discountAmount.toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>₱{total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Docked Sticky Bottom Footer */}
      <View style={styles.footer}>
        <View style={styles.footerPriceCol}>
          <Text style={styles.footerTotalLabel}>Total Amount</Text>
          <Text style={styles.footerTotalVal}>₱{total.toLocaleString()}</Text>
        </View>

        <TouchableOpacity activeOpacity={0.88} style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 190,
    gap: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  browseButtonText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.sm,
  },
  diningTypeCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
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
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  itemsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  clearCartText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemImage: {
    width: 68,
    height: 68,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  itemInfo: {
    flex: 1,
    gap: 3,
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
  },
  itemPortionText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  addonsText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  specialNoteText: {
    fontSize: 10,
    color: Colors.saffron,
    fontStyle: 'italic',
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
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
    padding: Spacing.lg,
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
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 42,
    fontSize: Typography.fontSize.xs,
    color: Colors.text,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    height: 42,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
    padding: Spacing.md,
    borderRadius: Radius.md,
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
    fontSize: 11,
    color: Colors.textSecondary,
  },
  quickCouponsRow: {
    marginTop: Spacing.sm,
  },
  quickCouponPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickCouponText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  discountText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  totalLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  totalVal: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.elevated,
  },
  footerPriceCol: {
    gap: 2,
  },
  footerTotalLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  footerTotalVal: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.sm,
  },
});
