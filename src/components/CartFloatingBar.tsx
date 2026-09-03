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
          <Text style={styles.itemsLabel}>
            View Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.totalText}>₱{total.toLocaleString()}</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 99,
  },
  bar: {
    backgroundColor: Colors.text,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.elevated,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: Radius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: 11,
  },
  itemsLabel: {
    color: Colors.textLight,
    fontWeight: '600',
    fontSize: Typography.fontSize.sm,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.sm,
  },
});
