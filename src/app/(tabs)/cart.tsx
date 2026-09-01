import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
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
      setPromoError('Invalid coupon code. Try HASAN10, HALALFIRST, or BIRYANI20');
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
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>
            Explore our delicious authentic Halal Biryanis, Curries, and BBQ specialties to add them to your cart.
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
        {/* Order Dining Mode Selector */}
        <View style={styles.diningTypeCard}>
          <Text style={styles.cardHeaderTitle}>Order Dining Type</Text>
          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[styles.typeButton, deliveryType === 'dine_in' && styles.activeTypeButton]}
              onPress={() => {
                setDeliveryType('dine_in');
                if (!currentTable) router.push('/qr-scan' as any);
              }}
            >
              <Text style={styles.typeEmoji}>🍽️</Text>
              <Text style={[styles.typeLabel, deliveryType === 'dine_in' && styles.activeTypeLabel]}>
                Dine-In {currentTable ? `(${currentTable})` : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, deliveryType === 'delivery' && styles.activeTypeButton]}
              onPress={() => setDeliveryType('delivery')}
            >
              <Text style={styles.typeEmoji}>🛵</Text>
              <Text style={[styles.typeLabel, deliveryType === 'delivery' && styles.activeTypeLabel]}>
                Delivery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, deliveryType === 'takeout' && styles.activeTypeButton]}
              onPress={() => setDeliveryType('takeout')}
            >
              <Text style={styles.typeEmoji}>🛍️</Text>
              <Text style={[styles.typeLabel, deliveryType === 'takeout' && styles.activeTypeLabel]}>
                Takeout
              </Text>
            </TouchableOpacity>
          </View>

          {deliveryType === 'dine_in' && (
            <View style={styles.dineInNotice}>
              <Ionicons name="restaurant-outline" size={16} color={Colors.primary} />
              <Text style={styles.dineInNoticeText}>
                {currentTable
                  ? `Seated at ${currentTable}. Fast kitchen delivery to your seat.`
                  : 'Please scan or select your table number for direct table delivery.'}
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
                  {subtotal >= 1000 ? '🎉 You unlocked FREE delivery!' : `Add ₱${1000 - subtotal} more for FREE delivery`}
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
            <Text style={styles.cardHeaderTitle}>Order Items ({items.length})</Text>
            <TouchableOpacity onPress={clearCart}>
              <Text style={styles.clearCartText}>Clear All</Text>
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
                        size={16}
                        color={item.quantity === 1 ? Colors.error : Colors.text}
                      />
                    </TouchableOpacity>

                    <Text style={styles.qtyText}>{item.quantity}</Text>

                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updateQuantity(item.cartItemId, 1)}
                      hitSlop={8}
                    >
                      <Ionicons name="add" size={16} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Promo Code Box */}
        <View style={styles.promoCard}>
          <Text style={styles.cardHeaderTitle}>Promotions & Coupons</Text>
          {promoCode ? (
            <View style={styles.activePromoRow}>
              <View style={styles.activePromoLeft}>
                <Ionicons name="pricetag" size={18} color={Colors.halalGreen} />
                <View>
                  <Text style={styles.appliedCode}>{promoCode}</Text>
                  <Text style={styles.appliedSavings}>Saved ₱{discountAmount.toLocaleString()}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={removePromoCode}>
                <Ionicons name="close-circle" size={20} color={Colors.error} />
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

          {/* Quick Coupons suggestion */}
          {!promoCode && (
            <View style={styles.quickCouponsRow}>
              <TouchableOpacity
                style={styles.quickCouponPill}
                onPress={() => {
                  setPromoInput('HASAN10');
                  applyPromoCode('HASAN10');
                }}
              >
                <Text style={styles.quickCouponText}>🏷️ HASAN10 (10% OFF)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickCouponPill}
                onPress={() => {
                  setPromoInput('HALALFIRST');
                  applyPromoCode('HALALFIRST');
                }}
              >
                <Text style={styles.quickCouponText}>🎁 HALALFIRST (₱50 OFF)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bill Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardHeaderTitle}>Payment Breakdown</Text>

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
                {deliveryFee === 0 ? <Text style={styles.freeText}>FREE</Text> : `₱${deliveryFee}`}
              </Text>
            </View>
          )}

          {deliveryType === 'dine_in' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Dine-In Service (5%)</Text>
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
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalVal}>₱{total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Checkout Footer */}
      <View style={styles.footerContainer}>
        <View style={styles.footerTotalCol}>
          <Text style={styles.footerTotalLabel}>Total Amount</Text>
          <Text style={styles.footerTotalAmount}>₱{total.toLocaleString()}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.checkoutBtn}
          onPress={handleProceedToCheckout}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.textLight} />
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: Radius.round,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptySub: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    gap: 8,
    ...Shadows.card,
  },
  browseButtonText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.md,
  },
  diningTypeCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.subtle,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeaderTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
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
    backgroundColor: '#F9F8F6',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 10,
    gap: 6,
  },
  activeTypeButton: {
    backgroundColor: '#FFEBEE',
    borderColor: Colors.primary,
  },
  typeEmoji: {
    fontSize: 14,
  },
  typeLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeTypeLabel: {
    color: Colors.primary,
  },
  dineInNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
    gap: 8,
  },
  dineInNoticeText: {
    flex: 1,
    fontSize: 11,
    color: Colors.saffronDark,
  },
  pickTableLink: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  freeDeliveryProgressBar: {
    marginTop: Spacing.sm,
    backgroundColor: '#F0F9F0',
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
    fontWeight: '700',
    color: Colors.halalGreenDark,
  },
  deliveryProgressPct: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.halalGreenDark,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#D1E7DD',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.halalGreen,
    borderRadius: 3,
  },
  itemsCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.subtle,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  itemsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  clearCartText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  itemImage: {
    width: 65,
    height: 65,
    borderRadius: Radius.md,
    backgroundColor: '#F0EFEA',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
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
    color: Colors.saffronDark,
    fontWeight: '600',
  },
  addonsText: {
    fontSize: 10,
    color: Colors.textSecondary,
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
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.primary,
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F4F0',
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
    fontWeight: '700',
    color: Colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  promoCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.subtle,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promoInput: {
    flex: 1,
    backgroundColor: '#F9F8F6',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.xs,
    color: Colors.text,
    height: 40,
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
    fontWeight: '600',
  },
  activePromoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
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
    fontWeight: '800',
    color: Colors.halalGreenDark,
  },
  appliedSavings: {
    fontSize: 10,
    color: Colors.halalGreen,
    fontWeight: '600',
  },
  quickCouponsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.sm,
  },
  quickCouponPill: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.round,
  },
  quickCouponText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.saffronDark,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.subtle,
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
    fontWeight: '600',
    color: Colors.text,
  },
  freeText: {
    color: Colors.halalGreen,
    fontWeight: '800',
  },
  discountLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.halalGreen,
    fontWeight: '600',
  },
  discountVal: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.halalGreen,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
  },
  grandTotalVal: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '900',
    color: Colors.primary,
  },
  footerContainer: {
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
  footerTotalCol: {},
  footerTotalLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  footerTotalAmount: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '900',
    color: Colors.primary,
  },
  checkoutBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    gap: 8,
    ...Shadows.card,
  },
  checkoutBtnText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontSize: Typography.fontSize.sm,
  },
});
