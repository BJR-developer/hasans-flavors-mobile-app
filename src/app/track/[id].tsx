import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '@/components/Header';
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
  const [countdownMinutes, setCountdownMinutes] = useState(order?.estimatedMinutes || 25);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownMinutes((prev) => Math.max(1, prev - 1));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Order Tracker" showBack />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>Order Not Found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/orders' as any)}>
            <Text style={styles.backBtnText}>View All Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const steps: { key: OrderStatus; title: string; subtitle: string; icon: string }[] = [
    {
      key: 'pending',
      title: 'Order Confirmed',
      subtitle: 'Order received & sent to kitchen staff',
      icon: 'receipt',
    },
    {
      key: 'preparing',
      title: 'Cooking in Kitchen',
      subtitle: 'Dum biryani simmering with hot aromatic masalas',
      icon: 'flame',
    },
    {
      key: 'ready',
      title: order.type === 'dine_in' ? 'Delivered to Table' : 'Ready for Pickup / Rider',
      subtitle: order.type === 'dine_in' ? `Staff serving at ${order.tableNumber || 'Table 04'}` : 'Rider picked up order',
      icon: 'bicycle',
    },
    {
      key: 'completed',
      title: 'Delivered & Enjoy!',
      subtitle: 'Thank you for ordering with Hasan’s Flavors',
      icon: 'checkmark-circle',
    },
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

  // Demo simulator button to advance status
  const handleSimulateNextStep = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    const sequence: OrderStatus[] = ['pending', 'preparing', 'ready', 'completed'];
    const nextIdx = Math.min(sequence.length - 1, currentStepIdx + 1);
    updateOrderStatus(order.id, sequence[nextIdx]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title={`Live Tracker ${order.orderNumber}`} showBack />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Estimated Time Card */}
        <View style={styles.heroTimerCard}>
          <View style={styles.timerTopRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveStatusText}>
              {order.status === 'completed'
                ? 'ORDER COMPLETED'
                : order.status === 'ready'
                ? 'READY FOR ENJOYMENT'
                : 'PREPARATION IN PROGRESS'}
            </Text>
          </View>

          <Text style={styles.countdownNumber}>
            {order.status === 'completed' ? '0' : countdownMinutes}
            <Text style={styles.countdownUnit}> mins</Text>
          </Text>

          <Text style={styles.etaText}>
            Estimated arrival time:{' '}
            <Text style={styles.etaBold}>
              {new Date(Date.now() + countdownMinutes * 60000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Text>
        </View>

        {/* 4-Step Visual Progress Stepper */}
        <View style={styles.stepperCard}>
          <Text style={styles.sectionHeaderTitle}>Live Order Journey</Text>

          <View style={styles.timeline}>
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const isFuture = idx > currentStepIdx;

              return (
                <View key={step.key} style={styles.timelineItem}>
                  {/* Left Column: Icon & Line */}
                  <View style={styles.timelineIconCol}>
                    <View
                      style={[
                        styles.timelineCircle,
                        isPast && styles.circlePast,
                        isCurrent && styles.circleCurrent,
                        isFuture && styles.circleFuture,
                      ]}
                    >
                      <Ionicons
                        name={step.icon as any}
                        size={18}
                        color={isFuture ? Colors.textMuted : Colors.textLight}
                      />
                    </View>

                    {idx < steps.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          idx < currentStepIdx ? styles.lineActive : styles.lineInactive,
                        ]}
                      />
                    )}
                  </View>

                  {/* Right Column: Text */}
                  <View style={styles.timelineTextCol}>
                    <Text
                      style={[
                        styles.stepTitle,
                        isCurrent && styles.stepTitleCurrent,
                        isFuture && styles.stepTitleFuture,
                      ]}
                    >
                      {step.title}
                    </Text>
                    <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Interactive Demo Simulation Button */}
          {order.status !== 'completed' && (
            <TouchableOpacity style={styles.simBtn} onPress={handleSimulateNextStep}>
              <Ionicons name="fast-food-outline" size={16} color={Colors.primary} />
              <Text style={styles.simBtnText}>Demo: Advance Order Status</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Delivery / Table Destination Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Destination & Contact</Text>

          <View style={styles.destRow}>
            <View style={styles.destIconBox}>
              <Ionicons
                name={order.type === 'dine_in' ? 'restaurant' : 'location'}
                size={20}
                color={Colors.primary}
              />
            </View>
            <View style={styles.destTextCol}>
              <Text style={styles.destTitle}>
                {order.type === 'dine_in'
                  ? `Dine-In Table: ${order.tableNumber || 'Table 04'}`
                  : 'Delivery Address'}
              </Text>
              <Text style={styles.destSub}>
                {order.type === 'dine_in'
                  ? 'Kitchen staff will bring food directly to your table.'
                  : order.deliveryAddress || 'Makati Central, Metro Manila'}
              </Text>
            </View>
          </View>

          {/* Hotline / Help button */}
          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => {
                Linking.openURL('tel:+639178882345').catch(() => {
                  Alert.alert("Call Restaurant", "Call Hasan's Flavors at +63 917 888 2345");
                });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="call-outline" size={16} color={Colors.primary} />
              <Text style={styles.contactBtnText}>Call Restaurant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactBtn, styles.chatHelpBtn]}
              onPress={() => router.push('/chat' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles" size={16} color={Colors.textLight} />
              <Text style={styles.chatHelpBtnText}>Live Chat Help</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Receipt Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Order Summary ({order.items.length} items)</Text>

          {order.items.map((it) => (
            <View key={it.cartItemId} style={styles.itemRow}>
              <Text style={styles.itemQty}>{it.quantity}x</Text>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{it.dish.name}</Text>
                <Text style={styles.itemPortion}>{it.portion.name}</Text>
              </View>
              <Text style={styles.itemPrice}>₱{it.totalPrice.toLocaleString()}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid ({order.paymentMethod.toUpperCase()})</Text>
            <Text style={styles.totalVal}>₱{order.total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Return to Home / Menu */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace('/(tabs)' as any)}
        >
          <Text style={styles.homeBtnText}>Back to Home Menu</Text>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 90,
    gap: Spacing.md,
  },
  heroTimerCard: {
    backgroundColor: '#1E1B18',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.card,
  },
  timerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.round,
    marginBottom: Spacing.md,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  liveStatusText: {
    color: '#00E676',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  countdownNumber: {
    color: Colors.textLight,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  countdownUnit: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.saffron,
  },
  etaText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.fontSize.xs,
    marginTop: 4,
  },
  etaBold: {
    color: Colors.textLight,
    fontWeight: '800',
  },
  stepperCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.subtle,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionHeaderTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  timeline: {
    paddingLeft: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  timelineIconCol: {
    alignItems: 'center',
    marginRight: 14,
    width: 36,
  },
  timelineCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circlePast: {
    backgroundColor: Colors.halalGreen,
  },
  circleCurrent: {
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: '#FFCDD2',
  },
  circleFuture: {
    backgroundColor: '#F0EFEA',
  },
  timelineLine: {
    width: 2,
    height: 32,
    marginVertical: 3,
  },
  lineActive: {
    backgroundColor: Colors.halalGreen,
  },
  lineInactive: {
    backgroundColor: '#EAE8E3',
  },
  timelineTextCol: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: Spacing.md,
  },
  stepTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 18,
  },
  stepTitleCurrent: {
    color: Colors.primary,
    fontWeight: '800',
  },
  stepTitleFuture: {
    color: Colors.textMuted,
  },
  stepSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  simBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFCACA',
    paddingVertical: 10,
    borderRadius: Radius.md,
    gap: 6,
    marginTop: Spacing.sm,
  },
  simBtnText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.subtle,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  destRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
  },
  destIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.round,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  destTextCol: {
    flex: 1,
  },
  destTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  destSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FAF9F8',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    gap: 6,
  },
  contactBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  chatHelpBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chatHelpBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
    color: Colors.textLight,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemQty: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
    color: Colors.primary,
    width: 28,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
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
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    color: Colors.text,
  },
  totalVal: {
    fontSize: Typography.fontSize.md,
    fontWeight: '900',
    color: Colors.primary,
  },
  footer: {
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  homeBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    alignItems: 'center',
    ...Shadows.card,
  },
  homeBtnText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontSize: Typography.fontSize.sm,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  backBtnText: {
    color: Colors.textLight,
    fontWeight: '700',
  },
});
