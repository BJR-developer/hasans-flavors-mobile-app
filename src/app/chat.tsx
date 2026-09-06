import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTableStore } from '@/store/useTableStore';
import { useOrderStore } from '@/store/useOrderStore';
import * as Haptics from 'expo-haptics';

export default function LiveChatScreen() {
  const router = useRouter();
  const currentTable = useTableStore((state) => state.currentTable);
  const orders = useOrderStore((state) => state.orders);

  // Find the active ongoing order if available
  const activeOrder = orders.find(
    (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  );

  const handleCallHotline = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    Linking.openURL('tel:+639178882345').catch(() => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Restaurant Hotline: Call +63 917 888 2345');
      } else {
        Alert.alert('Restaurant Hotline', 'Call +63 917 888 2345');
      }
    });
  };

  const handleOpenWhatsApp = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    const msg = encodeURIComponent(
      `Hello Hasan's Flavors! I need assistance${currentTable ? ` with Table ${currentTable}` : ''}.`
    );
    Linking.openURL(`https://wa.me/639178882345?text=${msg}`).catch(() => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('WhatsApp Hotline: +63 917 888 2345');
      } else {
        Alert.alert('WhatsApp Hotline', 'WhatsApp is available at +63 917 888 2345');
      }
    });
  };

  const handleRequestFloorServer = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    const msg = `A floor captain has been notified to assist you at ${currentTable || 'your table'}. We will be with you in moments.`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`Server Notified:\n${msg}`);
    } else {
      Alert.alert('Server Notified', msg, [{ text: 'OK' }]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Received by Kitchen', color: Colors.saffron, icon: 'time-outline' };
      case 'preparing':
        return { label: 'Cooking in Kitchen', color: Colors.primary, icon: 'flame-outline' };
      case 'ready':
        return { label: 'Ready to Serve', color: Colors.halalGreen, icon: 'checkmark-circle-outline' };
      default:
        return { label: status, color: Colors.textSecondary, icon: 'receipt-outline' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Guest Support &amp; Help</Text>
          <Text style={styles.headerSub}>Hasan's Flavors Floor Hospitality</Text>
        </View>

        <TouchableOpacity style={styles.phoneCallBtn} onPress={handleCallHotline} activeOpacity={0.8}>
          <Ionicons name="call" size={16} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Order Card if present */}
        {activeOrder && (
          <View style={styles.activeOrderCard}>
            <View style={styles.activeOrderHeader}>
              <View>
                <Text style={styles.activeOrderNumber}>{activeOrder.orderNumber}</Text>
                <Text style={styles.activeOrderDate}>
                  {activeOrder.type === 'dine_in'
                    ? `Dine-In • ${activeOrder.tableNumber || currentTable || 'Table'}`
                    : 'Takeout Order'}
                </Text>
              </View>
              <View style={[styles.orderStatusPill, { backgroundColor: Colors.surface }]}>
                <Ionicons
                  name={getStatusBadge(activeOrder.status).icon as any}
                  size={13}
                  color={getStatusBadge(activeOrder.status).color}
                />
                <Text style={[styles.orderStatusPillText, { color: getStatusBadge(activeOrder.status).color }]}>
                  {getStatusBadge(activeOrder.status).label}
                </Text>
              </View>
            </View>

            <View style={styles.activeOrderItems}>
              <Text style={styles.activeOrderItemsCount}>
                {activeOrder.items.length} item{activeOrder.items.length > 1 ? 's' : ''} • Total ₱{activeOrder.total.toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.trackOrderBtn}
              onPress={() => router.push(`/track/${activeOrder.id}` as any)}
              activeOpacity={0.88}
            >
              <Ionicons name="location-outline" size={15} color={Colors.textLight} />
              <Text style={styles.trackOrderBtnText}>View Realtime Kitchen Tracking</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 1-Tap Hospitality Channels */}
        <Text style={styles.sectionHeading}>Instant Contact Channels</Text>

        <View style={styles.channelGrid}>
          <TouchableOpacity
            style={styles.channelCard}
            onPress={handleCallHotline}
            activeOpacity={0.8}
          >
            <View style={[styles.channelIconBox, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="call" size={22} color={Colors.primary} />
            </View>
            <View style={styles.channelTextCol}>
              <Text style={styles.channelTitle}>Phone Floor Hotline</Text>
              <Text style={styles.channelSub}>+63 917 888 2345 • Immediate connection</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.channelCard}
            onPress={handleOpenWhatsApp}
            activeOpacity={0.8}
          >
            <View style={[styles.channelIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="logo-whatsapp" size={22} color="#2E7D32" />
            </View>
            <View style={styles.channelTextCol}>
              <Text style={styles.channelTitle}>WhatsApp Hospitality</Text>
              <Text style={styles.channelSub}>Chat directly with our manager on duty</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          {currentTable && (
            <TouchableOpacity
              style={styles.channelCard}
              onPress={handleRequestFloorServer}
              activeOpacity={0.8}
            >
              <View style={[styles.channelIconBox, { backgroundColor: Colors.saffronLight }]}>
                <Ionicons name="notifications" size={22} color={Colors.saffronDark} />
              </View>
              <View style={styles.channelTextCol}>
                <Text style={styles.channelTitle}>Call Server to {currentTable}</Text>
                <Text style={styles.channelSub}>Request extra napkins, water, or bill</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Guarantees & Kitchen Information */}
        <Text style={styles.sectionHeading}>Kitchen &amp; Dietary Guidelines</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.halalGreen} style={styles.infoIcon} />
            <View style={styles.infoTextCol}>
              <Text style={styles.infoTitle}>100% Zabihah Halal Certified</Text>
              <Text style={styles.infoDesc}>
                All meat (mutton, beef, chicken) is strictly Zabihah halal certified. Our kitchen strictly prohibits alcohol and non-halal ingredients.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="flame" size={20} color={Colors.primary} style={styles.infoIcon} />
            <View style={styles.infoTextCol}>
              <Text style={styles.infoTitle}>Spice Level Adjustments</Text>
              <Text style={styles.infoDesc}>
                Dishes can be customized from Mild (1) to Fiery (4) during ordering. For sensitive palates or kids, mention your preference to the kitchen.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color={Colors.textSecondary} style={styles.infoIcon} />
            <View style={styles.infoTextCol}>
              <Text style={styles.infoTitle}>Service Hours &amp; Location</Text>
              <Text style={styles.infoDesc}>
                Monday – Sunday: 11:00 AM – 11:00 PM{'\n'}
                Hasan's Flavors Authentic Handi House, Metro Manila
              </Text>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily.medium,
  },
  phoneCallBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.round,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.subtle,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 60,
  },
  activeOrderCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
    gap: 12,
  },
  activeOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activeOrderNumber: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
  },
  activeOrderDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  orderStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderStatusPillText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
  },
  activeOrderItems: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 8,
  },
  activeOrderItemsCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.medium,
  },
  trackOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: Radius.md,
    ...Shadows.card,
  },
  trackOrderBtnText: {
    color: Colors.textLight,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
  },
  sectionHeading: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  channelGrid: {
    gap: 10,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...Shadows.subtle,
  },
  channelIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelTextCol: {
    flex: 1,
  },
  channelTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  channelSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...Shadows.subtle,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginTop: 2,
  },
  infoTextCol: {
    flex: 1,
  },
  infoTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  infoDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
});
