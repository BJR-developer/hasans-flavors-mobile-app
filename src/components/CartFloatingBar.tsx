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
    <View style={styles.wrapper}>
      <TouchableOpacity activeOpacity={0.9} style={styles.bar} onPress={handlePress}>
        <View style={styles.left}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{itemCount}</Text>
          </View>
          <View>
            <Text style={styles.itemsLabel}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
            </Text>
            <Text style={styles.viewCartHint}>Tap to view & checkout</Text>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={styles.totalText}>₱{total.toLocaleString()}</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.textLight} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 99,
  },
  bar: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.elevated,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    backgroundColor: Colors.textLight,
    width: 28,
    height: 28,
    borderRadius: Radius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  itemsLabel: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.sm,
  },
  viewCartHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontSize: Typography.fontSize.md,
  },
});
