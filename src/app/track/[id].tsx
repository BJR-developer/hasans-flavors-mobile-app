import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useOrderStore } from '@/store/useOrderStore';
import { OrderStatus } from '@/types';
import * as Haptics from 'expo-haptics';

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrderStore((state) => state.getOrderById(id || ''));
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);

  // Countdown timer simulation
  const [countdownMinutes, setCountdownMinutes] = useState(order?.estimatedMinutes || 20);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownMinutes((prev) => Math.max(1, prev - 1));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconCircle} onPress={() => router.replace('/(tabs)/orders' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerMainTitle}>Order Tracker</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.notFoundContainer}>
          <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.notFoundTitle}>Order Not Found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/orders' as any)}>
            <Text style={styles.backBtnText}>View All Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const steps: { key: OrderStatus; label: string; icon: string }[] = [
    { key: 'pending', label: 'Received', icon: 'checkmark' },
    { key: 'preparing', label: 'Kitchen', icon: 'flame' },
    { key: 'ready', label: order.type === 'dine_in' ? 'Serving' : 'Dispatch', icon: order.type === 'dine_in' ? 'restaurant' : 'bicycle' },
    { key: 'completed', label: 'Delivered', icon: 'home' },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'preparing':
        return 1;
      case 'ready':
        return 2;
      case 'completed':
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  const getStatusHeadline = () => {
    switch (order.status) {
      case 'pending':
        return { title: 'Order Confirmed', desc: 'Kitchen has received your ticket and is preparing ingredients.' };
      case 'preparing':
        return { title: 'Cooking in Kitchen', desc: 'Slow-simmered basmati and tender meats are on the stove.' };
      case 'ready':
        return order.type === 'dine_in'
          ? { title: `Serving to ${order.tableNumber || 'your table'}`, desc: 'Your hot dishes are plated and being brought to you.' }
          : { title: 'Courier En Route', desc: 'Packed fresh in insulated packaging for delivery.' };
      case 'completed':
      default:
        return { title: 'Order Completed', desc: 'Thank you for dining with Hasan’s Flavors!' };
    }
  };

  const statusInfo = getStatusHeadline();

  const handleSimulateNextStep = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    const sequence: OrderStatus[] = ['pending', 'preparing', 'ready', 'completed'];
    const nextIdx = Math.min(sequence.length - 1, currentStepIdx + 1);
    updateOrderStatus(order.id, sequence[nextIdx]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTextCol}>
          <Text style={styles.headerMainTitle}>
            {order.status === 'completed' ? 'Order Delivered' : 'Live Order Tracking'}
          </Text>
          <Text style={styles.headerOrderNumber}>
            {order.orderNumber} • {order.type === 'dine_in' ? (order.tableNumber || 'Dine-In') : 'Delivery'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.iconCircle}
          onPress={() => router.push('/(tabs)/orders' as any)}
          hitSlop={8}
        >
          <Ionicons name="receipt-outline" size={18} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Estimated Time Card */}
        <View style={styles.etaCard}>
          <Text style={styles.etaLabel}>ESTIMATED ARRIVAL</Text>
          <View style={styles.etaRow}>
            <Text style={styles.etaNumber}>
              {order.status === 'completed' ? '0' : countdownMinutes}
            </Text>
            <Text style={styles.etaUnit}>minutes</Text>
          </View>
          <Text style={styles.etaSubText}>
            Expected around{' '}
            <Text style={styles.boldText}>
              {new Date(Date.now() + countdownMinutes * 60000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Text>
        </View>

        {/* Stepper Card */}
        <View style={styles.stepperCard}>
          <View style={styles.timelineContainer}>
            <View style={styles.timelineTrackLine} />
            <View
              style={[
                styles.timelineFillLine,
                { width: `${(currentStepIdx / (steps.length - 1)) * 100}%` },
              ]}
            />

            <View style={styles.nodesRow}>
              {steps.map((step, idx) => {
                const isPassed = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const isUpcoming = idx > currentStepIdx;

                return (
                  <View key={step.key} style={styles.nodeItem}>
                    <View
                      style={[
                        styles.nodeCircle,
                        isPassed && styles.nodeCirclePassed,
                        isCurrent && styles.nodeCircleCurrent,
                        isUpcoming && styles.nodeCircleUpcoming,
                      ]}
                    >
                      <Ionicons
                        name={step.icon as any}
                        size={14}
                        color={isUpcoming ? Colors.textMuted : Colors.textLight}
                      />
                    </View>
                    <Text
                      style={[
                        styles.nodeLabel,
                        isCurrent && styles.nodeLabelCurrent,
                        isUpcoming && styles.nodeLabelUpcoming,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.statusHighlightBox}>
            <Text style={styles.statusTitle}>{statusInfo.title}</Text>
            <Text style={styles.statusDesc}>{statusInfo.desc}</Text>
          </View>

          {/* Demo Advance Button */}
          {order.status !== 'completed' && (
            <TouchableOpacity style={styles.demoSimBtn} onPress={handleSimulateNextStep} activeOpacity={0.8}>
              <Text style={styles.demoSimBtnText}>Demo: Next Step</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Assigned Staff or Courier */}
        <View style={styles.staffCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop' }}
            style={styles.staffAvatar}
          />
          <View style={styles.staffInfoCol}>
            <Text style={styles.staffName}>
              {order.type === 'dine_in' ? 'Tariq (Server)' : 'Amir (Courier)'}
            </Text>
            <Text style={styles.staffOrdersText}>Assigned to your order</Text>
          </View>

          <View style={styles.staffActionButtons}>
            <TouchableOpacity
              style={styles.actionIconButton}
              onPress={() => router.push('/chat' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconButton}
              onPress={() => {
                Linking.openURL('tel:+639178882345').catch(() => {
                  Alert.alert("Contact Staff", "Call +63 917 888 2345");
                });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Details Breakdown */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionHeaderTitle}>Order Items ({order.items.length})</Text>

          {order.items.map((it) => (
            <View key={it.cartItemId} style={styles.orderItemRow}>
              <Text style={styles.itemQtyText}>{it.quantity}x</Text>
              <View style={styles.itemInfoCol}>
                <Text style={styles.itemName} numberOfLines={1}>{it.dish.name}</Text>
                <Text style={styles.itemPortion}>{it.portion.name}</Text>
              </View>
              <Text style={styles.itemPrice}>₱{it.totalPrice.toLocaleString()}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total ({order.paymentMethod.toUpperCase()})</Text>
            <Text style={styles.totalValue}>₱{order.total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Docked Sticky Bottom Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.homeReturnBtn}
          onPress={() => router.replace('/(tabs)' as any)}
          activeOpacity={0.88}
        >
          <Text style={styles.homeReturnBtnText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextCol: {
    alignItems: 'center',
  },
  headerMainTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  headerOrderNumber: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  etaCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  etaLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  etaNumber: {
    color: Colors.primary,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  etaUnit: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  etaSubText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  boldText: {
    color: Colors.text,
    fontWeight: '700',
  },
  stepperCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  timelineContainer: {
    position: 'relative',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  timelineTrackLine: {
    position: 'absolute',
    top: 17,
    left: '12%',
    right: '12%',
    height: 2,
    backgroundColor: Colors.border,
  },
  timelineFillLine: {
    position: 'absolute',
    top: 17,
    left: '12%',
    height: 2,
    backgroundColor: Colors.primary,
    maxWidth: '76%',
  },
  nodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2,
  },
  nodeItem: {
    alignItems: 'center',
    width: 60,
  },
  nodeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  nodeCirclePassed: {
    backgroundColor: Colors.halalGreen,
  },
  nodeCircleCurrent: {
    backgroundColor: Colors.primary,
  },
  nodeCircleUpcoming: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nodeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  nodeLabelCurrent: {
    color: Colors.primary,
    fontWeight: '700',
  },
  nodeLabelUpcoming: {
    color: Colors.textMuted,
  },
  statusHighlightBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  statusTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  statusDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  demoSimBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  demoSimBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
    gap: 12,
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.round,
  },
  staffInfoCol: {
    flex: 1,
  },
  staffName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  staffOrdersText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  staffActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.round,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  sectionHeaderTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  itemQtyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
    width: 24,
  },
  itemInfoCol: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.text,
  },
  itemPortion: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  itemPrice: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.primary,
  },
  footer: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  homeReturnBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  homeReturnBtnText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.sm,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
    gap: 12,
  },
  notFoundTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.md,
    marginTop: 8,
  },
  backBtnText: {
    color: Colors.textLight,
    fontWeight: '600',
  },
});
