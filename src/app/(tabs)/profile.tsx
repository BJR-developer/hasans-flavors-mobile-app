import { Header } from '@/components/Header';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useTableStore } from '@/store/useTableStore';
import { useRoleStore } from '@/store/useRoleStore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const currentTable = useTableStore((state) => state.currentTable);
  const clearTable = useTableStore((state) => state.clearTable);
  const { setRole } = useRoleStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch { }
            logout();
            router.replace('/auth/signin' as any);
          },
        },
      ]
    );
  };

  const handleLeaveTable = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch { }
    clearTable();
  };

  const handleReplaySplash = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { }
    router.push('/splash' as any);
  };

  const handleReplayOnboarding = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { }
    router.push('/onboarding' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Account" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card: Authenticated vs Guest */}
        {isAuthenticated && user ? (
          <View style={styles.userCard}>
            <View style={styles.avatarWrapper}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={24} color={Colors.textSecondary} />
                </View>
              )}
            </View>

            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>{user.name}</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>{user.tier || user.roleLabel}</Text>
                </View>
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userPhone}>{user.phone}</Text>
            </View>
          </View>
        ) : (
          /* Guest Banner */
          <View style={styles.guestCard}>
            <View style={styles.guestTopRow}>
              <View style={styles.guestAvatar}>
                <Ionicons name="person-circle-outline" size={40} color={Colors.textSecondary} />
              </View>
              <View style={styles.guestTextCol}>
                <Text style={styles.guestTitle}>Welcome to Hasan's Flavors</Text>
                <Text style={styles.guestSubtitle}>
                  Sign in or switch demo accounts (Customer, Staff, Owner).
                </Text>
              </View>
            </View>

            <View style={styles.guestButtonRow}>
              <TouchableOpacity
                style={styles.guestSignInBtn}
                onPress={() => router.push('/auth/signin' as any)}
                activeOpacity={0.88}
              >
                <Text style={styles.guestSignInText}>Sign In / Switch Account</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Role Portals: Strict Role Segregation */}
        {user?.role === 'owner' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>Executive Owner Portal</Text>

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                setRole('owner');
                router.push('/staff/owner' as any);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="stats-chart-outline" size={18} color={Colors.saffron} style={styles.menuIcon} />
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>Owner Analytics & Inventory</Text>
                <Text style={styles.menuItemSub}>Revenue, live order audit & stock control</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {user?.role === 'staff' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>Cashier & Kitchen Operations</Text>

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                setRole('pos');
                router.push('/staff/pos' as any);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="calculator-outline" size={18} color={Colors.primary} style={styles.menuIcon} />
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>POS Cashier Terminal</Text>
                <Text style={styles.menuItemSub}>Ring up orders & process registers</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                setRole('kds');
                router.push('/staff/kds' as any);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="flame-outline" size={18} color={Colors.primary} style={styles.menuIcon} />
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>Kitchen Display System (KDS)</Text>
                <Text style={styles.menuItemSub}>Live kitchen ticket preparation & bump</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Loyalty Rewards Card (Customer View) */}
        {(!user || user.role === 'customer') && (
          <View style={styles.loyaltyCard}>
            <View style={styles.loyaltyHeader}>
              <Text style={styles.loyaltyBadgeText}>SPICE CLUB REWARDS</Text>
              <Text style={styles.pointsText}>
                <Text style={styles.boldPoints}>{isAuthenticated ? user?.loyaltyPoints : '0'}</Text> pts
              </Text>
            </View>

            <Text style={styles.loyaltyTitle}>Loyalty Points Balance</Text>
            <Text style={styles.loyaltySub}>
              {isAuthenticated
                ? `You have ${user?.loyaltyPoints} points. 20 more points to unlock a complimentary specialty naan.`
                : 'Earn 1 point for every ₱10 spent and receive 100 bonus welcome points on signup.'}
            </Text>

            <View style={styles.loyaltyProgressTrack}>
              <View
                style={[
                  styles.loyaltyProgressFill,
                  { width: isAuthenticated ? '94%' : '10%' },
                ]}
              />
            </View>

            <View style={styles.loyaltyFooter}>
              <Text style={styles.loyaltyLevel}>
                {isAuthenticated ? `${user?.loyaltyPoints} / 500 Pts` : '0 / 500 Pts'}
              </Text>
              <TouchableOpacity
                style={styles.redeemBtn}
                onPress={() => {
                  if (!isAuthenticated) {
                    router.push('/auth/signin' as any);
                  } else {
                    Alert.alert('Rewards', 'Redeem 500 pts for free Garlic Naan or Kabab at checkout.');
                  }
                }}
              >
                <Text style={styles.redeemBtnText}>
                  {isAuthenticated ? 'Redeem' : 'Join Club'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Dine-in Table Status if assigned */}
        {currentTable && (
          <View style={styles.sectionCard}>
            <View style={styles.tableActiveRow}>
              <View style={styles.tableInfoCol}>
                <Text style={styles.sectionCardTitle}>Current Table</Text>
                <Text style={styles.tableNumberText}>Assigned to {currentTable}</Text>
              </View>
              <TouchableOpacity style={styles.leaveTableBtn} onPress={handleLeaveTable}>
                <Text style={styles.leaveTableText}>Release Table</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* App Navigation Rows */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Features & Support</Text>

          <TouchableOpacity style={styles.menuRow} onPress={handleReplaySplash} activeOpacity={0.7}>
            <Ionicons name="sparkles-outline" size={18} color={Colors.textSecondary} style={styles.menuIcon} />
            <View style={styles.menuTextCol}>
              <Text style={styles.menuItemTitle}>Brand Splash</Text>
              <Text style={styles.menuItemSub}>Replay the brand intro</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={handleReplayOnboarding} activeOpacity={0.7}>
            <Ionicons name="images-outline" size={18} color={Colors.textSecondary} style={styles.menuIcon} />
            <View style={styles.menuTextCol}>
              <Text style={styles.menuItemTitle}>Onboarding Walkthrough</Text>
              <Text style={styles.menuItemSub}>Browse app overview slides</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/chat' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubbles-outline" size={18} color={Colors.textSecondary} style={styles.menuIcon} />
            <View style={styles.menuTextCol}>
              <Text style={styles.menuItemTitle}>Kitchen & Support Chat</Text>
              <Text style={styles.menuItemSub}>Live assistance for dietary queries and orders</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Halal Guarantee */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Halal & Heritage Guarantee</Text>

          <View style={styles.halalFeatureRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.textSecondary} style={styles.menuIcon} />
            <View style={styles.halalFeatureText}>
              <Text style={styles.halalTitle}>100% Zabihah Halal Certified</Text>
              <Text style={styles.halalDesc}>
                All beef, mutton, and poultry are sourced exclusively from certified halal suppliers.
              </Text>
            </View>
          </View>

          <View style={styles.halalFeatureRow}>
            <Ionicons name="restaurant-outline" size={18} color={Colors.textSecondary} style={styles.menuIcon} />
            <View style={styles.halalFeatureText}>
              <Text style={styles.halalTitle}>Authentic Heirloom Spices</Text>
              <Text style={styles.halalDesc}>
                Aged basmati grains and whole garam masalas hand-ground daily in-house.
              </Text>
            </View>
          </View>
        </View>

        {/* Switch Account / Sign Out Button */}
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.text} />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        )}

        {/* App Version Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.versionText}>Hasan's Flavors • v1.0.0</Text>
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
    padding: Spacing.lg,
    paddingBottom: 90,
    gap: Spacing.md,
  },
  userCard: {
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
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: Radius.round,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  verifiedBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  userEmail: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  userPhone: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  guestCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.subtle,
  },
  guestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guestAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestTextCol: {
    flex: 1,
  },
  guestTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  guestSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  guestButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  guestSignInBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.text,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  guestSignInText: {
    color: Colors.textLight,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  loyaltyCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  loyaltyBadgeText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  pointsText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
  },
  boldPoints: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
  },
  loyaltyTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  loyaltySub: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    lineHeight: 16,
    marginBottom: Spacing.md,
  },
  loyaltyProgressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  loyaltyProgressFill: {
    height: '100%',
    backgroundColor: Colors.text,
    borderRadius: 2,
  },
  loyaltyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loyaltyLevel: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  redeemBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  redeemBtnText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 11,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  sectionCardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuIcon: {
    width: 24,
  },
  menuTextCol: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  menuItemSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
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
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  leaveTableBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leaveTableText: {
    color: Colors.error,
    fontWeight: '600',
    fontSize: 11,
  },
  halalFeatureRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  halalFeatureText: {
    flex: 1,
  },
  halalTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  halalDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  logoutButtonText: {
    color: Colors.text,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  versionText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
