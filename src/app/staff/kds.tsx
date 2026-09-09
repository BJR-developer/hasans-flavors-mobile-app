import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRoleStore } from '@/store/useRoleStore';
import { Order, OrderStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function KDSScreen() {
  const router = useRouter();
  const { orders, updateOrderStatus } = useOrderStore();
  const { user, logout } = useAuthStore();
  const { setRole } = useRoleStore();
  const [filterType, setFilterType] = useState<'all' | 'dine_in' | 'delivery'>('all');

  // Role Gate: KDS is strictly restricted to Kitchen Staff / Cashier
  if (!user) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <View style={{ maxWidth: 400, width: '100%', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
          <Ionicons name="lock-closed-outline" size={48} color={Colors.primary} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 8 }}>
            Sign In Required
          </Text>
          <Text style={{ fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 20 }}>
            Kitchen Display System (KDS) operations require staff authentication.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: Radius.md, width: '100%', alignItems: 'center' }}
            onPress={() => router.replace('/auth/signin' as any)}
          >
            <Text style={{ color: Colors.textLight, fontWeight: '700', fontSize: 13 }}>Sign In to Staff Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (user.role === 'customer') {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <View style={{ maxWidth: 400, width: '100%', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
          <Ionicons name="shield-outline" size={48} color={Colors.primary} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 8 }}>
            Kitchen KDS Restricted
          </Text>
          <Text style={{ fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 20 }}>
            You are signed in as a Customer. The Kitchen Display System is restricted to kitchen staff.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: Radius.md, width: '100%', alignItems: 'center' }}
            onPress={() => router.replace('/(tabs)' as any)}
          >
            <Text style={{ color: Colors.textLight, fontWeight: '700', fontSize: 13 }}>Return to Dining Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Role Gate: Owner restricted from Kitchen KDS
  if (user.role === 'owner') {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <View style={{ maxWidth: 400, width: '100%', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
          <Ionicons name="shield-outline" size={48} color={Colors.primary} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 8 }}>
            Kitchen KDS Restricted
          </Text>
          <Text style={{ fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 20 }}>
            You are signed in as Owner. Kitchen display and bump operations are managed by kitchen staff.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: Radius.md, width: '100%', alignItems: 'center' }}
            onPress={() => router.replace('/staff/owner' as any)}
          >
            <Text style={{ color: Colors.textLight, fontWeight: '700', fontSize: 13 }}>Go to Owner Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const pendingOrders = orders.filter(
    (o) => (o.status === 'pending' || o.status === 'sent_to_kitchen') && (filterType === 'all' || o.type === filterType)
  );
  const preparingOrders = orders.filter(
    (o) => o.status === 'preparing' && (filterType === 'all' || o.type === filterType)
  );
  const readyOrders = orders.filter(
    (o) => o.status === 'ready' && (filterType === 'all' || o.type === filterType)
  );
  const servedOrders = orders.filter(
    (o) => o.status === 'served' && (filterType === 'all' || o.type === filterType)
  );

  const handleBumpStatus = (orderId: string, currentStatus: OrderStatus) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    if (currentStatus === 'pending' || currentStatus === 'sent_to_kitchen') {
      updateOrderStatus(orderId, 'preparing');
    } else if (currentStatus === 'preparing') {
      updateOrderStatus(orderId, 'ready');
    } else if (currentStatus === 'ready') {
      updateOrderStatus(orderId, 'served');
    } else if (currentStatus === 'served') {
      updateOrderStatus(orderId, 'completed');
    }
  };

  const handleToggleItemDone = async (orderId: string, cartItemId: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;
    const updatedItems = targetOrder.items.map((it: any) =>
      it.cartItemId === cartItemId
        ? { ...it, completedInKitchen: !it.completedInKitchen }
        : it
    );
    useOrderStore.setState((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, items: updatedItems } : o
      ),
    }));
    try {
      await supabase
        .from('orders')
        .update({ items: updatedItems, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    } catch (e) {
      console.error('Failed to toggle item in Supabase:', e);
    }
  };

  const handleAdjustEta = async (orderId: string, delta: number) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;
    const cur = targetOrder.estimatedMinutes || 20;
    const nextVal = Math.max(5, Math.min(120, cur + delta));
    useOrderStore.setState((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, estimatedMinutes: nextVal } : o
      ),
    }));
    try {
      await supabase
        .from('orders')
        .update({ estimated_minutes: nextVal, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    } catch (e) {
      console.error('Failed to update estimated time in Supabase:', e);
    }
  };

  const calculateElapsedMinutes = (dateStr: string) => {
    const elapsed = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    return Math.max(1, elapsed);
  };

  const handleSignOut = async () => {
    const doLogout = async () => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      await logout();
      router.replace('/auth/signin' as any);
    };

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Sign out of Staff account?') : true;
      if (confirmed) {
        await doLogout();
      }
      return;
    }

    Alert.alert(
      'Sign Out',
      'Sign out of Staff account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: doLogout,
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

            {/* Payment Status Indicator */}
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: Radius.xs,
                backgroundColor: order.paymentStatus === 'paid' ? '#E8F5E9' : '#FFF8E1',
                borderWidth: 1,
                borderColor: order.paymentStatus === 'paid' ? '#C8E6C9' : '#FFE082',
                marginLeft: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '800',
                  color: order.paymentStatus === 'paid' ? '#2E7D32' : '#B45309',
                  textTransform: 'uppercase',
                }}
              >
                {order.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
              </Text>
            </View>
          </View>

          {/* Elapsed Timer & ETA Controls */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {/* Quick ETA Adjuster for Kitchen Staff */}
            <View style={styles.etaAdjustRow}>
              <Ionicons name="stopwatch-outline" size={12} color={Colors.primary} />
              <Text style={styles.etaText}>ETA: {order.estimatedMinutes || 20}m</Text>
              <TouchableOpacity
                onPress={() => handleAdjustEta(order.id, -5)}
                style={styles.etaBtn}
                hitSlop={6}
              >
                <Text style={styles.etaBtnText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAdjustEta(order.id, 5)}
                style={styles.etaBtn}
                hitSlop={6}
              >
                <Text style={styles.etaBtnText}>+</Text>
              </TouchableOpacity>
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
        </View>

        {/* Customer & Guest Name */}
        <Text style={styles.ticketCustomerName}>
          Customer: <Text style={styles.bold}>{order.customerName}</Text>
        </Text>

        {/* Items Checklist (Clickable to toggle preparation status) */}
        <View style={styles.ticketItemsList}>
          {order.items.map((item: any, idx) => {
            const isDone = !!item.completedInKitchen;

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                style={[styles.ticketItemRow, isDone && { opacity: 0.45 }]}
                onPress={() => handleToggleItemDone(order.id, item.cartItemId)}
              >
                <View style={[styles.checkboxBox, isDone && styles.checkboxBoxDone]}>
                  {isDone && <Ionicons name="checkmark" size={12} color={Colors.textLight} />}
                </View>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyBadgeText}>{item.quantity}x</Text>
                </View>
                <View style={styles.itemTextCol}>
                  <Text
                    style={[
                      styles.itemNameText,
                      isDone && { textDecorationLine: 'line-through', color: Colors.textMuted },
                    ]}
                  >
                    {item.dish.name}
                  </Text>
                  <Text style={styles.itemSpecsText}>
                    {item.portion?.name} • Spice {item.spiceLevel}
                  </Text>
                  {item.selectedAddons?.length > 0 && (
                    <Text style={styles.addonsText}>
                      + {item.selectedAddons.map((a: any) => a.name).join(', ')}
                    </Text>
                  )}
                  {item.specialNotes ? (
                    <Text style={styles.notesText}>Note: "{item.specialNotes}"</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Bump Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={[
            styles.bumpButton,
            order.status === 'pending' || order.status === 'sent_to_kitchen'
              ? styles.bumpPending
              : order.status === 'preparing'
              ? styles.bumpPreparing
              : order.status === 'ready'
              ? { backgroundColor: '#1D4ED8' }
              : styles.bumpReady,
          ]}
          onPress={() => handleBumpStatus(order.id, order.status)}
        >
          <Ionicons
            name={
              order.status === 'pending' || order.status === 'sent_to_kitchen'
                ? 'flame-outline'
                : order.status === 'preparing'
                ? 'checkmark-circle-outline'
                : order.status === 'ready'
                ? 'restaurant-outline'
                : 'checkmark-done-outline'
            }
            size={16}
            color={Colors.textLight}
          />
          <Text style={styles.bumpButtonText}>
            {order.status === 'pending' || order.status === 'sent_to_kitchen'
              ? 'Start Cooking'
              : order.status === 'preparing'
              ? 'Mark Ready for Service'
              : order.status === 'ready'
              ? 'Mark as Served'
              : 'Archive Ticket'}
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

        {/* Section 4: Served (At Tables / In Dining) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>4. Served to Diners ({servedOrders.length})</Text>
            <Text style={styles.sectionSub}>At tables • Check payment status before close</Text>
          </View>

          {servedOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No orders currently served</Text>
            </View>
          ) : (
            <View style={styles.ticketGrid}>{servedOrders.map(renderOrderTicket)}</View>
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
    paddingVertical: 2,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: Radius.xs,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxBoxDone: {
    backgroundColor: Colors.halalGreen,
    borderColor: Colors.halalGreen,
  },
  etaAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    gap: 4,
  },
  etaText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  etaBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.text,
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
