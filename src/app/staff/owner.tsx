import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useOrderStore } from '@/store/useOrderStore';
import { useMenuStore } from '@/store/useMenuStore';
import { useRoleStore } from '@/store/useRoleStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const { orders, getDailyStats } = useOrderStore();
  const { dishes, toggleDishStock } = useMenuStore();
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Owner Header */}
      <View style={styles.navBar}>
        <View style={styles.brandRow}>
          <View style={styles.ownerBadge}>
            <Ionicons name="stats-chart" size={20} color={Colors.textLight} />
          </View>
          <View>
            <Text style={styles.navTitle}>Owner Analytics & Control</Text>
            <Text style={styles.navSub}>Hasan's Flavors • Live Restaurant Operations</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.exitBtn}
          onPress={() => {
            setRole('customer');
            router.replace('/(tabs)' as any);
          }}
        >
          <Ionicons name="exit-outline" size={16} color={Colors.primary} />
          <Text style={styles.exitBtnText}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
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
            Stock Control ({outOfStockCount > 0 ? `${outOfStockCount} Out` : 'All In'})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'sales' && styles.tabBtnActive]}
          onPress={() => setActiveTab('sales')}
        >
          <Text style={[styles.tabText, activeTab === 'sales' && styles.tabTextActive]}>
            Orders ({orders.length})
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
            {/* KPI Metric Cards Grid */}
            <View style={styles.kpiGrid}>
              {/* Card 1: Today's Revenue */}
              <View style={[styles.kpiCard, { borderLeftColor: Colors.halalGreen }]}>
                <View style={styles.kpiTopRow}>
                  <Text style={styles.kpiLabel}>TODAY'S REVENUE</Text>
                  <Ionicons name="cash" size={16} color={Colors.halalGreen} />
                </View>
                <Text style={styles.kpiValue}>₱{stats.todayRevenue.toLocaleString()}</Text>
                <Text style={styles.kpiGrowthText}>▲ +18.4% vs yesterday</Text>
              </View>

              {/* Card 2: Total Orders */}
              <View style={[styles.kpiCard, { borderLeftColor: '#1565C0' }]}>
                <View style={styles.kpiTopRow}>
                  <Text style={styles.kpiLabel}>ORDERS COMPLETED</Text>
                  <Ionicons name="receipt" size={16} color="#1565C0" />
                </View>
                <Text style={styles.kpiValue}>{stats.orderCount}</Text>
                <Text style={styles.kpiSubText}>Dine-in + Delivery + Counter</Text>
              </View>

              {/* Card 3: Average Order Value */}
              <View style={[styles.kpiCard, { borderLeftColor: Colors.saffronDark }]}>
                <View style={styles.kpiTopRow}>
                  <Text style={styles.kpiLabel}>AVERAGE ORDER VALUE</Text>
                  <Ionicons name="trending-up" size={16} color={Colors.saffronDark} />
                </View>
                <Text style={styles.kpiValue}>
                  ₱{stats.orderCount > 0 ? Math.round(stats.todayRevenue / stats.orderCount).toLocaleString() : '0'}
                </Text>
                <Text style={styles.kpiSubText}>Average basket spend</Text>
              </View>

              {/* Card 4: Active Seated Tables */}
              <View style={[styles.kpiCard, { borderLeftColor: Colors.primary }]}>
                <View style={styles.kpiTopRow}>
                  <Text style={styles.kpiLabel}>ACTIVE TABLES</Text>
                  <Ionicons name="restaurant" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.kpiValue}>{stats.activeTables} / 15</Text>
                <Text style={styles.kpiSubText}>Dining room occupancy: {Math.round((stats.activeTables / 15) * 100)}%</Text>
              </View>
            </View>

            {/* Best-Selling Dishes Leaderboard */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>👑 Best-Selling Menu Items Today</Text>
                <Text style={styles.cardBadge}>Top 5</Text>
              </View>

              {stats.topSellingItems.map((item, idx) => (
                <View key={idx} style={styles.leaderboardRow}>
                  <View style={styles.rankCircle}>
                    <Text style={styles.rankText}>#{idx + 1}</Text>
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

            {/* Quick Operations Actions */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Operations Quick Access</Text>

              <View style={styles.quickOpsGrid}>
                <TouchableOpacity
                  style={styles.opsBtn}
                  onPress={() => {
                    setRole('kds');
                    router.replace('/staff/kds' as any);
                  }}
                >
                  <Ionicons name="flame" size={24} color="#E65100" />
                  <Text style={styles.opsBtnTitle}>Open Kitchen KDS</Text>
                  <Text style={styles.opsBtnSub}>View live tickets</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.opsBtn}
                  onPress={() => {
                    setRole('pos');
                    router.replace('/staff/pos' as any);
                  }}
                >
                  <Ionicons name="calculator" size={24} color="#1565C0" />
                  <Text style={styles.opsBtnTitle}>Open Cashier POS</Text>
                  <Text style={styles.opsBtnSub}>Process registers</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'inventory' && (
          <View style={styles.inventorySection}>
            <View style={styles.inventoryHeaderCard}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <Text style={styles.inventoryHeaderText}>
                Toggle any item below to immediately mark it <Text style={styles.bold}>Out of Stock</Text> across the Customer App and KDS.
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
                    {dish.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                  </Text>
                  <Switch
                    value={dish.inStock}
                    onValueChange={() => handleToggleStock(dish.id)}
                    trackColor={{ false: '#FFCDD2', true: '#C8E6C9' }}
                    thumbColor={dish.inStock ? Colors.halalGreen : Colors.error}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'sales' && (
          <View style={styles.salesSection}>
            <Text style={styles.sectionTitle}>Real-Time Orders Stream</Text>

            {orders.map((o) => (
              <View key={o.id} style={styles.orderStreamCard}>
                <View style={styles.streamTop}>
                  <View style={styles.streamNumRow}>
                    <Text style={styles.streamOrderNum}>{o.orderNumber}</Text>
                    <View style={styles.streamTypeBadge}>
                      <Text style={styles.streamTypeText}>
                        {o.type === 'dine_in' ? `🍽️ ${o.tableNumber}` : o.type === 'delivery' ? '🛵 Delivery' : '🛍️ Takeout'}
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
    backgroundColor: '#F8F7F4',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadows.subtle,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ownerBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
  },
  navSub: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    gap: 4,
  },
  exitBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#2E7D32',
  },
  tabText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: '#2E7D32',
    fontWeight: '800',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 90,
  },
  overviewSection: {
    gap: Spacing.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  kpiCard: {
    width: (width - 40) / 2,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '900',
    color: Colors.text,
    marginVertical: 2,
  },
  kpiGrowthText: {
    fontSize: 10,
    fontWeight: '700',
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
    borderColor: Colors.borderLight,
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
    fontWeight: '800',
    color: Colors.text,
  },
  cardBadge: {
    backgroundColor: '#FFF3E0',
    color: Colors.saffronDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    fontSize: 10,
    fontWeight: '800',
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
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FAF9F8',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.text,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  leaderboardSold: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  leaderboardRev: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
    color: Colors.primary,
  },
  quickOpsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  opsBtn: {
    flex: 1,
    backgroundColor: '#FAF9F8',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  opsBtnTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
    color: Colors.text,
  },
  opsBtnSub: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  inventorySection: {
    gap: Spacing.xs,
  },
  inventoryHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: 8,
    marginBottom: Spacing.sm,
  },
  inventoryHeaderText: {
    flex: 1,
    fontSize: 11,
    color: Colors.text,
    lineHeight: 16,
  },
  bold: {
    fontWeight: '800',
  },
  stockItemRow: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.xs,
  },
  stockInfoCol: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  stockItemName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  stockItemCat: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  stockToggleCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  stockStatusText: {
    fontSize: 9,
    fontWeight: '800',
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
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  orderStreamCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    color: Colors.text,
  },
  streamTypeBadge: {
    backgroundColor: '#F0EFEA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  streamTypeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  streamTotal: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '900',
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
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  streamStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.halalGreenDark,
  },
});
