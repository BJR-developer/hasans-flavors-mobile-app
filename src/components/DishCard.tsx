import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Dish } from '@/types';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useCartStore } from '@/store/useCartStore';
import * as Haptics from 'expo-haptics';

interface DishCardProps {
  dish: Dish;
  layout?: 'grid' | 'horizontal';
  onPress?: () => void;
}

export const DishCard: React.FC<DishCardProps> = ({ dish, layout = 'grid', onPress }) => {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const isOutOfStock = !dish.inStock;

  const handlePress = () => {
    if (isOutOfStock) return;
    if (onPress) {
      onPress();
    } else {
      router.push(`/dish/${dish.id}` as any);
    }
  };

  const handleQuickAdd = (e: any) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    addItem(dish, 1);
  };

  if (layout === 'horizontal') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        disabled={isOutOfStock}
        style={[styles.horizontalCard, isOutOfStock && styles.outOfStockCard]}
        onPress={handlePress}
      >
        <Image source={{ uri: dish.imageUrl }} style={styles.horizontalImage} resizeMode="cover" />

        <View style={styles.horizontalContent}>
          <Text style={styles.categoryText} numberOfLines={1}>
            {dish.category}
          </Text>

          <Text style={styles.dishTitle} numberOfLines={1}>
            {dish.name}
          </Text>

          <Text style={styles.dishDescription} numberOfLines={2}>
            {dish.description}
          </Text>

          <View style={styles.footerRow}>
            <Text style={styles.price}>{dish.formattedPrice}</Text>

            {!isOutOfStock ? (
              <TouchableOpacity style={styles.addButton} onPress={handleQuickAdd} hitSlop={6}>
                <Ionicons name="add" size={16} color={Colors.textLight} />
              </TouchableOpacity>
            ) : (
              <Text style={styles.soldOutText}>Not Available</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      disabled={isOutOfStock}
      style={[styles.gridCard, isOutOfStock && styles.outOfStockCard]}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: dish.imageUrl }} style={styles.gridImage} resizeMode="cover" />
        {isOutOfStock && (
          <View style={styles.notAvailableOverlay}>
            <Text style={styles.notAvailableBadgeText}>Not Available</Text>
          </View>
        )}
      </View>

      <View style={styles.gridContent}>
        <Text style={styles.categoryText} numberOfLines={1}>
          {dish.category}
        </Text>

        <Text style={styles.dishTitle} numberOfLines={1}>
          {dish.name}
        </Text>

        <View style={styles.gridFooter}>
          <Text style={styles.price}>{dish.formattedPrice}</Text>

          {!isOutOfStock ? (
            <TouchableOpacity style={styles.addButton} onPress={handleQuickAdd} hitSlop={6}>
              <Ionicons name="add" size={16} color={Colors.textLight} />
            </TouchableOpacity>
          ) : (
            <Text style={styles.soldOutText}>Not Available</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    ...Shadows.subtle,
  },
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 116,
    ...Shadows.subtle,
  },
  outOfStockCard: {
    opacity: 0.5,
  },
  imageContainer: {
    position: 'relative',
    height: 130,
    width: '100%',
    backgroundColor: Colors.surface,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  horizontalImage: {
    width: 104,
    height: '100%',
    backgroundColor: Colors.surface,
  },
  gridContent: {
    padding: Spacing.md,
    gap: 2,
  },
  horizontalContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  categoryText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dishTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  dishDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 15,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  price: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.round,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.error,
    textTransform: 'uppercase',
  },
  notAvailableOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  notAvailableBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
