import React from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { dishes, categories, selectedCategoryId, setSelectedCategory } = useMenuStore();
  const currentTable = useTableStore((state) => state.currentTable);

  const chefSpecials = dishes.filter((d) => d.isChefSpecial).slice(0, 6);
  const popularDishes = dishes.filter((d) => d.isPopular).slice(0, 8);

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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Table Status (when seated) */}
        {currentTable && (
          <View style={styles.tableStatusBar}>
            <View style={styles.tableStatusLeft}>
              <Ionicons name="restaurant-outline" size={15} color={Colors.textSecondary} />
              <Text style={styles.tableStatusText}>
                Dine-in Order • <Text style={styles.tableStatusBold}>{currentTable}</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/qr-scan' as any)} hitSlop={8}>
              <Text style={styles.tableStatusAction}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Minimal Search Input */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.searchBar}
          onPress={handleSearchFocus}
        >
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search dishes, biryanis, curries...</Text>
        </TouchableOpacity>

        {/* Hero Feature Banner — Single Hero Focal Point */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.heroCard}
          onPress={() => router.push('/dish/4066' as any)}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop',
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroMetaTop}>
              <Text style={styles.heroTag}>FEATURED SPECIAL</Text>
            </View>
            <View style={styles.heroBottomRow}>
              <View style={styles.heroInfo}>
                <Text style={styles.heroTitle}>Chicken 65 Biryani Bilao</Text>
                <Text style={styles.heroSub}>Dum-cooked basmati with spiced boneless chicken</Text>
              </View>
              <View style={styles.heroPriceBadge}>
                <Text style={styles.heroPrice}>₱1,100</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

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
    paddingBottom: 96,
  },
  tableStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontWeight: '600',
    color: Colors.text,
  },
  tableStatusAction: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 46,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    ...Shadows.subtle,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  heroCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    height: 200,
    backgroundColor: Colors.surface,
    position: 'relative',
    ...Shadows.card,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.38)',
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  heroMetaTop: {
    alignSelf: 'flex-start',
  },
  heroTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textLight,
    letterSpacing: 0.8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  heroTitle: {
    color: Colors.textLight,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
    lineHeight: 15,
  },
  heroPriceBadge: {
    backgroundColor: Colors.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  heroPrice: {
    color: Colors.text,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  categorySection: {
    marginTop: Spacing.xl,
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
    fontWeight: '700',
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
    fontWeight: '600',
    color: Colors.textSecondary,
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
