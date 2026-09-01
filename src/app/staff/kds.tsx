import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useOrderStore } from '@/store/useOrderStore';
import { useRoleStore } from '@/store/useRoleStore';
import { Order, OrderStatus } from '@/types';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function KDSScreen() {
  const router = useRouter();
  const { orders, updateOrderStatus } = useOrderStore();
  const { setRole } = useRoleStore();
  const [filterType, setFilterType] = useState<'all' | 'dine_in' | 'delivery'>('all');

  const pendingOrders = orders.filter(
    (o) => o.status === 'pending' && (filterType === 'all' || o.type === filterType)
  );
  const preparingOrders = orders.filter(
    (o) => o.status === 'preparing' && (filterType === 'all' || o.type === filterType)
  );
  const readyOrders = orders.filter(
    (o) => o.status === 'ready' && (filterType === 'all' || o.type === filterType)
  );

  const handleBumpStatus = (orderId: string, currentStatus: OrderStatus) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    if (currentStatus === 'pending') {
      updateOrderStatus(orderId, 'preparing');
    } else if (currentStatus === 'preparing') {
      updateOrderStatus(orderId, 'ready');
    } else if (currentStatus === 'ready') {
      updateOrderStatus(orderId, 'completed');
    }
  };

  const calculateElapsedMinutes = (dateStr: string) => {
    const elapsed = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    return Math.max(1, elapsed);
  };

  const renderOrderTicket = (order: Order) => {
    const elapsed = calculateElapsedMinutes(order.createdAt);
    const isUrgent = elapsed > 20;
    const isWarning = elapsed > 10 && elapsed <= 20;

    return (
      <View
        key={order.id}
        style={[
          styles.ticketCard,
          isUrgent && styles.urgentTicket,
          isWarning && styles.warningTicket,
        ]}
      >
        {/* Ticket Header */}
        <View style={styles.ticketHeader}>
          <View style={styles.ticketNumberCol}>
            <Text style={styles.ticketNumber}>{order.orderNumber}</Text>
            <View style={styles.ticketTypeBadge}>
              <Text style={styles.ticketTypeBadgeText}>
                {order.type === 'dine_in'
                  ? `🍽️ ${order.tableNumber || 'Dine-In'}`
                  : order.type === 'delivery'
                  ? '🛵 Delivery'
                  : '🛍️ Takeout'}
              </Text>
            </View>
          </View>

          {/* Elapsed Timer Pill */}
          <View
            style={[
              styles.timerPill,
              isUrgent ? styles.timerPillUrgent : isWarning ? styles.timerPillWarning : styles.timerPillNormal,
            ]}
          >
            <Ionicons name="time" size={12} color={isUrgent ? '#D32F2F' : isWarning ? '#E65100' : '#2E7D32'} />
            <Text
              style={[
                styles.timerText,
                isUrgent ? styles.timerTextUrgent : isWarning ? styles.timerTextWarning : styles.timerTextNormal,
              ]}
            >
              {elapsed}m ago
            </Text>
          </View>
        </View>

        {/* Customer & Guest Name */}
        <Text style={styles.ticketCustomerName}>
          Customer: <Text style={styles.bold}>{order.customerName}</Text>
        </Text>

        {/* Items Checklist */}
        <View style={styles.ticketItemsList}>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.ticketItemRow}>
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyBadgeText}>{item.quantity}x</Text>
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemNameText}>{item.dish.name}</Text>
                <Text style={styles.itemSpecsText}>
                  Portion: {item.portion.name} • Spice: Level {item.spiceLevel} 🌶️
                </Text>
                {item.selectedAddons.length > 0 && (
                  <Text style={styles.itemAddonText}>
                    Addons: {item.selectedAddons.map((a) => a.name).join(', ')}
                  </Text>
                )}
                {item.specialNotes ? (
                  <Text style={styles.itemNotesText}>⚠️ "{item.specialNotes}"</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {/* Special Order Notes */}
        {order.specialNotes ? (
          <View style={styles.orderNoteBanner}>
            <Text style={styles.orderNoteBannerText}>Note: {order.specialNotes}</Text>
          </View>
        ) : null}

        {/* Bump Action Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={[
            styles.bumpBtn,
            order.status === 'pending'
              ? styles.bumpBtnStart
              : order.status === 'preparing'
              ? styles.bumpBtnReady
              : styles.bumpBtnComplete,
          ]}
          onPress={() => handleBumpStatus(order.id, order.status)}
        >
          <Ionicons
            name={
              order.status === 'pending'
                ? 'flame'
                : order.status === 'preparing'
                ? 'checkmark-circle'
                : 'checkmark-done'
            }
            size={16}
            color={Colors.textLight}
          />
          <Text style={styles.bumpBtnText}>
            {order.status === 'pending'
              ? 'Start Cooking ➔'
              : order.status === 'preparing'
              ? 'Mark Ready for Pickup ➔'
              : 'Complete & Dismiss ✓'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* KDS Navigation Bar */}
      <View style={styles.kdsNavBar}>
        <View style={styles.kdsBrandRow}>
          <View style={styles.kdsIconBox}>
            <Ionicons name="flame" size={20} color={Colors.textLight} />
          </View>
          <View>
            <Text style={styles.kdsTitle}>Kitchen Display System (KDS)</Text>
            <Text style={styles.kdsSub}>Real-Time Kitchen Orders & Expediting</Text>
          </View>
        </View>

        {/* Return to Customer Mode */}
        <TouchableOpacity
          style={styles.exitStaffBtn}
          onPress={() => {
            setRole('customer');
            router.replace('/(tabs)' as any);
          }}
        >
          <Ionicons name="log-out-outline" size={16} color={Colors.primary} />
          <Text style={styles.exitStaffBtnText}>Customer View</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, filterType === 'all' && styles.activeFilterPill]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterPillText, filterType === 'all' && styles.activeFilterPillText]}>
            All Orders ({pendingOrders.length + preparingOrders.length + readyOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, filterType === 'dine_in' && styles.activeFilterPill]}
          onPress={() => setFilterType('dine_in')}
        >
          <Text style={[styles.filterPillText, filterType === 'dine_in' && styles.activeFilterPillText]}>
            🍽️ Dine-In
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, filterType === 'delivery' && styles.activeFilterPill]}
          onPress={() => setFilterType('delivery')}
        >
          <Text style={[styles.filterPillText, filterType === 'delivery' && styles.activeFilterPillText]}>
            🛵 Delivery
          </Text>
        </TouchableOpacity>
      </View>

      {/* Kanban Board Columns */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.boardContainer}
      >
        {/* Column 1: New Orders (Pending) */}
        <View style={styles.columnWrapper}>
          <View style={[styles.columnHeader, { borderLeftColor: '#F57F17' }]}>
            <View style={styles.colTitleRow}>
              <Text style={styles.colTitle}>NEW ORDERS</Text>
              <View style={[styles.colCountBadge, { backgroundColor: '#FFF8E1' }]}>
                <Text style={[styles.colCountText, { color: '#F57F17' }]}>{pendingOrders.length}</Text>
              </View>
            </View>
            <Text style={styles.colSub}>Awaiting Chef Acceptance</Text>
          </View>

          <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
            {pendingOrders.length === 0 ? (
              <View style={styles.emptyColumn}>
                <Text style={styles.emptyColumnText}>No pending tickets</Text>
              </View>
            ) : (
              pendingOrders.map((o) => renderOrderTicket(o))
            )}
          </ScrollView>
        </View>

        {/* Column 2: In Preparation (Cooking) */}
        <View style={styles.columnWrapper}>
          <View style={[styles.columnHeader, { borderLeftColor: '#E65100' }]}>
            <View style={styles.colTitleRow}>
              <Text style={styles.colTitle}>COOKING NOW</Text>
              <View style={[styles.colCountBadge, { backgroundColor: '#FFF3E0' }]}>
                <Text style={[styles.colCountText, { color: '#E65100' }]}>{preparingOrders.length}</Text>
              </View>
            </View>
            <Text style={styles.colSub}>Simmering on Stoves & Tandoor</Text>
          </View>

          <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
            {preparingOrders.length === 0 ? (
              <View style={styles.emptyColumn}>
                <Text style={styles.emptyColumnText}>No dishes currently cooking</Text>
              </View>
            ) : (
              preparingOrders.map((o) => renderOrderTicket(o))
            )}
          </ScrollView>
        </View>

        {/* Column 3: Ready for Pickup / Table Service */}
        <View style={styles.columnWrapper}>
          <View style={[styles.columnHeader, { borderLeftColor: '#2E7D32' }]}>
            <View style={styles.colTitleRow}>
              <Text style={styles.colTitle}>READY FOR SERVICE</Text>
              <View style={[styles.colCountBadge, { backgroundColor: '#E8F5E9' }]}>
                <Text style={[styles.colCountText, { color: '#2E7D32' }]}>{readyOrders.length}</Text>
              </View>
            </View>
            <Text style={styles.colSub}>Pass Window / Waiter Pickup</Text>
          </View>

          <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
            {readyOrders.length === 0 ? (
              <View style={styles.emptyColumn}>
                <Text style={styles.emptyColumnText}>Pass window clear</Text>
              </View>
            ) : (
              readyOrders.map((o) => renderOrderTicket(o))
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181716',
  },
  kdsNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#242220',
    borderBottomWidth: 1,
    borderBottomColor: '#363330',
  },
  kdsBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  kdsIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: '#E65100',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kdsTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.textLight,
  },
  kdsSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  exitStaffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#382020',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    gap: 4,
  },
  exitStaffBtnText: {
    color: '#FF8A80',
    fontWeight: '700',
    fontSize: 11,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 8,
    backgroundColor: '#1E1D1B',
  },
  filterPill: {
    backgroundColor: '#2D2A27',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.round,
  },
  activeFilterPill: {
    backgroundColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  activeFilterPillText: {
    color: Colors.textLight,
  },
  boardContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  columnWrapper: {
    width: width > 600 ? 340 : 300,
    backgroundColor: '#22201D',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#363330',
  },
  columnHeader: {
    borderLeftWidth: 4,
    paddingLeft: Spacing.sm,
    marginBottom: Spacing.md,
  },
  colTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '900',
    color: Colors.textLight,
    letterSpacing: 0.5,
  },
  colCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.round,
  },
  colCountText: {
    fontSize: 11,
    fontWeight: '900',
  },
  colSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  columnScroll: {
    flex: 1,
  },
  emptyColumn: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyColumnText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: Typography.fontSize.xs,
  },
  ticketCard: {
    backgroundColor: '#2D2A27',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#403D39',
  },
  urgentTicket: {
    borderColor: '#D32F2F',
    backgroundColor: '#362222',
  },
  warningTicket: {
    borderColor: '#E65100',
    backgroundColor: '#362B20',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#403D39',
    paddingBottom: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  ticketNumberCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketNumber: {
    fontSize: Typography.fontSize.md,
    fontWeight: '900',
    color: Colors.textLight,
  },
  ticketTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  ticketTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFE082',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.round,
    gap: 4,
  },
  timerPillNormal: {
    backgroundColor: '#1B3B22',
  },
  timerPillWarning: {
    backgroundColor: '#4A3319',
  },
  timerPillUrgent: {
    backgroundColor: '#4D1D1D',
  },
  timerText: {
    fontSize: 10,
    fontWeight: '800',
  },
  timerTextNormal: {
    color: '#81C784',
  },
  timerTextWarning: {
    color: '#FFB74D',
  },
  timerTextUrgent: {
    color: '#E57373',
  },
  ticketCustomerName: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.sm,
  },
  bold: {
    fontWeight: '800',
    color: Colors.textLight,
  },
  ticketItemsList: {
    gap: 8,
    marginBottom: Spacing.sm,
  },
  ticketItemRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qtyBadge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    width: 26,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBadgeText: {
    color: Colors.textLight,
    fontWeight: '900',
    fontSize: 11,
  },
  itemTextCol: {
    flex: 1,
  },
  itemNameText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
    color: Colors.textLight,
  },
  itemSpecsText: {
    fontSize: 10,
    color: '#FFE082',
    marginTop: 1,
  },
  itemAddonText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  itemNotesText: {
    fontSize: 10,
    color: '#FF8A80',
    fontWeight: '700',
    marginTop: 2,
  },
  orderNoteBanner: {
    backgroundColor: 'rgba(255, 138, 128, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#FF8A80',
    padding: 6,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
  },
  orderNoteBannerText: {
    fontSize: 10,
    color: '#FF8A80',
    fontWeight: '600',
  },
  bumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.sm,
    gap: 6,
  },
  bumpBtnStart: {
    backgroundColor: '#E65100',
  },
  bumpBtnReady: {
    backgroundColor: '#2E7D32',
  },
  bumpBtnComplete: {
    backgroundColor: '#424242',
  },
  bumpBtnText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontSize: Typography.fontSize.xs,
  },
});
