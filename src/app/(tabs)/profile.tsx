import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useRoleStore } from '@/store/useRoleStore';
import { useTableStore } from '@/store/useTableStore';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const router = useRouter();
  const { currentRole, setRole } = useRoleStore();
  const currentTable = useTableStore((state) => state.currentTable);
  const clearTable = useTableStore((state) => state.clearTable);

  const handleOpenStaffModal = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    useRoleStore.setState({ isPinModalOpen: true });
  };

  const handleLeaveTable = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    clearTable();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="My Account" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>Jamilur Rahman</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.halalGreen} />
                <Text style={styles.verifiedText}>Member</Text>
              </View>
            </View>
            <Text style={styles.userEmail}>jamilur@example.com • +63 917 888 2345</Text>
          </View>
        </View>

        {/* Hasan's Loyalty Rewards Card */}
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyHeader}>
            <View style={styles.loyaltyBadge}>
              <Ionicons name="trophy" size={16} color="#FFD700" />
              <Text style={styles.loyaltyBadgeText}>GOLD REWARDS</Text>
            </View>
            <Text style={styles.pointsText}>
              <Text style={styles.boldPoints}>480</Text> pts
            </Text>
          </View>

          <Text style={styles.loyaltyTitle}>Hasan's Spice Club Points</Text>
          <Text style={styles.loyaltySub}>
            Earn 1 point for every ₱10 spent. You're 20 points away from a FREE Chicken Dum Kabab!
          </Text>

          {/* Progress Bar */}
          <View style={styles.loyaltyProgressTrack}>
            <View style={[styles.loyaltyProgressFill, { width: '96%' }]} />
          </View>

          <View style={styles.loyaltyFooter}>
            <Text style={styles.loyaltyLevel}>Progress: 480 / 500 Pts</Text>
            <TouchableOpacity style={styles.redeemBtn}>
              <Text style={styles.redeemBtnText}>Redeem Rewards</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dine-in Table Status */}
        {currentTable && (
          <View style={styles.sectionCard}>
            <View style={styles.tableActiveRow}>
              <View style={styles.tableInfoCol}>
                <Text style={styles.sectionCardTitle}>Currently Dining In</Text>
                <Text style={styles.tableNumberText}>Assigned to {currentTable}</Text>
              </View>
              <TouchableOpacity style={styles.leaveTableBtn} onPress={handleLeaveTable}>
                <Text style={styles.leaveTableText}>Release Table</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Halal Certification & Restaurant Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Halal & Kitchen Standards</Text>

          <View style={styles.halalFeatureRow}>
            <View style={[styles.halalIconCircle, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.halalGreen} />
            </View>
            <View style={styles.halalFeatureText}>
              <Text style={styles.halalTitle}>100% Zabihah Halal Certified</Text>
              <Text style={styles.halalDesc}>
                All meats and poultry are sourced exclusively from certified Halal Islamic suppliers.
              </Text>
            </View>
          </View>

          <View style={styles.halalFeatureRow}>
            <View style={[styles.halalIconCircle, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="restaurant" size={20} color={Colors.saffronDark} />
            </View>
            <View style={styles.halalFeatureText}>
              <Text style={styles.halalTitle}>Authentic Heirloom Spices</Text>
              <Text style={styles.halalDesc}>
                Basmati grains and fresh whole garam masalas blended in-house daily.
              </Text>
            </View>
          </View>

          <View style={styles.halalFeatureRow}>
            <View style={[styles.halalIconCircle, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="location" size={20} color="#1565C0" />
            </View>
            <View style={styles.halalFeatureText}>
              <Text style={styles.halalTitle}>Hasan's Flavors Kitchen & Dine-In</Text>
              <Text style={styles.halalDesc}>
                Official Website: halalfood.com.ph • Delivery Hotline: (02) 8891-2345
              </Text>
            </View>
          </View>
        </View>

        {/* Staff & Operational Switcher Section */}
        <View style={[styles.sectionCard, styles.staffPortalCard]}>
          <View style={styles.staffHeader}>
            <View style={styles.staffIconBadge}>
              <Ionicons name="business" size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.staffPortalTitle}>Restaurant Operations Portal</Text>
              <Text style={styles.staffPortalSub}>Switch to Kitchen (KDS), Cashier (POS), or Owner Dashboard</Text>
            </View>
          </View>

          <View style={styles.staffButtonGrid}>
            <TouchableOpacity
              style={styles.staffBtn}
              onPress={() => {
                useRoleStore.getState().setRole('kds');
                router.replace('/staff/kds' as any);
              }}
            >
              <Ionicons name="flame" size={20} color="#E65100" />
              <Text style={styles.staffBtnText}>Kitchen KDS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.staffBtn}
              onPress={() => {
                useRoleStore.getState().setRole('pos');
                router.replace('/staff/pos' as any);
              }}
            >
              <Ionicons name="calculator" size={20} color="#1565C0" />
              <Text style={styles.staffBtnText}>Cashier POS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.staffBtn}
              onPress={() => {
                useRoleStore.getState().setRole('owner');
                router.replace('/staff/owner' as any);
              }}
            >
              <Ionicons name="stats-chart" size={20} color="#2E7D32" />
              <Text style={styles.staffBtnText}>Owner Portal</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.switchModeFullBtn} onPress={handleOpenStaffModal}>
            <Ionicons name="key-outline" size={16} color={Colors.primary} />
            <Text style={styles.switchModeFullBtnText}>Enter Staff PIN / Switch Mode</Text>
          </TouchableOpacity>
        </View>

        {/* App Version Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.versionText}>Hasan's Flavors Restaurant Ecosystem v1.0.0 (Expo SDK 57)</Text>
          <Text style={styles.copyText}>© 2026 Hasan's Flavors • Powered by Stitch & Expo</Text>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 90,
    gap: Spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.subtle,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: Radius.round,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.halalGreenLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.round,
    gap: 2,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.halalGreenDark,
  },
  userEmail: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  loyaltyCard: {
    backgroundColor: '#1E1B18',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  loyaltyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.round,
    gap: 4,
  },
  loyaltyBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pointsText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.fontSize.sm,
  },
  boldPoints: {
    color: '#FFD700',
    fontSize: Typography.fontSize.xl,
    fontWeight: '900',
  },
  loyaltyTitle: {
    color: Colors.textLight,
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    marginBottom: 4,
  },
  loyaltySub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: Spacing.md,
  },
  loyaltyProgressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  loyaltyProgressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  loyaltyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loyaltyLevel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  redeemBtn: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  redeemBtnText: {
    color: '#1A1A1A',
    fontWeight: '800',
    fontSize: 11,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.subtle,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionCardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  tableActiveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableInfoCol: {
    flex: 1,
  },
  tableNumberText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.halalGreenDark,
    marginTop: -4,
  },
  leaveTableBtn: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  leaveTableText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 11,
  },
  halalFeatureRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
  },
  halalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  halalFeatureText: {
    flex: 1,
  },
  halalTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  halalDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  staffPortalCard: {
    backgroundColor: '#FFF8F8',
    borderColor: '#FFDEDE',
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  staffIconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffPortalTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
  },
  staffPortalSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  staffButtonGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  staffBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  staffBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  switchModeFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFCACA',
    borderRadius: Radius.md,
    paddingVertical: 10,
    gap: 6,
  },
  switchModeFullBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  versionText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  copyText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
