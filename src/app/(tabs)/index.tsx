import React, { useState, useEffect, useRef } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { CategoryPill } from '@/components/CategoryPill';
import { DishCard } from '@/components/DishCard';
import { CartFloatingBar } from '@/components/CartFloatingBar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useMenuStore } from '@/store/useMenuStore';
import { useTableStore } from '@/store/useTableStore';
import { useCartStore } from '@/store/useCartStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.84, 380);
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const SIDE_PEEK = (width - CARD_WIDTH) / 2;

export default function HomeScreen() {
  const router = useRouter();
  const { dishes, categories, selectedCategoryId, setSelectedCategory } = useMenuStore();
  const currentTable = useTableStore((state) => state.currentTable);
  const itemCount = useCartStore((state) => state.getItemCount());

  // Featured Carousel Dishes
  const featuredDishes = dishes.filter((d) => d.isChefSpecial || d.isPopular).slice(0, 5);
  const chefSpecials = dishes.filter((d) => d.isChefSpecial).slice(0, 6);
  const popularDishes = dishes.filter((d) => d.isPopular).slice(0, 8);

  // Carousel Auto-scroll State
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<FlatList>(null);

  useEffect(() => {
    if (featuredDishes.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prevSlide) => {
        const nextSlide = (prevSlide + 1) % featuredDishes.length;
        carouselRef.current?.scrollToOffset({
          offset: nextSlide * SNAP_INTERVAL,
          animated: true,
        });
        return nextSlide;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [featuredDishes.length]);

  const handleCarouselScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    if (slideIndex !== activeSlide && slideIndex >= 0 && slideIndex < featuredDishes.length) {
      setActiveSlide(slideIndex);
    }
  };

  const handleCategorySelect = (id: string) => {
    setSelectedCategory(id);
    router.push('/(tabs)/menu' as any);
  };

  const handleSearchFocus = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    router.push('/(tabs)/menu' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: itemCount > 0 ? 160 : 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Table Status (when seated) */}
        {currentTable && (
          <View style={styles.tableStatusBar}>
            <View style={styles.tableStatusLeft}>
              <Ionicons name="restaurant-outline" size={15} color={Colors.primary} />
              <Text style={styles.tableStatusText}>
                Dine-in Order • <Text style={styles.tableStatusBold}>{currentTable}</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/qr-scan' as any)} hitSlop={8}>
              <Text style={styles.tableStatusAction}>Change Table</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Hero Greeting & Headline Section */}
        <View style={styles.greetingHeader}>
          <View style={styles.greetingTagRow}>
            <Text style={styles.greetingTag}>Khana time! 👋</Text>
          </View>
          <Text style={styles.greetingTitle}>What are you craving?</Text>
        </View>

        {/* Fully Rounded Pill Search Bar */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.roundedSearchBar}
          onPress={handleSearchFocus}
        >
          <View style={styles.searchIconCircle}>
            <Ionicons name="search" size={16} color={Colors.primary} />
          </View>
          <Text style={styles.searchPlaceholder}>Search dishes, biryanis, curries...</Text>
          <View style={styles.filterIconCircle}>
            <Ionicons name="options-outline" size={16} color={Colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* Featured Specials Carousel with Peeking Adjacent Cards */}
        <View style={styles.carouselSection}>
          <View style={styles.carouselHeaderRow}>
            <View style={styles.featuredHeadingGroup}>
              <Text style={styles.sectionTitle}>Featured Specials</Text>
              <Text style={styles.sectionSub}>Hand-crafted royal culinary highlights</Text>
            </View>
          </View>

          <FlatList
            ref={carouselRef}
            data={featuredDishes}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handleCarouselScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="start"
            contentContainerStyle={styles.carouselContentContainer}
            getItemLayout={(data, index) => ({
              length: SNAP_INTERVAL,
              offset: SNAP_INTERVAL * index,
              index,
            })}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.92}
                style={[styles.carouselCard, { width: CARD_WIDTH }]}
                onPress={() => router.push(`/dish/${item.id}` as any)}
              >
                <Image source={{ uri: item.imageUrl }} style={styles.carouselImage} resizeMode="cover" />
                <View style={styles.carouselOverlay}>
                  <View style={styles.carouselMetaTop}>
                    {item.rating ? (
                      <View style={styles.ratingPill}>
                        <Ionicons name="star" size={12} color="#FFA000" />
                        <Text style={styles.ratingPillText}>{item.rating}</Text>
                      </View>
                    ) : (
                      <View />
                    )}
                  </View>

                  <View style={styles.carouselBottomRow}>
                    <View style={styles.carouselInfo}>
                      <Text style={styles.carouselDishTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.carouselDishSub} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                    <View style={styles.carouselPriceBadge}>
                      <Text style={styles.carouselPriceText}>{item.formattedPrice}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />

          {/* Carousel Pagination Dots Indicator */}
          <View style={styles.paginationRow}>
            {featuredDishes.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  activeSlide === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Category Filter Pills */}
        <View style={styles.categorySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => (
              <CategoryPill
                key={cat.id}
                category={cat}
                isSelected={selectedCategoryId === cat.id}
                onSelect={handleCategorySelect}
              />
            ))}
          </ScrollView>
        </View>

        {/* Chef Selection Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Chef's Selection</Text>
            <Text style={styles.sectionSub}>Slow-cooked heirloom specialties</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/menu' as any)} hitSlop={8}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {chefSpecials.map((dish) => (
            <View key={dish.id} style={styles.horizontalCardWrapper}>
              <DishCard dish={dish} layout="grid" />
            </View>
          ))}
        </ScrollView>

        {/* Popular Dishes Grid */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Popular Dishes</Text>
            <Text style={styles.sectionSub}>Most ordered by diners</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/menu' as any)} hitSlop={8}>
            <Text style={styles.seeAllText}>View menu ({dishes.length})</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dishesGrid}>
          {popularDishes.map((dish) => (
            <View key={dish.id} style={styles.gridItemWrapper}>
              <DishCard dish={dish} layout="grid" />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      <CartFloatingBar />
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
    paddingBottom: 120,
  },
  tableStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  tableStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableStatusText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  tableStatusBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
  tableStatusAction: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  greetingHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  greetingTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  greetingTag: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.saffron,
    letterSpacing: 0.2,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.6,
  },
  roundedSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
    height: 52,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    ...Shadows.subtle,
  },
  searchIconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.round,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  filterIconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  carouselSection: {
    marginTop: Spacing.xl,
  },
  carouselHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  featuredHeadingGroup: {
    flex: 1,
  },
  carouselContentContainer: {
    paddingHorizontal: SIDE_PEEK - CARD_GAP / 2,
    paddingVertical: Spacing.xs,
  },
  carouselCard: {
    marginHorizontal: CARD_GAP / 2,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    height: 218,
    backgroundColor: Colors.surface,
    position: 'relative',
    ...Shadows.elevated,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.42)',
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  carouselMetaTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.round,
  },
  ratingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
  },
  carouselBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  carouselInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  carouselDishTitle: {
    color: Colors.textLight,
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  carouselDishSub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  carouselPriceBadge: {
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    ...Shadows.subtle,
  },
  carouselPriceText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
    fontWeight: '900',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: Colors.primary,
  },
  categorySection: {
    marginTop: Spacing.lg,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  horizontalScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  horizontalCardWrapper: {
    width: (width - 48) * 0.48,
  },
  dishesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  gridItemWrapper: {
    width: '48.5%',
  },
});
