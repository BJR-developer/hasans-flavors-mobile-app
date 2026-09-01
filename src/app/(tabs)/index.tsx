import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
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
import { useRoleStore } from '@/store/useRoleStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { dishes, categories, selectedCategoryId, setSelectedCategory, setSearchQuery } = useMenuStore();
  const currentTable = useTableStore((state) => state.currentTable);

  const chefSpecials = dishes.filter((d) => d.isChefSpecial).slice(0, 6);
  const popularDishes = dishes.filter((d) => d.isPopular).slice(0, 8);

  const handleCategorySelect = (id: string) => {
    setSelectedCategory(id);
    router.push('/(tabs)/menu' as any);
  };

  const handleSearchFocus = () => {
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
        {/* Dine-In Active Table Banner (if seated) */}
        {currentTable ? (
          <View style={styles.tableActiveBanner}>
            <View style={styles.tableBannerLeft}>
              <View style={styles.tableIconBox}>
                <Ionicons name="restaurant" size={20} color={Colors.textLight} />
              </View>
              <View>
                <Text style={styles.tableBannerTitle}>You are seated at {currentTable}</Text>
                <Text style={styles.tableBannerSub}>Orders will be sent directly to your table</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.changeTableBtn}
              onPress={() => router.push('/qr-scan' as any)}
            >
              <Text style={styles.changeTableBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.qrPromptCard}
            onPress={() => router.push('/qr-scan' as any)}
          >
            <View style={styles.qrIconCircle}>
              <Ionicons name="qr-code-outline" size={22} color={Colors.primary} />
            </View>
            <View style={styles.qrPromptText}>
              <Text style={styles.qrPromptTitle}>Dining at Hasan's Restaurant?</Text>
              <Text style={styles.qrPromptSub}>Scan your table QR code for instant table service</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* Search Bar Input */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.searchContainer}
          onPress={handleSearchFocus}
        >
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search Biryani, Curries, BBQ, Naan...</Text>
          <View style={styles.filterIconBtn}>
            <Ionicons name="options-outline" size={16} color={Colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Hero Banner Carousel / Feature Card */}
        <View style={styles.heroCard}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop',
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroGradient}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>🔥 TODAY'S SIGNATURE</Text>
            </View>
            <Text style={styles.heroTitle}>Chicken 65 Biryani Bilao</Text>
            <Text style={styles.heroSub}>
              Authentic Dum-cooked Basmati with tender spiced chicken. Feeds 6-8 people!
            </Text>
            <View style={styles.heroPriceRow}>
              <Text style={styles.heroPrice}>₱1,100</Text>
              <TouchableOpacity
                style={styles.heroOrderBtn}
                onPress={() => router.push('/dish/4066' as any)}
              >
                <Text style={styles.heroOrderBtnText}>Order Now</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Action Badges */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              setSelectedCategory('biryani');
              router.push('/(tabs)/menu' as any);
            }}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.actionEmoji}>🍚</Text>
            </View>
            <Text style={styles.actionLabel}>Biryani Deals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/qr-scan' as any)}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FFEBEE' }]}>
              <Text style={styles.actionEmoji}>🔲</Text>
            </View>
            <Text style={styles.actionLabel}>Dine-In QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              setSelectedCategory('combos');
              router.push('/(tabs)/menu' as any);
            }}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.actionEmoji}>👑</Text>
            </View>
            <Text style={styles.actionLabel}>Family Party</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              useRoleStore.setState({ isPinModalOpen: true });
            }}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.actionEmoji}>🍳</Text>
            </View>
            <Text style={styles.actionLabel}>Staff POS/KDS</Text>
          </TouchableOpacity>
        </View>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Explore Menu</Text>
            <Text style={styles.sectionSub}>Freshly cooked Pakistani & Indian flavors</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/menu' as any)}>
            <Text style={styles.seeAllText}>See All ({dishes.length})</Text>
          </TouchableOpacity>
        </View>

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

        {/* Chef Specials Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>👑 Chef's Signature Picks</Text>
            <Text style={styles.sectionSub}>Authentic slow-cooked heirloom recipes</Text>
          </View>
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

        {/* Popular Items Grid */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>🔥 Most Popular Dishes</Text>
            <Text style={styles.sectionSub}>Customer favorites & best-sellers</Text>
          </View>
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
    paddingBottom: 90,
  },
  tableActiveBanner: {
    margin: Spacing.md,
    backgroundColor: Colors.halalGreen,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.card,
  },
  tableBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tableIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.round,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableBannerTitle: {
    color: Colors.textLight,
    fontWeight: '800',
    fontSize: Typography.fontSize.md,
  },
  tableBannerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
  },
  changeTableBtn: {
    backgroundColor: Colors.textLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  changeTableBtnText: {
    color: Colors.halalGreenDark,
    fontWeight: '700',
    fontSize: 11,
  },
  qrPromptCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: '#FFF9F5',
    borderWidth: 1,
    borderColor: '#FFE0CC',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qrIconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.round,
    backgroundColor: '#FFE9DC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPromptText: {
    flex: 1,
  },
  qrPromptTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  qrPromptSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 48,
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
  filterIconBtn: {
    padding: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.sm,
  },
  heroCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    height: 200,
    position: 'relative',
    ...Shadows.card,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: Spacing.lg,
    justifyContent: 'flex-end',
  },
  heroBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  heroBadgeText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontSize: 10,
  },
  heroTitle: {
    color: Colors.textLight,
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.fontSize.xs,
    lineHeight: 16,
    marginBottom: 10,
  },
  heroPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroPrice: {
    color: '#FFE082',
    fontSize: Typography.fontSize.xl,
    fontWeight: '900',
  },
  heroOrderBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    gap: 6,
  },
  heroOrderBtnText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.xs,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionItem: {
    alignItems: 'center',
    width: (width - 64) / 4,
  },
  actionIconBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionEmoji: {
    fontSize: 22,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.md,
  },
  horizontalScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  horizontalCardWrapper: {
    width: 200,
  },
  dishesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  gridItemWrapper: {
    width: '48.5%',
  },
});
