import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useMenuStore } from '@/store/useMenuStore';
import { useCartStore } from '@/store/useCartStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { ADDON_OPTIONS, PORTION_OPTIONS, SPICE_LEVELS } from '@/data/options';
import { AddonOption, PortionOption } from '@/types';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function DishDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dish = useMenuStore((state) => state.getDishById(id));
  const addItem = useCartStore((state) => state.addItem);
  const { favoriteIds, toggleFavorite } = useFavoritesStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedPortion, setSelectedPortion] = useState<PortionOption>(PORTION_OPTIONS[0]);
  const [selectedSpiceLevel, setSelectedSpiceLevel] = useState<number>(dish?.spiceLevel || 2);
  const [selectedAddons, setSelectedAddons] = useState<AddonOption[]>([]);
  const [specialNotes, setSpecialNotes] = useState('');

  if (!dish) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Dish not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isFav = favoriteIds.includes(dish.id);

  // Price calculations
  const unitPrice = dish.price + selectedPortion.priceDelta + selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const totalPrice = unitPrice * quantity;

  const handleToggleAddon = (addon: AddonOption) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    const exists = selectedAddons.some((a) => a.id === addon.id);
    if (exists) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleAddToCart = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    addItem(dish, quantity, selectedPortion, selectedSpiceLevel, selectedAddons, specialNotes);
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image */}
        <View style={styles.heroImageWrapper}>
          <Image source={{ uri: dish.imageUrl }} style={styles.heroImage} resizeMode="cover" />

          {/* Floating Top Navigation */}
          <SafeAreaView style={styles.floatingTopBar} edges={['top']}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color={Colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                toggleFavorite(dish.id);
              }}
              hitSlop={8}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={20}
                color={isFav ? Colors.primary : Colors.text}
              />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Subtle Tag */}
          {dish.isChefSpecial && (
            <View style={styles.specialBadge}>
              <Text style={styles.specialBadgeText}>CHEF'S SELECTION</Text>
            </View>
          )}
        </View>

        {/* Dish Info Header */}
        <View style={styles.infoCard}>
          <View style={styles.categoryRatingRow}>
            <Text style={styles.categoryText}>{dish.category}</Text>
            {dish.rating && (
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={13} color={Colors.textSecondary} />
                <Text style={styles.ratingText}>{dish.rating}</Text>
                <Text style={styles.reviewCount}>({dish.reviewCount})</Text>
              </View>
            )}
          </View>

          <Text style={styles.dishName}>{dish.name}</Text>
          <Text style={styles.dishPrice}>{dish.formattedPrice}</Text>

          <Text style={styles.description}>{dish.description}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={15} color={Colors.textSecondary} />
              <Text style={styles.statLabel}>{dish.preparationTime}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={15} color={Colors.textSecondary} />
              <Text style={styles.statLabel}>{dish.calories}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="shield-checkmark-outline" size={15} color={Colors.textSecondary} />
              <Text style={styles.statLabel}>Halal Certified</Text>
            </View>
          </View>
        </View>

        {/* Portion Size Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Portion Size</Text>
          <Text style={styles.sectionSub}>Select desired serving size</Text>

          <View style={styles.optionsList}>
            {PORTION_OPTIONS.map((p) => {
              const selected = selectedPortion.id === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.optionRow, selected && styles.selectedOptionRow]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setSelectedPortion(p);
                  }}
                >
                  <View style={styles.optionLeft}>
                    <View style={[styles.radioCircle, selected && styles.radioCircleActive]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                    <View>
                      <Text style={[styles.optionTitle, selected && styles.selectedOptionTitle]}>
                        {p.name}
                      </Text>
                      <Text style={styles.optionServes}>Serves: {p.serves}</Text>
                    </View>
                  </View>

                  <Text style={[styles.optionDelta, selected && styles.selectedOptionDelta]}>
                    {p.priceDelta === 0 ? 'Included' : `+₱${p.priceDelta}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Spice Level Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Spice Level</Text>
          <Text style={styles.sectionSub}>Adjust heat to your taste</Text>

          <View style={styles.spiceGrid}>
            {SPICE_LEVELS.map((s) => {
              const selected = selectedSpiceLevel === s.level;
              return (
                <TouchableOpacity
                  key={s.level}
                  style={[styles.spiceCard, selected && styles.spiceCardSelected]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setSelectedSpiceLevel(s.level);
                  }}
                >
                  <View style={styles.spiceCardHeader}>
                    <Text style={[styles.spiceLevelName, selected && styles.spiceLevelNameSelected]}>
                      {s.label}
                    </Text>
                    <Ionicons
                      name="flame"
                      size={14}
                      color={selected ? Colors.primary : Colors.border}
                    />
                  </View>
                  <Text style={styles.spiceDesc} numberOfLines={2}>
                    {s.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Extra Addons Checklist */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sides & Add-ons</Text>
          <Text style={styles.sectionSub}>Optional sides to complete your meal</Text>

          <View style={styles.optionsList}>
            {ADDON_OPTIONS.map((addon) => {
              const selected = selectedAddons.some((a) => a.id === addon.id);
              return (
                <TouchableOpacity
                  key={addon.id}
                  style={[styles.optionRow, selected && styles.selectedOptionRow]}
                  onPress={() => handleToggleAddon(addon)}
                >
                  <View style={styles.optionLeft}>
                    <View style={[styles.checkboxSquare, selected && styles.checkboxSquareActive]}>
                      {selected && <Ionicons name="checkmark" size={12} color={Colors.textLight} />}
                    </View>
                    <Text style={[styles.optionTitle, selected && styles.selectedOptionTitle]}>
                      {addon.name}
                    </Text>
                  </View>

                  <Text style={[styles.optionDelta, selected && styles.selectedOptionDelta]}>
                    +₱${addon.price}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Kitchen Cooking Notes */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="E.g. less oil, gravy on side..."
            placeholderTextColor={Colors.textMuted}
            value={specialNotes}
            onChangeText={setSpecialNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      {/* Docked Sticky Bottom Add to Cart Bar */}
      <SafeAreaView style={styles.footerSafeArea} edges={['bottom']}>
        <View style={styles.footer}>
          {/* Quantity Stepper */}
          <View style={styles.quantityStepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => {
                if (quantity > 1) {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setQuantity(quantity - 1);
                }
              }}
              hitSlop={6}
            >
              <Ionicons name="remove" size={16} color={quantity === 1 ? Colors.textMuted : Colors.text} />
            </TouchableOpacity>

            <Text style={styles.qtyNumber}>{quantity}</Text>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                setQuantity(quantity + 1);
              }}
              hitSlop={6}
            >
              <Ionicons name="add" size={16} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Add to Cart CTA */}
          <TouchableOpacity activeOpacity={0.88} style={styles.addToCartBtn} onPress={handleAddToCart}>
            <Text style={styles.addToCartText}>
              Add to Cart • ₱{totalPrice.toLocaleString()}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  heroImageWrapper: {
    position: 'relative',
    height: 280,
    width: '100%',
    backgroundColor: Colors.surface,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  floatingTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.round,
    backgroundColor: Colors.glassBg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  specialBadgeText: {
    color: Colors.textLight,
    fontWeight: '600',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  infoCard: {
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  dishName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
    marginVertical: 4,
  },
  dishPrice: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionSub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    marginTop: 2,
  },
  optionsList: {
    gap: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  selectedOptionRow: {
    borderColor: Colors.text,
    backgroundColor: Colors.card,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  radioCircleActive: {
    borderColor: Colors.text,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text,
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSquareActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  optionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  selectedOptionTitle: {
    fontWeight: '600',
  },
  optionServes: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  optionDelta: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  selectedOptionDelta: {
    fontWeight: '600',
    color: Colors.text,
  },
  spiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  spiceCard: {
    width: (width - 48) / 2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  spiceCardSelected: {
    borderColor: Colors.text,
    backgroundColor: Colors.card,
  },
  spiceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  spiceLevelName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  spiceLevelNameSelected: {
    color: Colors.text,
  },
  spiceDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: Typography.fontSize.xs,
    color: Colors.text,
    textAlignVertical: 'top',
    height: 70,
  },
  footerSafeArea: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.elevated,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 12,
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 48,
  },
  stepBtn: {
    width: 36,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: Colors.text,
    borderRadius: Radius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  addToCartText: {
    color: Colors.textLight,
    fontWeight: '600',
    fontSize: Typography.fontSize.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.fontSize.md,
    color: Colors.error,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  backButton: {
    backgroundColor: Colors.text,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  backButtonText: {
    color: Colors.textLight,
    fontWeight: '600',
  },
});
