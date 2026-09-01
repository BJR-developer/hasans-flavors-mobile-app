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

  const [layoutMode, setLayoutMode] = useState<'grid' | 'horizontal'>('grid');
  const filteredDishes = getFilteredDishes();

  const spiceFilters = [
    { level: null, label: 'All Spices' },
    { level: 1, label: '🌱 Mild' },
    { level: 2, label: '🌶️ Med' },
    { level: 3, label: '🌶️🌶️ Hot' },
    { level: 4, label: '🔥 Fiery' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header />

      <View style={styles.container}>
        {/* Search & Filter Header */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search 57+ Halal dishes, biryani, karahi..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Layout Mode Toggle */}
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
              name={layoutMode === 'grid' ? 'list' : 'grid'}
              size={20}
              color={Colors.primary}
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

        {/* Secondary Filter Chips: Spice Level & Chef Special */}
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
                ⭐ Chef Specials
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

        {/* Results Count & Active Category */}
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
            >
              <Text style={styles.resetFiltersText}>Reset Filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dish List / Grid */}
        {filteredDishes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🍲</Text>
            <Text style={styles.emptyTitle}>No dishes found</Text>
            <Text style={styles.emptySub}>Try searching for something else or reset your filters</Text>
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
            contentContainerStyle={styles.gridContent}
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
            contentContainerStyle={styles.listContent}
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
    paddingHorizontal: Spacing.md,
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
    height: 46,
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
    width: 46,
    height: 46,
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
    paddingHorizontal: Spacing.md,
  },
  filterChipsRow: {
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  chipsScroll: {
    paddingHorizontal: Spacing.md,
    gap: 6,
  },
  chip: {
    backgroundColor: '#F0EFEA',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeChip: {
    backgroundColor: '#FFEBEE',
    borderColor: Colors.primary,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  resultsCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  bold: {
    fontWeight: '700',
    color: Colors.text,
  },
  resetFiltersText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '700',
  },
  dishesScrollView: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 90,
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
    paddingHorizontal: Spacing.md,
    paddingBottom: 90,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  resetButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  resetButtonText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.sm,
  },
});
