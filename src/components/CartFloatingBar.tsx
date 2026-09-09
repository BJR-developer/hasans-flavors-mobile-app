import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useCartStore } from '@/store/useCartStore';
import * as Haptics from 'expo-haptics';

export const CartFloatingBar: React.FC = () => {
  const router = useRouter();
  const itemCount = useCartStore((state) => state.getItemCount());
  const total = useCartStore((state) => state.getTotal());

  if (itemCount === 0) return null;

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    router.push('/(tabs)/cart' as any);
  };

  return (
    <View style={styles.dockedFooter}>
      <View style={styles.priceCol}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalAmount}>₱{total.toLocaleString()}</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.viewCartBtn}
        onPress={handlePress}
      >
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{itemCount}</Text>
        </View>
        <Text style={styles.viewCartBtnText}>
          View Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </Text>
        <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  dockedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 99,
    ...Shadows.elevated,
  },
  priceCol: {
    gap: 2,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
  },
  totalAmount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
  },
  viewCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.round,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
  },
  viewCartBtnText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
  },
});
