import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { CategoryPill } from '@/components/CategoryPill';
import { DishCard } from '@/components/DishCard';
import { CartFloatingBar } from '@/components/CartFloatingBar';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useMenuStore } from '@/store/useMenuStore';
import { useCartStore } from '@/store/useCartStore';
import * as Haptics from 'expo-haptics';

export default function MenuScreen() {
  const {
    dishes,
    categories,
    selectedCategoryId,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    selectedSpiceFilter,
    setSpiceFilter,
    onlyChefSpecial,
    toggleChefSpecialFilter,
    getFilteredDishes,
  } = useMenuStore();

  const itemCount = useCartStore((state) => state.getItemCount());
  const [layoutMode, setLayoutMode] = useState<'grid' | 'horizontal'>('grid');
  const filteredDishes = getFilteredDishes();

  const spiceFilters = [
    { level: null, label: 'All Spices' },
    { level: 1, label: 'Mild' },
    { level: 2, label: 'Medium' },
    { level: 3, label: 'Spicy' },
    { level: 4, label: 'Fiery' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header />

      <View style={styles.container}>
        {/* Search & Layout Toggle */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search biryani, karahi, kabab..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.layoutToggle}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setLayoutMode(layoutMode === 'grid' ? 'horizontal' : 'grid');
            }}
          >
            <Ionicons
              name={layoutMode === 'grid' ? 'list-outline' : 'grid-outline'}
              size={18}
              color={Colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Category Filter Pills */}
        <View style={styles.categoryBar}>
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
                onSelect={setSelectedCategory}
              />
            ))}
          </ScrollView>
        </View>

        {/* Secondary Filter Chips */}
        <View style={styles.filterChipsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            <TouchableOpacity
              style={[styles.chip, onlyChefSpecial && styles.activeChip]}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                toggleChefSpecialFilter();
              }}
            >
              <Text style={[styles.chipText, onlyChefSpecial && styles.activeChipText]}>
                Chef's Selection
              </Text>
            </TouchableOpacity>

            {spiceFilters.map((s, idx) => {
              const active = selectedSpiceFilter === s.level;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.chip, active && styles.activeChip]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setSpiceFilter(s.level);
                  }}
                >
                  <Text style={[styles.chipText, active && styles.activeChipText]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Results Count & Reset Filter */}
        <View style={styles.resultsInfoRow}>
          <Text style={styles.resultsCount}>
            Showing <Text style={styles.bold}>{filteredDishes.length}</Text> dishes
          </Text>
          {(searchQuery || selectedSpiceFilter !== null || onlyChefSpecial || selectedCategoryId !== 'all') && (
            <TouchableOpacity
              onPress={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setSpiceFilter(null);
                if (onlyChefSpecial) toggleChefSpecialFilter();
              }}
              hitSlop={6}
            >
              <Text style={styles.resetFiltersText}>Reset filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dish List / Grid */}
        {filteredDishes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No dishes found</Text>
            <Text style={styles.emptySub}>Try searching for something else or reset your active filters</Text>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setSpiceFilter(null);
              }}
            >
              <Text style={styles.resetButtonText}>View All Dishes</Text>
            </TouchableOpacity>
          </View>
        ) : layoutMode === 'grid' ? (
          <ScrollView
            style={styles.dishesScrollView}
            contentContainerStyle={[
              styles.gridContent,
              { paddingBottom: itemCount > 0 ? 190 : 140 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.gridWrapper}>
              {filteredDishes.map((dish) => (
                <View key={dish.id} style={styles.gridItemWrapper}>
                  <DishCard dish={dish} layout="grid" />
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={filteredDishes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <DishCard dish={item} layout="horizontal" />}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: itemCount > 0 ? 190 : 140 },
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

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
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    ...Shadows.subtle,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  layoutToggle: {
    width: 44,
    height: 44,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.subtle,
  },
  categoryBar: {
    paddingVertical: Spacing.xs,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.lg,
  },
  filterChipsRow: {
    paddingVertical: Spacing.xs,
  },
  chipsScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeChip: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryMuted,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeChipText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  resultsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  resultsCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  bold: {
    fontWeight: '700',
    color: Colors.text,
  },
  resetFiltersText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  dishesScrollView: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItemWrapper: {
    width: '48.5%',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  resetButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  resetButtonText: {
    color: Colors.textLight,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
});
