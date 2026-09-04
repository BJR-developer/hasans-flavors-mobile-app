import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useOrderStore } from '@/store/useOrderStore';
import { OrderStatus } from '@/types';
import * as Haptics from 'expo-haptics';

export default function OrderTrackingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrderStore((state) => state.getOrderById(id || ''));
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);

  // Countdown timer simulation
  const [countdownMinutes, setCountdownMinutes] = useState(order?.estimatedMinutes || 18);

  // Pulse animation for the active stage beacon
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.45,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.6,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, []);

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
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.replace('/(tabs)/orders' as any)}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Tracker</Text>
          <View style={styles.placeholderBox} />
        </View>
        <View style={styles.notFoundContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="receipt-outline" size={36} color={Colors.textMuted} />
          </View>
          <Text style={styles.notFoundTitle}>Order Not Found</Text>
          <Text style={styles.notFoundSub}>This order ticket could not be located.</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/(tabs)/orders' as any)}
          >
            <Text style={styles.backBtnText}>View All Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const steps: { key: OrderStatus; label: string; icon: string }[] = [
    { key: 'pending', label: 'Received', icon: 'checkmark' },
    { key: 'preparing', label: 'Kitchen', icon: 'flame' },
    {
      key: 'ready',
      label: order.type === 'dine_in' ? 'Serving' : 'Pickup Ready',
      icon: order.type === 'dine_in' ? 'restaurant' : 'bag-check',
    },
    { key: 'completed', label: 'Delivered', icon: 'checkmark-done' },
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
        return {
          badge: 'ORDER RECEIVED',
          title: 'Ticket Received by Kitchen',
          desc: 'Your order is queued in the kitchen display system.',
        };
      case 'preparing':
        return {
          badge: 'COOKING IN KITCHEN',
          title: 'Slow-Cooking in Dum Handi',
          desc: 'Fragrant aged basmati and tender marinated meats are simmering.',
        };
      case 'ready':
        return order.type === 'dine_in'
          ? {
              badge: 'READY TO SERVE',
              title: `Serving to ${order.tableNumber || 'Your Table'}`,
              desc: 'Plated hot and fresh, staff is bringing your food over.',
            }
          : {
              badge: 'READY FOR PICKUP',
              title: 'Packed & Ready at Counter',
              desc: 'Packed in heat-sealed containers ready for collection.',
            };
      case 'completed':
      default:
        return {
          badge: 'COMPLETED',
          title: 'Delivered & Completed',
          desc: 'Enjoy your meal! Thank you for dining with Hasan’s Flavors.',
        };
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
    <View style={styles.screenContainer}>
      {/* Top Header Bar */}
      <SafeAreaView style={styles.topSafeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenterCol}>
            <Text style={styles.headerTitle}>Live Order Tracking</Text>
            <Text style={styles.headerSubtitle}>
              #{order.orderNumber} •{' '}
              {order.type === 'dine_in' ? order.tableNumber || 'Dine-In' : 'Takeout'}
            </Text>
          </View>

          {/* Table / Dining Badge on Right */}
          <View style={styles.tableBadge}>
            <Ionicons
              name={order.type === 'dine_in' ? 'restaurant-outline' : 'bag-handle-outline'}
              size={13}
              color={Colors.primary}
            />
            <Text style={styles.tableBadgeText}>
              {order.type === 'dine_in' ? order.tableNumber || 'Table' : 'Takeout'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 90 : 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimal Hero ETA Status Card */}
        <View style={styles.heroStatusCard}>
          <View style={styles.statusBadgeRow}>
            <View
              style={[
                styles.statusPill,
                order.status === 'completed'
                  ? styles.statusPillCompleted
                  : styles.statusPillActive,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  order.status === 'completed'
                    ? styles.statusDotCompleted
                    : styles.statusDotActive,
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  order.status === 'completed'
                    ? styles.statusPillTextCompleted
                    : styles.statusPillTextActive,
                ]}
              >
                {statusInfo.badge}
              </Text>
            </View>
          </View>

          {/* Big Minimal ETA Counter */}
          <View style={styles.etaDisplaySection}>
            {order.status === 'completed' ? (
              <View style={styles.deliveredIconWrapper}>
                <Ionicons name="checkmark-circle" size={48} color={Colors.halalGreen} />
                <Text style={styles.deliveredTitle}>Order Complete</Text>
              </View>
            ) : (
              <>
                <Text style={styles.etaEyebrow}>ESTIMATED ARRIVAL</Text>
                <View style={styles.etaTimeRow}>
                  <Text style={styles.etaNumber}>{countdownMinutes}</Text>
                  <Text style={styles.etaMinutesLabel}>minutes</Text>
                </View>
                <Text style={styles.etaEstimatedClock}>
                  Expected around{' '}
                  <Text style={styles.etaClockBold}>
                    {new Date(Date.now() + countdownMinutes * 60000).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </Text>
              </>
            )}
          </View>

          {/* Animated 4-Stage Stepper Track */}
          <View style={styles.timelineSection}>
            <View style={styles.timelineTrackLine}>
              <View
                style={[
                  styles.timelineFillLine,
                  { width: `${(currentStepIdx / (steps.length - 1)) * 100}%` },
                ]}
              />
            </View>

            <View style={styles.stepsNodesRow}>
              {steps.map((step, idx) => {
                const isPassed = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const isUpcoming = idx > currentStepIdx;

                return (
                  <View key={step.key} style={styles.stepNodeCol}>
                    <View style={styles.nodeWrapper}>
                      {isCurrent && order.status !== 'completed' && (
                        <Animated.View
                          style={[
                            styles.pulsingBeacon,
                            {
                              transform: [{ scale: pulseAnim }],
                              opacity: pulseOpacity,
                            },
                          ]}
                        />
                      )}
                      <View
                        style={[
                          styles.nodeCircle,
                          isPassed && styles.nodeCirclePassed,
                          isCurrent && styles.nodeCircleCurrent,
                          isUpcoming && styles.nodeCircleUpcoming,
                        ]}
                      >
                        <Ionicons
                          name={
                            isPassed
                              ? 'checkmark'
                              : isCurrent
                              ? (step.icon as any)
                              : (step.icon as any)
                          }
                          size={13}
                          color={isUpcoming ? Colors.textMuted : Colors.textLight}
                        />
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.stepLabelText,
                        isCurrent && styles.stepLabelTextCurrent,
                        isPassed && styles.stepLabelTextPassed,
                        isUpcoming && styles.stepLabelTextUpcoming,
                      ]}
                      numberOfLines={1}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Live Status Description */}
          <View style={styles.liveDescBox}>
            <Text style={styles.liveDescTitle}>{statusInfo.title}</Text>
            <Text style={styles.liveDescSub}>{statusInfo.desc}</Text>
          </View>

          {/* Interactive Demo Simulation Button */}
          {order.status !== 'completed' && (
            <TouchableOpacity
              style={styles.demoPillBtn}
              onPress={handleSimulateNextStep}
              activeOpacity={0.8}
            >
              <Ionicons name="play-forward-outline" size={13} color={Colors.primary} />
              <Text style={styles.demoPillBtnText}>Simulate Kitchen Progress</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Items Breakdown with Dish Images */}
        <View style={styles.itemsCard}>
          <View style={styles.itemsCardHeader}>
            <Text style={styles.cardTitle}>Order Items ({order.items.length})</Text>
            <View style={styles.cashBadge}>
              <Ionicons name="cash-outline" size={12} color={Colors.primary} />
              <Text style={styles.cashBadgeText}>CASH</Text>
            </View>
          </View>

          <View style={styles.itemListContainer}>
            {order.items.map((it) => (
              <View key={it.cartItemId} style={styles.orderItemRow}>
                <Image
                  source={{ uri: it.dish.imageUrl }}
                  style={styles.itemThumbnail}
                  resizeMode="cover"
                />

                <View style={styles.itemDetailsCol}>
                  <View style={styles.itemNameRow}>
                    <Text style={styles.qtyBadge}>{it.quantity}x</Text>
                    <Text style={styles.dishName} numberOfLines={1}>
                      {it.dish.name}
                    </Text>
                  </View>
                  <Text style={styles.dishPortion}>{it.portion.name}</Text>
                  {it.selectedAddons && it.selectedAddons.length > 0 ? (
                    <Text style={styles.dishAddons} numberOfLines={1}>
                      + {it.selectedAddons.map((a) => a.name).join(', ')}
                    </Text>
                  ) : null}
                </View>

                <Text style={styles.itemPriceText}>
                  ₱{it.totalPrice.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Calculation Rows */}
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Subtotal</Text>
            <Text style={styles.calcVal}>₱{order.subtotal.toLocaleString()}</Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Tax & VAT (5%)</Text>
            <Text style={styles.calcVal}>₱{order.tax.toLocaleString()}</Text>
          </View>

          {order.type === 'dine_in' && order.serviceFee > 0 && (
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Service Charge (5%)</Text>
              <Text style={styles.calcVal}>₱{order.serviceFee.toLocaleString()}</Text>
            </View>
          )}

          {order.discount > 0 && (
            <View style={styles.calcRow}>
              <Text style={styles.discountLabel}>Discount</Text>
              <Text style={styles.discountVal}>-₱{order.discount.toLocaleString()}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount (CASH)</Text>
            <Text style={styles.totalValue}>₱{order.total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Docked Sticky Bottom Footer */}
      <View
        style={[
          styles.flushBottomBar,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 20 },
        ]}
      >
        <TouchableOpacity
          style={styles.backToMenuBtn}
          onPress={() => router.replace('/(tabs)' as any)}
          activeOpacity={0.88}
        >
          <Text style={styles.backToMenuBtnText}>Back to Menu</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topSafeArea: {
    backgroundColor: Colors.background,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'transparent',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenterCol: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
    marginTop: 1,
  },
  tableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.round,
    gap: 5,
  },
  tableBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  placeholderBox: {
    width: 40,
    height: 40,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  heroStatusCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  statusBadgeRow: {
    marginBottom: Spacing.md,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.round,
    gap: 6,
  },
  statusPillActive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  statusPillCompleted: {
    backgroundColor: Colors.halalGreenLight,
    borderWidth: 1,
    borderColor: Colors.halalGreen,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: Colors.primary,
  },
  statusDotCompleted: {
    backgroundColor: Colors.halalGreen,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 0.8,
  },
  statusPillTextActive: {
    color: Colors.primary,
  },
  statusPillTextCompleted: {
    color: Colors.halalGreen,
  },
  etaDisplaySection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  etaEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  etaTimeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  etaNumber: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '900',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.primary,
    letterSpacing: -1,
  },
  etaMinutesLabel: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textSecondary,
  },
  etaEstimatedClock: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
    marginTop: 4,
  },
  etaClockBold: {
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  deliveredIconWrapper: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  deliveredTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.halalGreen,
  },
  timelineSection: {
    width: '100%',
    paddingHorizontal: Spacing.xs,
    marginVertical: Spacing.md,
    position: 'relative',
  },
  timelineTrackLine: {
    position: 'absolute',
    top: 15,
    left: '12%',
    right: '12%',
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timelineFillLine: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  stepsNodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  stepNodeCol: {
    alignItems: 'center',
    width: 68,
  },
  nodeWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulsingBeacon: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
  },
  nodeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeCirclePassed: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  nodeCircleCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadows.subtle,
  },
  nodeCircleUpcoming: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  stepLabelText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  stepLabelTextCurrent: {
    color: Colors.primary,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
  },
  stepLabelTextPassed: {
    color: Colors.text,
    fontFamily: Typography.fontFamily.semiBold,
  },
  stepLabelTextUpcoming: {
    color: Colors.textMuted,
  },
  liveDescBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  liveDescTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  liveDescSub: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  demoPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.round,
  },
  demoPillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  itemsCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  itemsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  cashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  cashBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  itemListContainer: {
    gap: 10,
    marginTop: 4,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemThumbnail: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  itemDetailsCol: {
    flex: 1,
    gap: 2,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyBadge: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  dishName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    flex: 1,
  },
  dishPortion: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
  },
  dishAddons: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  itemPriceText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  calcLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  calcVal: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text,
  },
  discountLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  discountVal: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.primary,
  },
  flushBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    paddingHorizontal: Spacing.lg,
  },
  backToMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: Radius.md,
    width: '100%',
  },
  backToMenuBtnText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
    gap: Spacing.xs,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  notFoundSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  backBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: Radius.round,
  },
  backBtnText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
  },
});
