import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useOrderStore } from '@/store/useOrderStore';
import { useCartStore } from '@/store/useCartStore';
import { Order, OrderStatus } from '@/types';
import * as Haptics from 'expo-haptics';

export default function OrdersScreen() {
  const router = useRouter();
  const orders = useOrderStore((state) => state.orders);
  const addItem = useCartStore((state) => state.addItem);
  const [filterTab, setFilterTab] = useState<'active' | 'history'>('active');

  const activeOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  );
  const pastOrders = orders.filter(
    (o) => o.status === 'completed' || o.status === 'cancelled'
  );

  const displayedOrders = filterTab === 'active' ? activeOrders : pastOrders;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'Received', color: Colors.textSecondary, icon: 'time-outline' };
      case 'preparing':
        return { label: 'In Kitchen', color: Colors.primary, icon: 'flame-outline' };
      case 'ready':
        return { label: 'Ready', color: Colors.halalGreen, icon: 'checkmark-circle-outline' };
      case 'completed':
        return { label: 'Delivered', color: Colors.textMuted, icon: 'checkmark-outline' };
      case 'cancelled':
        return { label: 'Cancelled', color: Colors.error, icon: 'close-outline' };
    }
  };

  const handleReorder = (order: Order) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    order.items.forEach((item) => {
      addItem(item.dish, item.quantity, item.portion, item.spiceLevel, item.selectedAddons, item.specialNotes);
    });
    router.push('/(tabs)/cart' as any);
  };

  const handleTrackOrder = (orderId: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    useOrderStore.getState().setActiveOrder(orderId);
    router.push(`/track/${orderId}` as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Your Orders" />

      {/* Segmented Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, filterTab === 'active' && styles.activeTabBtn]}
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch {}
            setFilterTab('active');
          }}
        >
          <Text style={[styles.tabText, filterTab === 'active' && styles.activeTabText]}>
            Active ({activeOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, filterTab === 'history' && styles.activeTabBtn]}
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch {}
            setFilterTab('history');
          }}
        >
          <Text style={[styles.tabText, filterTab === 'history' && styles.activeTabText]}>
            Past ({pastOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {displayedOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {filterTab === 'active' ? 'No active orders' : 'No order history'}
            </Text>
            <Text style={styles.emptySub}>
              {filterTab === 'active'
                ? 'Your ongoing orders will appear here in real-time.'
                : 'When you place an order, it will appear here for easy reordering.'}
            </Text>
            <TouchableOpacity
              style={styles.orderNowBtn}
              onPress={() => router.push('/(tabs)/menu' as any)}
            >
              <Text style={styles.orderNowBtnText}>Browse Menu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayedOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            const firstItem = order.items[0];
            const remainingCount = order.items.length - 1;

            return (
              <View key={order.id} style={styles.orderCard}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View>
                    <View style={styles.orderNumberRow}>
                      <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>
                          {order.type === 'dine_in'
                            ? order.tableNumber || 'Dine-In'
                            : order.type === 'delivery'
                            ? 'Delivery'
                            : 'Takeout'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <Ionicons name={badge.icon as any} size={13} color={badge.color} />
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Items Summary Preview */}
                <View style={styles.itemSummaryRow}>
                  {firstItem && (
                    <Image
                      source={{ uri: firstItem.dish.imageUrl }}
                      style={styles.itemThumb}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.itemSummaryTextCol}>
                    <Text style={styles.firstItemName} numberOfLines={1}>
                      {firstItem ? `${firstItem.quantity}x ${firstItem.dish.name}` : 'Order details'}
                    </Text>
                    {remainingCount > 0 && (
                      <Text style={styles.remainingItemsText}>+ {remainingCount} other item{remainingCount > 1 ? 's' : ''}</Text>
                    )}
                    <Text style={styles.orderTotal}>₱{order.total.toLocaleString()}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.cardFooter}>
                  {order.status === 'pending' || order.status === 'preparing' || order.status === 'ready' ? (
                    <TouchableOpacity
                      style={styles.trackBtn}
                      onPress={() => handleTrackOrder(order.id)}
                    >
                      <Ionicons name="location-outline" size={15} color={Colors.textLight} />
                      <Text style={styles.trackBtnText}>Track Order</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={() => handleReorder(order)}
                    >
                      <Ionicons name="refresh-outline" size={15} color={Colors.text} />
                      <Text style={styles.reorderBtnText}>Reorder</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabBtn: {
    borderBottomColor: Colors.text,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  activeTabText: {
    color: Colors.text,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 90,
    gap: Spacing.md,
  },
  emptyContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  orderNowBtn: {
    backgroundColor: Colors.text,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  orderNowBtnText: {
    color: Colors.textLight,
    fontWeight: '600',
    fontSize: Typography.fontSize.sm,
  },
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing.sm,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  typeBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  orderDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: 12,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  itemSummaryTextCol: {
    flex: 1,
  },
  firstItemName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  remainingItemsText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  orderTotal: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 4,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  trackBtn: {
    backgroundColor: Colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.md,
    gap: 6,
  },
  trackBtnText: {
    color: Colors.textLight,
    fontWeight: '600',
    fontSize: Typography.fontSize.sm,
  },
  reorderBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.md,
    gap: 6,
  },
  reorderBtnText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: Typography.fontSize.sm,
  },
});
