import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRoleStore } from '@/store/useRoleStore';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { UserRole } from '@/types';
import * as Haptics from 'expo-haptics';

export const RoleSwitcherModal: React.FC = () => {
  const router = useRouter();
  const { isPinModalOpen, targetRole, closePinModal, verifyPin, currentRole, setRole } = useRoleStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isPinModalOpen && !targetRole) return null;

  const rolesConfig: { id: UserRole; title: string; subtitle: string; icon: string; route: string; color: string }[] = [
    {
      id: 'customer',
      title: 'Customer App',
      subtitle: 'Digital Menu, Dine-In Table QR & Delivery',
      icon: 'restaurant',
      route: '/(tabs)',
      color: Colors.primary,
    },
    {
      id: 'kds',
      title: 'Kitchen Display (KDS)',
      subtitle: 'Live ticket Kanban, prep timers & bump controls',
      icon: 'flame',
      route: '/staff/kds',
      color: '#E65100',
    },
    {
      id: 'pos',
      title: 'Cashier POS Terminal',
      subtitle: 'Fast counter ordering, billing & receipt printing',
      icon: 'calculator',
      route: '/staff/pos',
      color: '#1565C0',
    },
    {
      id: 'owner',
      title: 'Owner Dashboard',
      subtitle: 'Live revenue, gross sales, AOV & inventory toggle',
      icon: 'stats-chart',
      route: '/staff/owner',
      color: '#2E7D32',
    },
  ];

  const handleSelectRoleDirect = (r: typeof rolesConfig[0]) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (r.id === 'customer') {
      setRole('customer');
      closePinModal();
      router.replace('/(tabs)' as any);
    } else {
      // Prompt for PIN
      useRoleStore.getState().requestRoleChange(r.id);
    }
  };

  const handleVerify = () => {
    const ok = verifyPin(pin);
    if (ok && targetRole) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      const targetConfig = rolesConfig.find((r) => r.id === targetRole);
      setPin('');
      setError(false);
      closePinModal();
      if (targetConfig) {
        router.replace(targetConfig.route as any);
      }
    } else {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      setError(true);
      setPin('');
    }
  };

  return (
    <Modal visible={isPinModalOpen} transparent animationType="fade" onRequestClose={closePinModal}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
                <Text style={styles.title}>Switch Operational View</Text>
              </View>
              <TouchableOpacity onPress={closePinModal} hitSlop={10}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.instruction}>
              Select an ecosystem module or enter staff PIN <Text style={styles.bold}>1234</Text> (or Owner PIN <Text style={styles.bold}>8888</Text>):
            </Text>

            {/* Quick Role Options */}
            <View style={styles.rolesList}>
              {rolesConfig.map((r) => {
                const isCurrent = currentRole === r.id;
                const isTarget = targetRole === r.id;

                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.roleItem,
                      isCurrent && styles.activeRoleItem,
                      isTarget && { borderColor: r.color, backgroundColor: `${r.color}10` },
                    ]}
                    onPress={() => handleSelectRoleDirect(r)}
                  >
                    <View style={[styles.roleIconBox, { backgroundColor: `${r.color}20` }]}>
                      <Ionicons name={r.icon as any} size={20} color={r.color} />
                    </View>
                    <View style={styles.roleTextBox}>
                      <View style={styles.roleTitleRow}>
                        <Text style={styles.roleTitle}>{r.title}</Text>
                        {isCurrent && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>ACTIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.roleSubtitle} numberOfLines={1}>
                        {r.subtitle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* PIN Input Section when target is staff role */}
            {targetRole && targetRole !== 'customer' && (
              <View style={styles.pinSection}>
                <Text style={styles.pinLabel}>
                  Enter PIN to unlock {rolesConfig.find((r) => r.id === targetRole)?.title}:
                </Text>

                <View style={styles.pinInputRow}>
                  <TextInput
                    style={[styles.pinInput, error && styles.pinInputError]}
                    value={pin}
                    onChangeText={(val) => {
                      setPin(val);
                      setError(false);
                    }}
                    placeholder="Enter PIN (e.g. 1234)"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                    autoFocus
                  />
                  <TouchableOpacity style={styles.submitPinBtn} onPress={handleVerify}>
                    <Text style={styles.submitPinText}>Unlock</Text>
                  </TouchableOpacity>
                </View>

                {error && <Text style={styles.errorText}>Invalid PIN. Use 1234 (Staff) or 8888 (Owner)</Text>}
              </View>
            )}

            {/* Demo Quick Unlock Buttons */}
            <View style={styles.demoFooter}>
              <Text style={styles.demoText}>Quick Demo Passwords:</Text>
              <View style={styles.demoPills}>
                <TouchableOpacity
                  style={styles.demoPill}
                  onPress={() => {
                    setPin('1234');
                    verifyPin('1234');
                    const targetConfig = rolesConfig.find((r) => r.id === targetRole);
                    closePinModal();
                    if (targetConfig) router.replace(targetConfig.route as any);
                  }}
                >
                  <Text style={styles.demoPillText}>Staff: 1234</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoPill}
                  onPress={() => {
                    setPin('8888');
                    verifyPin('8888');
                    const targetConfig = rolesConfig.find((r) => r.id === targetRole);
                    closePinModal();
                    if (targetConfig) router.replace(targetConfig.route as any);
                  }}
                >
                  <Text style={styles.demoPillText}>Owner: 8888</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadows.floating,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  instruction: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: Colors.primary,
  },
  rolesList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    gap: 12,
  },
  activeRoleItem: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF8F8',
  },
  roleIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleTextBox: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  currentBadge: {
    backgroundColor: Colors.halalGreenLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.halalGreenDark,
  },
  roleSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  pinSection: {
    backgroundColor: '#F9F8F6',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  pinLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  pinInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pinInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  pinInputError: {
    borderColor: Colors.error,
  },
  submitPinBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  submitPinText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  demoFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  demoPills: {
    flexDirection: 'row',
    gap: 6,
  },
  demoPill: {
    backgroundColor: '#EFEFEF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  demoPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
