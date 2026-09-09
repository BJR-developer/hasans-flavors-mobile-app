import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useTableStore } from '@/store/useTableStore';
import { useRoleStore } from '@/store/useRoleStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateProfile } = useAuthStore();
  const currentTable = useTableStore((state) => state.currentTable);
  const clearTable = useTableStore((state) => state.clearTable);
  const { setRole } = useRoleStore();

  // Form State
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUri, setAvatarUri] = useState<string | undefined>(user?.avatarUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Notification toggles (UI-only for now)
  const [notifyOrderStatus, setNotifyOrderStatus] = useState(true);
  const [notifyKitchenPrep, setNotifyKitchenPrep] = useState(true);
  const [notifyPromos, setNotifyPromos] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setPhone(user.phone || '');
      setAvatarUri(user.avatarUrl);
    }
  }, [user]);

  const hasFormChanges =
    user && (fullName.trim() !== (user.name || '').trim() || phone.trim() !== (user.phone || '').trim());

  // Upload/change profile picture
  const handlePickAvatar = async () => {
    try {
      Haptics.selectionAsync();
    } catch {}

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      const msg = 'Camera roll access is needed to change your profile picture.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Permission Required', msg);
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      const avatarString = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;

      setAvatarUri(avatarString);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      await updateProfile({ avatarUrl: avatarString });
    }
  };

  const handleSaveChanges = async () => {
    if (!hasFormChanges || isSaving) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsSaving(true);
    await updateProfile({
      name: fullName.trim() || user?.name,
      phone: phone.trim(),
    });
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      await logout();
      router.replace('/auth/signin' as any);
    };

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Sign out of your account?') : true;
      if (confirmed) {
        await doLogout();
      }
      return;
    }

    Alert.alert('Sign Out', 'Sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doLogout },
    ]);
  };

  const handleCallHotline = async () => {
    try {
      Haptics.selectionAsync();
    } catch {}

    const phoneNumber = '+639178882345';
    const telUrl = `tel:${phoneNumber}`;
    const promptUrl = `telprompt:${phoneNumber}`;

    try {
      if (Platform.OS === 'ios') {
        const canPrompt = await Linking.canOpenURL(promptUrl).catch(() => false);
        if (canPrompt) {
          await Linking.openURL(promptUrl);
          return;
        }
      }

      const canTel = await Linking.canOpenURL(telUrl).catch(() => false);
      if (canTel) {
        await Linking.openURL(telUrl);
        return;
      }

      Alert.alert(
        'Call Restaurant Hotline',
        'Direct Line: +63 917 888 2345\n\n(On physical devices, this connects directly to the phone dialer. The simulator does not support cellular calls).',
        [{ text: 'Dismiss', style: 'cancel' }]
      );
    } catch {
      Alert.alert(
        'Call Restaurant Hotline',
        'Direct Line: +63 917 888 2345',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLiveChatAnnouncement = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    const title = 'Live Kitchen Chat • Coming Soon';
    const message =
      'Real-time messaging with our kitchen line and servers is coming in the next update!\n\nFor immediate requests, please call our hotline or speak to your table server.';

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message, [{ text: 'Understood' }]);
    }
  };

  const handleLeaveTable = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    clearTable();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Facebook-Style Centered Profile Card */}
        {isAuthenticated && user ? (
          <View style={styles.fbProfileCard}>
            {/* Centered Avatar with Camera Action Overlay */}
            <View style={styles.avatarOuterWrapper}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handlePickAvatar}
                style={styles.avatarTouchable}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.fbAvatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Ionicons name="person" size={44} color={Colors.primary} />
                  </View>
                )}

                {/* Camera upload badge */}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={15} color={Colors.textLight} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Profile Identity */}
            <Text style={styles.fbProfileName}>{user.name || 'Valued Guest'}</Text>
            {(user.role === 'owner' || user.role === 'staff') && (
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>
                  {user.role === 'owner' ? 'Owner Admin' : 'Staff'}
                </Text>
              </View>
            )}
            <Text style={styles.fbProfileEmail}>{user.email}</Text>
          </View>
        ) : (
          /* Guest Welcome Card */
          <View style={styles.guestCard}>
            <View style={styles.avatarOuterWrapper}>
              <View style={styles.avatarFallback}>
                <Ionicons name="person-outline" size={44} color={Colors.textMuted} />
              </View>
            </View>
            <Text style={styles.fbProfileName}>Guest Diner</Text>
            <Text style={styles.fbProfileEmail}>Sign in to save your favorite dishes and track live orders</Text>
            <View style={styles.guestActionRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push('/auth/signin' as any)}
              >
                <Text style={styles.primaryBtnText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => router.push('/auth/signup' as any)}
              >
                <Text style={styles.secondaryBtnText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Current Table Card (Minimal) */}
        {currentTable && (
          <View style={styles.sectionCard}>
            <View style={styles.tableRow}>
              <View style={styles.tableLeft}>
                <View style={styles.tableIconBox}>
                  <Ionicons name="restaurant" size={16} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.tableTitle}>Current Dining Table</Text>
                  <Text style={styles.tableSub}>Assigned to {currentTable}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.releaseTableBtn}
                onPress={handleLeaveTable}
                hitSlop={6}
              >
                <Text style={styles.releaseTableText}>Release Table</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Profile Fields (Editable) */}
        {isAuthenticated && user && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Personal Information</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.inputField}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={[styles.inputField, styles.disabledInput]}
                value={user.email}
                editable={false}
                placeholder="Email address"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.inputField}
                value={phone}
                onChangeText={setPhone}
                placeholder="+63 9XX XXX XXXX"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            {hasFormChanges && (
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={Colors.textLight} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                )}
              </TouchableOpacity>
            )}

            {saveSuccess && (
              <View style={styles.successRow}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.halalGreen} />
                <Text style={styles.successText}>Profile updated successfully</Text>
              </View>
            )}
          </View>
        )}

        {/* Staff / Owner Access Portals */}
        {user?.role === 'owner' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Owner Dashboard</Text>
            <TouchableOpacity
              style={styles.portalRow}
              onPress={() => {
                setRole('owner');
                router.push('/staff/owner' as any);
              }}
            >
              <Ionicons name="stats-chart-outline" size={18} color={Colors.saffron} />
              <View style={{ flex: 1 }}>
                <Text style={styles.portalTitle}>Executive Analytics & Stock</Text>
                <Text style={styles.portalSub}>View live restaurant revenue and inventory</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {user?.role === 'staff' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Staff Operations</Text>
            <TouchableOpacity
              style={styles.portalRow}
              onPress={() => {
                setRole('pos');
                router.push('/staff/pos' as any);
              }}
            >
              <Ionicons name="calculator-outline" size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.portalTitle}>POS Cashier Terminal</Text>
                <Text style={styles.portalSub}>Process registers and orders</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.portalRow, { borderBottomWidth: 0 }]}
              onPress={() => {
                setRole('kds');
                router.push('/staff/kds' as any);
              }}
            >
              <Ionicons name="flame-outline" size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.portalTitle}>Kitchen Display (KDS)</Text>
                <Text style={styles.portalSub}>Preparation line and ticket bump</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Notification Settings (UI Only) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Notification Preferences</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchTitle}>Order Status Updates</Text>
              <Text style={styles.switchSub}>Alerts when your order moves to kitchen or served</Text>
            </View>
            <Switch
              value={notifyOrderStatus}
              onValueChange={setNotifyOrderStatus}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.card}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchTitle}>Kitchen Preparation Alerts</Text>
              <Text style={styles.switchSub}>Dish checklist completion reminders</Text>
            </View>
            <Switch
              value={notifyKitchenPrep}
              onValueChange={setNotifyKitchenPrep}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.card}
            />
          </View>

          <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchTitle}>Special Offers & Promos</Text>
              <Text style={styles.switchSub}>Chef heirloom dish announcements</Text>
            </View>
            <Switch
              value={notifyPromos}
              onValueChange={setNotifyPromos}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.card}
            />
          </View>
        </View>

        {/* Restaurant Support & Live Kitchen (Minimal) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Restaurant Contact & Assistance</Text>

          {/* Restaurant Hotline */}
          <TouchableOpacity
            style={styles.contactRow}
            onPress={handleCallHotline}
            activeOpacity={0.7}
          >
            <View style={styles.contactIconBox}>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactTitle}>Restaurant Hotline</Text>
              <Text style={styles.contactSub}>+63 917 888 2345 • Direct line</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Live Kitchen Chat (Coming Soon Announcement) */}
          <TouchableOpacity
            style={[styles.contactRow, { borderBottomWidth: 0 }]}
            onPress={handleLiveChatAnnouncement}
            activeOpacity={0.7}
          >
            <View style={styles.contactIconBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.contactTitle}>Live Kitchen Chat</Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
                </View>
              </View>
              <Text style={styles.contactSub}>Direct messaging with table servers & kitchen</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={17} color={Colors.error} />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        )}

        <View style={styles.versionRow}>
          <Text style={styles.versionText}>Hasan’s Flavors • v1.0.0</Text>
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
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'transparent',
  },
  brandCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    letterSpacing: -0.3,
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
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.round,
    gap: 5,
  },
  scanBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 90,
    gap: Spacing.md,
  },
  fbProfileCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  avatarOuterWrapper: {
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTouchable: {
    position: 'relative',
  },
  fbAvatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: Colors.surface,
  },
  avatarFallback: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.card,
    ...Shadows.subtle,
  },
  fbProfileName: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  roleTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    marginTop: 4,
    marginBottom: 4,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  fbProfileEmail: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
    marginTop: 4,
  },
  guestCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
    ...Shadows.subtle,
  },
  guestActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: Spacing.md,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 11,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 11,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  sectionHeading: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tableIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
  },
  tableSub: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    marginTop: 1,
  },
  releaseTableBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  releaseTableText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.error,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  inputField: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text,
  },
  disabledInput: {
    backgroundColor: Colors.surfaceHighlight,
    color: Colors.textMuted,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 11,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: Colors.textLight,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    justifyContent: 'center',
  },
  successText: {
    fontSize: 11,
    color: Colors.halalGreen,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.medium,
  },
  portalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  portalTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  portalSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  switchTextCol: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  switchTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  switchSub: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  contactIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  contactSub: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
    marginTop: 1,
  },
  comingSoonBadge: {
    backgroundColor: Colors.saffronLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  comingSoonBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.saffronDark,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 13,
    borderRadius: Radius.md,
    ...Shadows.subtle,
  },
  logoutBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.error,
  },
  versionRow: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  versionText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily.medium,
  },
});
