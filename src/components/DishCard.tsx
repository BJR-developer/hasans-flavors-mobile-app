import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Dish } from '@/types';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { SpiceMeter } from './SpiceMeter';
import { useCartStore } from '@/store/useCartStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import * as Haptics from 'expo-haptics';

interface DishCardProps {
  dish: Dish;
  layout?: 'grid' | 'horizontal';
  onPress?: () => void;
}

export const DishCard: React.FC<DishCardProps> = ({ dish, layout = 'grid', onPress }) => {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { favoriteIds, toggleFavorite } = useFavoritesStore();
  const isFav = favoriteIds.includes(dish.id);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/dish/${dish.id}` as any);
    }
  };

  const handleQuickAdd = (e: any) => {
    e.stopPropagation();
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    addItem(dish, 1);
  };

  const handleFav = (e: any) => {
    e.stopPropagation();
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    toggleFavorite(dish.id);
  };

  if (layout === 'horizontal') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={[styles.horizontalCard, !dish.inStock && styles.outOfStockCard]}
        onPress={handlePress}
      >
        <Image source={{ uri: dish.imageUrl }} style={styles.horizontalImage} resizeMode="cover" />

        <View style={styles.horizontalContent}>
          <View style={styles.headerRow}>
            {dish.isChefSpecial ? (
              <View style={styles.specialBadge}>
                <Text style={styles.specialBadgeText}>⭐ Chef Pick</Text>
              </View>
            ) : (
              <Text style={styles.categoryText} numberOfLines={1}>
                {dish.category}
              </Text>
            )}
            <TouchableOpacity onPress={handleFav} style={styles.favBtn} hitSlop={10}>
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={18}
                color={isFav ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.dishTitle} numberOfLines={1}>
            {dish.name}
          </Text>

          <Text style={styles.dishDescription} numberOfLines={2}>
            {dish.description}
          </Text>

          <View style={styles.footerRow}>
            <View>
              <Text style={styles.price}>{dish.formattedPrice}</Text>
              <SpiceMeter level={dish.spiceLevel} size="sm" showLabel />
            </View>

            {dish.inStock ? (
              <TouchableOpacity style={styles.quickAddButton} onPress={handleQuickAdd}>
                <Ionicons name="add" size={18} color={Colors.textLight} />
              </TouchableOpacity>
            ) : (
              <View style={styles.soldOutBadge}>
                <Text style={styles.soldOutText}>Sold Out</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.gridCard, !dish.inStock && styles.outOfStockCard]}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: dish.imageUrl }} style={styles.gridImage} resizeMode="cover" />

        {/* Badges Overlay */}
        <View style={styles.badgeOverlay}>
          {dish.isChefSpecial && (
            <View style={styles.specialBadge}>
              <Text style={styles.specialBadgeText}>⭐ Chef Pick</Text>
            </View>
          )}
          {dish.isHalal && (
            <View style={styles.halalBadge}>
              <Text style={styles.halalBadgeText}>حلال HALAL</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={handleFav} style={styles.gridFavBtn} hitSlop={10}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={16}
            color={isFav ? Colors.primary : Colors.textLight}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.gridContent}>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryText} numberOfLines={1}>
            {dish.category}
          </Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={11} color="#FFA000" />
            <Text style={styles.ratingText}>{dish.rating}</Text>
          </View>
        </View>

        <Text style={styles.dishTitle} numberOfLines={1}>
          {dish.name}
        </Text>

        <View style={styles.spiceRow}>
          <SpiceMeter level={dish.spiceLevel} size="sm" showLabel />
          <Text style={styles.prepTime}>⏱️ {dish.preparationTime}</Text>
        </View>

        <View style={styles.gridFooter}>
          <Text style={styles.price}>{dish.formattedPrice}</Text>

          {dish.inStock ? (
            <TouchableOpacity style={styles.quickAddButton} onPress={handleQuickAdd}>
              <Ionicons name="add" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          ) : (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>Sold Out</Text>
            </View>
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
    ...Shadows.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    width: '100%',
  },
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.subtle,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    minHeight: 125,
  },
  outOfStockCard: {
    opacity: 0.6,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    width: '100%',
    backgroundColor: '#F0EFEA',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  horizontalImage: {
    width: 120,
    height: '100%',
    backgroundColor: '#F0EFEA',
  },
  badgeOverlay: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    gap: 4,
  },
  specialBadge: {
    backgroundColor: Colors.saffron,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  specialBadgeText: {
    color: Colors.textLight,
    fontSize: 9,
    fontWeight: '800',
  },
  halalBadge: {
    backgroundColor: Colors.halalGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  halalBadgeText: {
    color: Colors.textLight,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  gridFavBtn: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: Radius.round,
    padding: 5,
  },
  favBtn: {
    padding: 4,
  },
  gridContent: {
    padding: Spacing.sm,
  },
  horizontalContent: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 10,
    color: Colors.saffronDark,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.text,
  },
  dishTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    color: Colors.text,
    marginVertical: 2,
  },
  dishDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
    lineHeight: 15,
  },
  spiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  prepTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '900',
    color: Colors.primary,
  },
  quickAddButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutBadge: {
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  soldOutText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
});
