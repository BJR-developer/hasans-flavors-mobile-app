import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRoleStore } from '@/store/useRoleStore';
import { Order, OrderStatus } from '@/types';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function KDSScreen() {
  const router = useRouter();
  const { orders, updateOrderStatus } = useOrderStore();
  const { user, logout } = useAuthStore();
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

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Sign out of Staff account?',
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
                  ? order.tableNumber || 'Dine-In'
                  : order.type === 'delivery'
                  ? 'Delivery'
                  : 'Takeout'}
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
            <Ionicons
              name="time-outline"
              size={12}
              color={isUrgent ? Colors.error : isWarning ? Colors.warning : Colors.textSecondary}
            />
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
                  {item.portion.name} • Spice {item.spiceLevel}
                </Text>
                {item.selectedAddons.length > 0 && (
                  <Text style={styles.addonsText}>
                    + {item.selectedAddons.map((a) => a.name).join(', ')}
                  </Text>
                )}
                {item.specialNotes ? (
                  <Text style={styles.notesText}>Note: "{item.specialNotes}"</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {/* Action Bump Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={[
            styles.bumpButton,
            order.status === 'pending'
              ? styles.bumpPending
              : order.status === 'preparing'
              ? styles.bumpPreparing
              : styles.bumpReady,
          ]}
          onPress={() => handleBumpStatus(order.id, order.status)}
        >
          <Ionicons
            name={
              order.status === 'pending'
                ? 'flame-outline'
                : order.status === 'preparing'
                ? 'checkmark-circle-outline'
                : 'checkmark-done-outline'
            }
            size={16}
            color={Colors.textLight}
          />
          <Text style={styles.bumpButtonText}>
            {order.status === 'pending'
              ? 'Start Cooking'
              : order.status === 'preparing'
              ? 'Mark Ready for Service'
              : 'Complete & Clear Ticket'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top KDS Header */}
      <View style={styles.navBar}>
        <View style={styles.brandRow}>
          <View style={styles.kdsBadge}>
            <Ionicons name="flame" size={16} color={Colors.textLight} />
          </View>
          <View>
            <Text style={styles.navTitle}>Kitchen Display System (KDS)</Text>
            <Text style={styles.navSub}>{user?.name || 'Chef Tariq'} • Kitchen Station #01</Text>
          </View>
        </View>

        <View style={styles.navActionsRow}>
          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => {
              setRole('pos');
              router.push('/staff/pos' as any);
            }}
            hitSlop={6}
          >
            <Ionicons name="calculator-outline" size={15} color={Colors.primary} />
            <Text style={styles.actionPillText}>POS</Text>
          </TouchableOpacity>

          {user?.role === 'owner' && (
            <TouchableOpacity
              style={styles.actionPill}
              onPress={() => {
                setRole('owner');
                router.push('/staff/owner' as any);
              }}
              hitSlop={6}
            >
              <Ionicons name="stats-chart-outline" size={15} color={Colors.halalGreen} />
              <Text style={styles.actionPillText}>Owner</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleSignOut}
            hitSlop={6}
          >
            <Ionicons name="log-out-outline" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs Bar */}
      <View style={styles.filterRow}>
        {(['all', 'dine_in', 'delivery'] as const).map((ft) => (
          <TouchableOpacity
            key={ft}
            style={[styles.filterBtn, filterType === ft && styles.filterBtnActive]}
            onPress={() => setFilterType(ft)}
          >
            <Text style={[styles.filterBtnText, filterType === ft && styles.filterBtnTextActive]}>
              {ft === 'all'
                ? `All Tickets (${orders.length})`
                : ft === 'dine_in'
                ? 'Dine-In'
                : 'Delivery & Takeout'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Pending (New Incoming Orders) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. Incoming Orders ({pendingOrders.length})</Text>
            <Text style={styles.sectionSub}>Waiting to start preparation</Text>
          </View>

          {pendingOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No pending orders in queue</Text>
            </View>
          ) : (
            <View style={styles.ticketGrid}>{pendingOrders.map(renderOrderTicket)}</View>
          )}
        </View>

        {/* Section 2: Preparing (Currently on Stove / Cooking) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>2. Cooking in Progress ({preparingOrders.length})</Text>
            <Text style={styles.sectionSub}>Active on kitchen line</Text>
          </View>

          {preparingOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No orders currently cooking</Text>
            </View>
          ) : (
            <View style={styles.ticketGrid}>{preparingOrders.map(renderOrderTicket)}</View>
          )}
        </View>

        {/* Section 3: Ready (Plated / Packaged for Pickup) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>3. Ready for Service ({readyOrders.length})</Text>
            <Text style={styles.sectionSub}>Plated for table delivery or bagged for rider</Text>
          </View>

          {readyOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No tickets awaiting dispatch</Text>
            </View>
          ) : (
            <View style={styles.ticketGrid}>{readyOrders.map(renderOrderTicket)}</View>
          )}
        </View>
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
  kdsBadge: {
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
  filterRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterBtnTextActive: {
    color: Colors.textLight,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 90,
    gap: Spacing.lg,
  },
  sectionBlock: {
    gap: Spacing.xs,
  },
  sectionHeader: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  ticketGrid: {
    gap: Spacing.md,
  },
  ticketCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  urgentTicket: {
    borderColor: Colors.error,
    borderLeftWidth: 4,
  },
  warningTicket: {
    borderColor: Colors.warning,
    borderLeftWidth: 4,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  ticketNumberCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  ticketTypeBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  ticketTypeBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    gap: 4,
  },
  timerPillNormal: {
    backgroundColor: Colors.surface,
  },
  timerPillWarning: {
    backgroundColor: Colors.saffronLight,
  },
  timerPillUrgent: {
    backgroundColor: Colors.primaryLight,
  },
  timerText: {
    fontSize: 10,
    fontWeight: '600',
  },
  timerTextNormal: {
    color: Colors.textSecondary,
  },
  timerTextWarning: {
    color: Colors.saffronDark,
  },
  timerTextUrgent: {
    color: Colors.error,
  },
  ticketCustomerName: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  bold: {
    fontWeight: '600',
    color: Colors.text,
  },
  ticketItemsList: {
    gap: 6,
    marginVertical: 4,
  },
  ticketItemRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  qtyBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qtyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  itemTextCol: {
    flex: 1,
  },
  itemNameText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  itemSpecsText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  addonsText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  notesText: {
    fontSize: 10,
    color: Colors.primary,
    fontStyle: 'italic',
    marginTop: 1,
  },
  bumpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    gap: 6,
    marginTop: Spacing.sm,
  },
  bumpPending: {
    backgroundColor: Colors.primary,
  },
  bumpPreparing: {
    backgroundColor: Colors.saffron,
  },
  bumpReady: {
    backgroundColor: Colors.halalGreen,
  },
  bumpButtonText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.xs,
  },
});
