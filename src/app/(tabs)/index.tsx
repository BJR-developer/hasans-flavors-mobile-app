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
  TextInput,
  Keyboard,
  Easing,
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
import { useCartStore } from '@/store/useCartStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.86, 360);
const CARD_GAP = 8;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const SIDE_SPACER = (width - CARD_WIDTH) / 2 - CARD_GAP / 2;
const LOOP_MULTIPLIER = 80;

const POPULAR_SUGGESTIONS = [
  'Biryani',
  'Karahi',
  'Dum Handi',
  'Kabab',
  'Rolls',
  'Chapati',
  'Haleem',
  'Bilao',
];

export default function HomeScreen() {
  const router = useRouter();
  const { dishes, categories, selectedCategoryId, setSelectedCategory } = useMenuStore();
  const itemCount = useCartStore((state) => state.getItemCount());

  // Search State & Animation
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilterCat, setSearchFilterCat] = useState('all');
  const searchInputRef = useRef<TextInput>(null);
  const searchAnim = useRef(new Animated.Value(0)).current;

  // Featured Carousel Raw Items (5 items)
  const featuredDishes = useMemo(
    () => dishes.filter((d) => d.isChefSpecial || d.isPopular).slice(0, 5),
    [dishes]
  );
  const chefSpecials = dishes.filter((d) => d.isChefSpecial).slice(0, 6);
  const popularDishes = dishes.filter((d) => d.isPopular).slice(0, 8);

  // Live Filtered Dishes for Search Mode
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return dishes.filter((dish) => {
      // Category filter inside search
      if (searchFilterCat !== 'all') {
        const cat = categories.find((c) => c.id === searchFilterCat);
        if (cat && cat.match) {
          const reg = new RegExp(cat.match, 'i');
          const matches = reg.test(dish.name) || reg.test(dish.category);
          if (!matches) return false;
        }
      }
      if (!query) return true;
      return (
        dish.name.toLowerCase().includes(query) ||
        dish.category.toLowerCase().includes(query) ||
        dish.description.toLowerCase().includes(query)
      );
    });
  }, [dishes, searchQuery, searchFilterCat, categories]);

  // Infinite Virtual Looped Data Array for Carousel
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
    if (featuredDishes.length <= 1 || isSearchActive) return;

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
  }, [featuredDishes.length, isSearchActive]);

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

  // Activate In-Place Animated Search
  const handleActivateSearch = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setIsSearchActive(true);
    Animated.timing(searchAnim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      searchInputRef.current?.focus();
    });
  };

  // Dismiss / Deactivate Animated Search
  const handleDeactivateSearch = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    Keyboard.dismiss();
    Animated.timing(searchAnim, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setIsSearchActive(false);
      setSearchQuery('');
      setSearchFilterCat('all');
    });
  };

  const handleCategorySelect = (id: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setSelectedCategory(id);
    router.push('/(tabs)/menu' as any);
  };

  // Interpolated animation styles for header and search bar
  const headerHeight = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [52, 0],
  });

  const headerOpacity = searchAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const cancelBtnOpacity = searchAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.2, 1],
  });

  const cancelBtnWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 68],
  });

  // Cross-fade animations between Home Content and Search Results
  const homeOpacity = searchAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const homeTranslateY = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
  });

  const searchOpacity = searchAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.1, 1],
  });

  const searchTranslateY = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Animated Collapsible Profile Header */}
      <Animated.View
        style={[
          styles.headerWrapper,
          {
            height: headerHeight,
            opacity: headerOpacity,
          },
        ]}
      >
        <Header />
      </Animated.View>

      {/* Persistent Animated Search Bar with balanced vertical spacing */}
      <View style={styles.searchBarContainer}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.roundedSearchBar, isSearchActive && styles.roundedSearchBarActive]}
          onPress={!isSearchActive ? handleActivateSearch : undefined}
        >
          <View style={styles.searchIconCircle}>
            <Ionicons name="search" size={16} color={Colors.primary} />
          </View>

          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search dishes, biryanis, curries..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleActivateSearch}
            returnKeyType="search"
            autoCorrect={false}
          />

          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={8}
              style={styles.clearIconBtn}
            >
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : !isSearchActive ? (
            <View style={styles.filterIconCircle}>
              <Ionicons name="options-outline" size={16} color={Colors.textSecondary} />
            </View>
          ) : null}
        </TouchableOpacity>

        {/* Animated Cancel Button */}
        <Animated.View
          style={[
            styles.cancelBtnContainer,
            {
              opacity: cancelBtnOpacity,
              width: cancelBtnWidth,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleDeactivateSearch}
            hitSlop={8}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Dual Layer Cross-Fading Body Container */}
      <View style={styles.bodyLayerContainer}>
        {/* Layer 1: Home Screen Main Content */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: homeOpacity,
              transform: [{ translateY: homeTranslateY }],
            },
          ]}
          pointerEvents={isSearchActive ? 'none' : 'auto'}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: itemCount > 0 ? 190 : 140 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Infinite Looping Peeking Theatre Carousel */}
            <View style={styles.carouselSection}>
              <View style={styles.firstSectionHeaderRow}>
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
        </Animated.View>

        {/* Layer 2: Search Results & Suggestions Screen */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: searchOpacity,
              transform: [{ translateY: searchTranslateY }],
            },
          ]}
          pointerEvents={isSearchActive ? 'auto' : 'none'}
        >
          <ScrollView
            style={styles.searchResultsContainer}
            contentContainerStyle={[
              styles.searchScrollContent,
              { paddingBottom: itemCount > 0 ? 190 : 140 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Search Categories Filter Pills */}
            <View style={styles.searchCategoryPills}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.searchCatScroll}
              >
                {categories.map((cat) => {
                  const isActive = searchFilterCat === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.searchCatChip, isActive && styles.searchCatChipActive]}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {}
                        setSearchFilterCat(cat.id);
                      }}
                    >
                      <Text
                        style={[
                          styles.searchCatChipText,
                          isActive && styles.searchCatChipTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* If Search Query is Empty -> Show Quick Suggestions */}
            {searchQuery.trim().length === 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.suggestionsTitle}>Popular Searches</Text>
                <View style={styles.suggestionsGrid}>
                  {POPULAR_SUGGESTIONS.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={styles.suggestionTag}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {}
                        setSearchQuery(tag);
                      }}
                    >
                      <Ionicons name="trending-up-outline" size={13} color={Colors.primary} />
                      <Text style={styles.suggestionTagText}>{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Results Summary Header */}
            <View style={styles.resultsHeaderRow}>
              <Text style={styles.resultsCountText}>
                {searchQuery.trim()
                  ? `Found ${searchResults.length} ${searchResults.length === 1 ? 'dish' : 'dishes'} for "${searchQuery}"`
                  : `Showing all dishes (${searchResults.length})`}
              </Text>
            </View>

            {/* Results Grid or Empty State */}
            {searchResults.length === 0 ? (
              <View style={styles.emptySearchContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="search-outline" size={32} color={Colors.textMuted} />
                </View>
                <Text style={styles.emptySearchTitle}>No dishes found</Text>
                <Text style={styles.emptySearchSub}>
                  We couldn't find anything matching "{searchQuery}". Try searching for biryani, karahi, or kababs.
                </Text>
                <TouchableOpacity
                  style={styles.clearSearchBtn}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.clearSearchBtnText}>View All Dishes</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.dishesGrid}>
                {searchResults.map((dish) => (
                  <View key={dish.id} style={styles.gridItemWrapper}>
                    <DishCard dish={dish} layout="grid" />
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>

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
  headerWrapper: {
    overflow: 'hidden',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 4,
    paddingBottom: 8,
  },
  roundedSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.sm,
    height: 48,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    ...Shadows.subtle,
  },
  roundedSearchBarActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
  },
  searchIconCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.round,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontFamily: Typography.fontFamily.medium,
    height: '100%',
    paddingVertical: 0,
  },
  clearIconBtn: {
    padding: 6,
    marginRight: 2,
  },
  filterIconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  cancelBtnContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  cancelBtn: {
    paddingLeft: Spacing.md,
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  bodyLayerContainer: {
    flex: 1,
    position: 'relative',
  },
  searchResultsContainer: {
    flex: 1,
  },
  searchScrollContent: {
    paddingTop: Spacing.xs,
  },
  searchCategoryPills: {
    paddingVertical: Spacing.xs,
  },
  searchCatScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  searchCatChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchCatChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  searchCatChipText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  searchCatChipTextActive: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: '700',
  },
  suggestionsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.round,
    ...Shadows.subtle,
  },
  suggestionTagText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text,
  },
  resultsHeaderRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  resultsCountText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptySearchTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  emptySearchSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  clearSearchBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: Radius.round,
  },
  clearSearchBtnText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  carouselSection: {
    marginTop: 0,
  },
  carouselContentContainer: {
    paddingHorizontal: SIDE_SPACER,
    paddingVertical: 0,
  },
  cardWrapper: {
    height: 210,
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
    marginTop: Spacing.xl,
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
  firstSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginHorizontal: Spacing.lg,
    marginTop: 6,
    marginBottom: 8,
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
