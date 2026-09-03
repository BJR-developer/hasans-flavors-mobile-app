import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { DishCard } from '@/components/DishCard';
import { CartFloatingBar } from '@/components/CartFloatingBar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useMenuStore } from '@/store/useMenuStore';
import { useTableStore } from '@/store/useTableStore';
import { useCartStore } from '@/store/useCartStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.86, 360);
const CARD_GAP = 8;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const SIDE_SPACER = (width - CARD_WIDTH) / 2 - CARD_GAP / 2;
const LOOP_MULTIPLIER = 80;

export default function HomeScreen() {
  const router = useRouter();
  const { dishes, categories, selectedCategoryId, setSelectedCategory } = useMenuStore();
  const currentTable = useTableStore((state) => state.currentTable);
  const itemCount = useCartStore((state) => state.getItemCount());

  // Featured Carousel Raw Items (5 items)
  const featuredDishes = useMemo(
    () => dishes.filter((d) => d.isChefSpecial || d.isPopular).slice(0, 5),
    [dishes]
  );
  const chefSpecials = dishes.filter((d) => d.isChefSpecial).slice(0, 6);
  const popularDishes = dishes.filter((d) => d.isPopular).slice(0, 8);

  // Infinite Virtual Looped Data Array
  const virtualData = useMemo(() => {
    if (featuredDishes.length === 0) return [];
    const items = [];
    for (let i = 0; i < LOOP_MULTIPLIER; i++) {
      for (let j = 0; j < featuredDishes.length; j++) {
        items.push({
          ...featuredDishes[j],
          virtualIndex: i * featuredDishes.length + j,
          realIndex: j,
          virtualId: `virt-${i}-${j}-${featuredDishes[j].id}`,
        });
      }
    }
    return items;
  }, [featuredDishes]);

  // Initial index set to the middle so user can scroll left or right infinitely
  const initialIndex = useMemo(() => {
    if (featuredDishes.length === 0) return 0;
    return Math.floor(LOOP_MULTIPLIER / 2) * featuredDishes.length;
  }, [featuredDishes.length]);

  const currentVirtualIndexRef = useRef(initialIndex);
  const carouselRef = useRef<Animated.FlatList>(null);
  const scrollX = useRef(new Animated.Value(initialIndex * SNAP_INTERVAL)).current;
  const isUserInteractingRef = useRef(false);

  // Auto-scroll loop every 4.5 seconds
  useEffect(() => {
    if (featuredDishes.length <= 1) return;

    const timer = setInterval(() => {
      if (isUserInteractingRef.current) return;
      const nextIndex = currentVirtualIndexRef.current + 1;
      currentVirtualIndexRef.current = nextIndex;
      carouselRef.current?.scrollToOffset({
        offset: nextIndex * SNAP_INTERVAL,
        animated: true,
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [featuredDishes.length]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SNAP_INTERVAL);
        currentVirtualIndexRef.current = index;
      },
    }
  );

  const handleCategorySelect = (id: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
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
          { paddingBottom: itemCount > 0 ? 190 : 140 },
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

        {/* Search Bar */}
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

        {/* Infinite Looping Peeking Theatre Carousel */}
        <View style={styles.carouselSection}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.largeSectionTitle}>Featured Specials</Text>
              <Text style={styles.sectionSub}>Handcrafted heirloom recommendations</Text>
            </View>
          </View>

          <Animated.FlatList
            ref={carouselRef as any}
            data={virtualData}
            keyExtractor={(item: any) => item.virtualId}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="start"
            initialScrollIndex={initialIndex}
            contentContainerStyle={styles.carouselContentContainer}
            onScrollBeginDrag={() => {
              isUserInteractingRef.current = true;
            }}
            onScrollEndDrag={() => {
              setTimeout(() => {
                isUserInteractingRef.current = false;
              }, 2000);
            }}
            onMomentumScrollEnd={() => {
              setTimeout(() => {
                isUserInteractingRef.current = false;
              }, 1500);
            }}
            getItemLayout={(data, index) => ({
              length: SNAP_INTERVAL,
              offset: SNAP_INTERVAL * index,
              index,
            })}
            renderItem={({ item, index }: any) => {
              // Theatre Effect Interpolation with tight gap
              const inputRange = [
                (index - 1) * SNAP_INTERVAL,
                index * SNAP_INTERVAL,
                (index + 1) * SNAP_INTERVAL,
              ];

              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.91, 1, 0.91],
                extrapolate: 'clamp',
              });

              const translateY = scrollX.interpolate({
                inputRange,
                outputRange: [6, 0, 6],
                extrapolate: 'clamp',
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.8, 1, 0.8],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  style={[
                    styles.cardWrapper,
                    {
                      width: CARD_WIDTH,
                      marginHorizontal: CARD_GAP / 2,
                      transform: [{ scale }, { translateY }],
                      opacity,
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.92}
                    style={styles.carouselCard}
                    onPress={() => router.push(`/dish/${item.id}` as any)}
                  >
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.carouselImage}
                      resizeMode="cover"
                    />
                    <View style={styles.carouselOverlay}>
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
                </Animated.View>
              );
            }}
          />
        </View>

        {/* Categories Section with Image and Name */}
        <View style={styles.categorySection}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.largeSectionTitle}>Categories</Text>
              <Text style={styles.sectionSub}>Explore dishes by preparation</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/menu' as any)} hitSlop={8}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryCardItem}
                  onPress={() => handleCategorySelect(cat.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.categoryImageWrapper, isSelected && styles.categoryImageWrapperActive]}>
                    <Image
                      source={{
                        uri:
                          cat.imageUrl ||
                          'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80',
                      }}
                      style={styles.categoryImage}
                      resizeMode="cover"
                    />
                  </View>
                  <Text
                    style={[styles.categoryNameText, isSelected && styles.categoryNameTextActive]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Chef Selection Section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.largeSectionTitle}>Chef's Selection</Text>
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
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.largeSectionTitle}>Popular Food</Text>
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
    paddingBottom: 140,
  },
  tableStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
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
    fontFamily: Typography.fontFamily.medium,
  },
  tableStatusBold: {
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  tableStatusAction: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  roundedSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    height: 50,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    ...Shadows.subtle,
  },
  searchIconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.round,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily.medium,
  },
  filterIconCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  carouselSection: {
    marginTop: Spacing.lg,
  },
  carouselContentContainer: {
    paddingHorizontal: SIDE_SPACER,
    paddingVertical: Spacing.xs,
  },
  cardWrapper: {
    height: 220,
    justifyContent: 'center',
  },
  carouselCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    height: 210,
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
    backgroundColor: 'rgba(0,0,0,0.38)',
    padding: Spacing.lg,
    justifyContent: 'flex-end',
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
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    letterSpacing: -0.3,
  },
  carouselDishSub: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
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
    fontFamily: Typography.fontFamily.extraBold,
  },
  categorySection: {
    marginTop: Spacing.md,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 14,
    paddingVertical: Spacing.xs,
  },
  categoryCardItem: {
    alignItems: 'center',
    gap: 6,
    width: 72,
  },
  categoryImageWrapper: {
    width: 62,
    height: 62,
    borderRadius: Radius.round,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  categoryImageWrapperActive: {
    borderColor: Colors.primary,
    borderWidth: 2.5,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryNameText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  categoryNameTextActive: {
    color: Colors.primary,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  largeSectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
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
