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
import { SpiceMeter } from '@/components/SpiceMeter';
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Image Container */}
        <View style={styles.heroImageWrapper}>
          <Image source={{ uri: dish.imageUrl }} style={styles.heroImage} resizeMode="cover" />

          {/* Top Bar Floating Buttons */}
          <SafeAreaView style={styles.floatingTopBar} edges={['top']}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={Colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                toggleFavorite(dish.id);
              }}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={22}
                color={isFav ? Colors.primary : Colors.text}
              />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Dietary & Halal Badges */}
          <View style={styles.badgeRow}>
            {dish.isHalal && (
              <View style={styles.halalBadge}>
                <Text style={styles.halalBadgeText}>حلال 100% HALAL</Text>
              </View>
            )}
            {dish.isChefSpecial && (
              <View style={styles.specialBadge}>
                <Text style={styles.specialBadgeText}>⭐ CHEF'S SIGNATURE</Text>
              </View>
            )}
          </View>
        </View>

        {/* Dish Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.categoryRatingRow}>
            <Text style={styles.categoryText}>{dish.category}</Text>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={14} color="#FFA000" />
              <Text style={styles.ratingText}>{dish.rating}</Text>
              <Text style={styles.reviewCount}>({dish.reviewCount} reviews)</Text>
            </View>
          </View>

          <Text style={styles.dishName}>{dish.name}</Text>
          <Text style={styles.dishPrice}>{dish.formattedPrice}</Text>

          <Text style={styles.description}>{dish.description}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color={Colors.saffronDark} />
              <Text style={styles.statLabel}>{dish.preparationTime}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={16} color={Colors.primary} />
              <Text style={styles.statLabel}>{dish.calories}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.halalGreen} />
              <Text style={styles.statLabel}>Fresh Everyday</Text>
            </View>
          </View>
        </View>

        {/* Portion Size Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Select Portion Size</Text>
          <Text style={styles.sectionSub}>Choose portion size for this dish</Text>

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
          <Text style={styles.sectionTitle}>2. Choose Spice Level</Text>
          <Text style={styles.sectionSub}>Adjust chili heat according to your preference</Text>

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
                  <Text style={styles.spiceEmoji}>{s.icon}</Text>
                  <Text style={[styles.spiceLevelName, selected && styles.spiceLevelNameSelected]}>
                    {s.label}
                  </Text>
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
          <Text style={styles.sectionTitle}>3. Pair with Sides & Add-ons</Text>
          <Text style={styles.sectionSub}>Optional sides to elevate your meal</Text>

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
                      {selected && <Ionicons name="checkmark" size={14} color={Colors.textLight} />}
                    </View>
                    <Text style={[styles.optionTitle, selected && styles.selectedOptionTitle]}>
                      {addon.name}
                    </Text>
                  </View>

                  <Text style={[styles.optionDelta, selected && styles.selectedOptionDelta]}>
                    +₱{addon.price}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Kitchen Special Request */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>4. Kitchen Cooking Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="E.g. No raw onions, less oil, gravy on side..."
            placeholderTextColor={Colors.textMuted}
            value={specialNotes}
            onChangeText={setSpecialNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      {/* Sticky Bottom Add to Cart Bar */}
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
            >
              <Ionicons name="remove" size={18} color={quantity === 1 ? Colors.textMuted : Colors.text} />
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
            >
              <Ionicons name="add" size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Add to Cart CTA */}
          <TouchableOpacity activeOpacity={0.9} style={styles.addToCartBtn} onPress={handleAddToCart}>
            <View>
              <Text style={styles.addToCartText}>Add to Cart</Text>
              <Text style={styles.addToCartSub}>
                {selectedPortion.name} • {selectedAddons.length} addons
              </Text>
            </View>
            <Text style={styles.totalPriceText}>₱{totalPrice.toLocaleString()}</Text>
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
  scrollContent: {
    paddingBottom: 110,
  },
  heroImageWrapper: {
    position: 'relative',
    height: 300,
    width: '100%',
    backgroundColor: '#EAE8E3',
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
    paddingHorizontal: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.subtle,
  },
  badgeRow: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    gap: 8,
  },
  halalBadge: {
    backgroundColor: Colors.halalGreen,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  halalBadgeText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  specialBadge: {
    backgroundColor: Colors.saffron,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  specialBadgeText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontSize: 11,
  },
  infoCard: {
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  categoryRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.saffronDark,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  dishName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '900',
    color: Colors.text,
    marginVertical: 4,
  },
  dishPrice: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '900',
    color: Colors.primary,
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
    backgroundColor: '#F9F8F6',
    borderRadius: Radius.md,
    padding: Spacing.md,
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionSub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
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
    backgroundColor: '#FAF9F8',
  },
  selectedOptionRow: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF8F8',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSquareActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedOptionTitle: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  optionServes: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  optionDelta: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  selectedOptionDelta: {
    color: Colors.primary,
  },
  spiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  spiceCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FAF9F8',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  spiceCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF8F8',
  },
  spiceEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  spiceLevelName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  spiceLevelNameSelected: {
    color: Colors.primary,
  },
  spiceDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  notesInput: {
    backgroundColor: '#FAF9F8',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: Typography.fontSize.xs,
    color: Colors.text,
    textAlignVertical: 'top',
    height: 80,
  },
  footerSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 12,
    ...Shadows.elevated,
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F4F0',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  qtyNumber: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.card,
  },
  addToCartText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontSize: Typography.fontSize.sm,
  },
  addToCartSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
  },
  totalPriceText: {
    color: Colors.textLight,
    fontWeight: '900',
    fontSize: Typography.fontSize.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.error,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  backButtonText: {
    color: Colors.textLight,
    fontWeight: '700',
  },
});
