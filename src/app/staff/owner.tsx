import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useOrderStore } from '@/store/useOrderStore';
import { useMenuStore } from '@/store/useMenuStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRoleStore } from '@/store/useRoleStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const { orders, getDailyStats } = useOrderStore();
  const { dishes, toggleDishStock } = useMenuStore();
  const { user, logout } = useAuthStore();
  const { setRole } = useRoleStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'sales'>('overview');
  const stats = getDailyStats();
  const outOfStockCount = dishes.filter((d) => !d.inStock).length;

  const handleToggleStock = (dishId: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    toggleDishStock(dishId);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Sign out of Owner account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {}
            logout();
            router.replace('/auth/signin' as any);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Owner Header */}
      <View style={styles.navBar}>
        <View style={styles.brandRow}>
          <View style={styles.ownerBadge}>
            <Ionicons name="stats-chart" size={16} color={Colors.textLight} />
          </View>
          <View>
            <Text style={styles.navTitle}>Owner Operations</Text>
            <Text style={styles.navSub}>{user?.name || 'Malik Hasan'} • General Manager</Text>
          </View>
        </View>

        <View style={styles.navActionsRow}>
          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => router.push('/(tabs)' as any)}
            hitSlop={6}
          >
            <Ionicons name="eye-outline" size={15} color={Colors.textSecondary} />
            <Text style={styles.actionPillText}>Customer View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleSignOut}
            hitSlop={6}
          >
            <Ionicons name="log-out-outline" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Tab Navigation */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'overview' && styles.tabBtnActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'inventory' && styles.tabBtnActive]}
          onPress={() => setActiveTab('inventory')}
        >
          <Text style={[styles.tabText, activeTab === 'inventory' && styles.tabTextActive]}>
            Inventory {outOfStockCount > 0 ? `(${outOfStockCount} Out)` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'sales' && styles.tabBtnActive]}
          onPress={() => setActiveTab('sales')}
        >
          <Text style={[styles.tabText, activeTab === 'sales' && styles.tabTextActive]}>
            Live Orders ({orders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && (
          <View style={styles.overviewSection}>
            {/* Quick Operations Jump Bar */}
            <View style={styles.opsBar}>
              <TouchableOpacity
                style={styles.opsBtn}
                onPress={() => {
                  setRole('pos');
                  router.push('/staff/pos' as any);
                }}
              >
                <Ionicons name="calculator-outline" size={18} color={Colors.primary} />
                <View style={styles.opsBtnTextCol}>
                  <Text style={styles.opsBtnTitle}>POS Register</Text>
                  <Text style={styles.opsBtnSub}>Cashier terminal</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.opsBtn}
                onPress={() => {
                  setRole('kds');
                  router.push('/staff/kds' as any);
                }}
              >
                <Ionicons name="flame-outline" size={18} color={Colors.primary} />
                <View style={styles.opsBtnTextCol}>
                  <Text style={styles.opsBtnTitle}>Kitchen KDS</Text>
                  <Text style={styles.opsBtnSub}>Order bump screen</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* KPI Metric Cards Grid */}
            <View style={styles.kpiGrid}>
              {/* Revenue */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiTopRow}>
                  <Text style={styles.kpiLabel}>TODAY'S REVENUE</Text>
                  <Ionicons name="cash-outline" size={15} color={Colors.halalGreen} />
                </View>
                <Text style={styles.kpiValue}>₱{stats.todayRevenue.toLocaleString()}</Text>
                <Text style={styles.kpiGrowthText}>▲ +18.4% vs yesterday</Text>
              </View>

              {/* Completed Orders */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiTopRow}>
                  <Text style={styles.kpiLabel}>COMPLETED ORDERS</Text>
                  <Ionicons name="receipt-outline" size={15} color={Colors.textSecondary} />
                </View>
                <Text style={styles.kpiValue}>{stats.orderCount}</Text>
                <Text style={styles.kpiSubText}>Dine-in + Delivery + Takeout</Text>
              </View>

              {/* Avg Order Value */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiTopRow}>
                  <Text style={styles.kpiLabel}>AVG ORDER VALUE</Text>
                  <Ionicons name="trending-up-outline" size={15} color={Colors.saffron} />
                </View>
                <Text style={styles.kpiValue}>
                  ₱{stats.orderCount > 0 ? Math.round(stats.todayRevenue / stats.orderCount).toLocaleString() : '0'}
                </Text>
                <Text style={styles.kpiSubText}>Average basket spend</Text>
              </View>

              {/* Seated Tables */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiTopRow}>
                  <Text style={styles.kpiLabel}>ACTIVE TABLES</Text>
                  <Ionicons name="restaurant-outline" size={15} color={Colors.primary} />
                </View>
                <Text style={styles.kpiValue}>{stats.activeTables} / 15</Text>
                <Text style={styles.kpiSubText}>Occupancy: {Math.round((stats.activeTables / 15) * 100)}%</Text>
              </View>
            </View>

            {/* Best-Selling Dishes Leaderboard */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Top Selling Dishes Today</Text>
                <Text style={styles.cardBadge}>Top 5</Text>
              </View>

              {stats.topSellingItems.map((item, idx) => (
                <View key={idx} style={styles.leaderboardRow}>
                  <View style={styles.rankCircle}>
                    <Text style={styles.rankText}>{idx + 1}</Text>
                  </View>

                  <View style={styles.leaderboardInfo}>
                    <Text style={styles.leaderboardName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.leaderboardSold}>{item.sold} portions sold</Text>
                  </View>

                  <Text style={styles.leaderboardRev}>₱{item.revenue.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'inventory' && (
          <View style={styles.inventorySection}>
            <View style={styles.inventoryNotice}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.inventoryNoticeText}>
                Items marked Out of Stock are immediately disabled in customer app and POS register.
              </Text>
            </View>

            {dishes.map((dish) => (
              <View key={dish.id} style={styles.stockItemRow}>
                <View style={styles.stockInfoCol}>
                  <Text style={styles.stockItemName} numberOfLines={1}>
                    {dish.name}
                  </Text>
                  <Text style={styles.stockItemCat}>
                    {dish.category} • {dish.formattedPrice}
                  </Text>
                </View>

                <View style={styles.stockToggleCol}>
                  <Text
                    style={[
                      styles.stockStatusText,
                      dish.inStock ? styles.stockInText : styles.stockOutText,
                    ]}
                  >
                    {dish.inStock ? 'In Stock' : 'Out of Stock'}
                  </Text>
                  <Switch
                    value={dish.inStock}
                    onValueChange={() => handleToggleStock(dish.id)}
                    trackColor={{ false: '#FEE2E2', true: '#DCFCE7' }}
                    thumbColor={dish.inStock ? Colors.halalGreen : Colors.error}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'sales' && (
          <View style={styles.salesSection}>
            <Text style={styles.sectionTitle}>Real-Time Order Stream</Text>

            {orders.map((o) => (
              <View key={o.id} style={styles.orderStreamCard}>
                <View style={styles.streamTop}>
                  <View style={styles.streamNumRow}>
                    <Text style={styles.streamOrderNum}>{o.orderNumber}</Text>
                    <View style={styles.streamTypeBadge}>
                      <Text style={styles.streamTypeText}>
                        {o.type === 'dine_in' ? o.tableNumber || 'Dine-In' : o.type === 'delivery' ? 'Delivery' : 'Takeout'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.streamTotal}>₱{o.total.toLocaleString()}</Text>
                </View>

                <Text style={styles.streamCustomer}>Customer: {o.customerName}</Text>
                <Text style={styles.streamItems}>
                  {o.items.map((i) => `${i.quantity}x ${i.dish.name}`).join(', ')}
                </Text>

                <View style={styles.streamFooter}>
                  <Text style={styles.streamTime}>
                    {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <View style={styles.streamStatusBadge}>
                    <Text style={styles.streamStatusText}>{o.status.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ownerBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  navSub: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  navActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  actionPillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  logoutBtn: {
    padding: 6,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 90,
  },
  overviewSection: {
    gap: Spacing.md,
  },
  opsBar: {
    flexDirection: 'row',
    gap: 10,
  },
  opsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    ...Shadows.subtle,
  },
  opsBtnTextCol: {
    flex: 1,
  },
  opsBtnTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  opsBtnSub: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: (width - 46) / 2,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  kpiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    marginVertical: 2,
  },
  kpiGrowthText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.halalGreen,
  },
  kpiSubText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  cardBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 10,
  },
  rankCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  leaderboardSold: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  leaderboardRev: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  inventorySection: {
    gap: Spacing.sm,
  },
  inventoryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  inventoryNoticeText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  stockItemRow: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stockInfoCol: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  stockItemName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  stockItemCat: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  stockToggleCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  stockStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  stockInText: {
    color: Colors.halalGreen,
  },
  stockOutText: {
    color: Colors.error,
  },
  salesSection: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  orderStreamCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  streamTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streamNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streamOrderNum: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  streamTypeBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  streamTypeText: {
    fontSize: 9,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  streamTotal: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
    color: Colors.primary,
  },
  streamCustomer: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  streamItems: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  streamFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 6,
  },
  streamTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  streamStatusBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  streamStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.halalGreen,
  },
});
