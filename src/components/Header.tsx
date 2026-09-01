import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useCartStore } from '@/store/useCartStore';
import { useTableStore } from '@/store/useTableStore';
import { useRoleStore } from '@/store/useRoleStore';
import * as Haptics from 'expo-haptics';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  onSearchPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = false }) => {
  const router = useRouter();
  const itemCount = useCartStore((state) => state.getItemCount());
  const currentTable = useTableStore((state) => state.currentTable);
  const { currentRole } = useRoleStore();

  const handleRoleSwitch = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    useRoleStore.setState({ isPinModalOpen: true });
  };

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'kds':
        return 'Kitchen';
      case 'pos':
        return 'POS';
      case 'owner':
        return 'Owner';
      default:
        return 'Staff';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.brandContainer}
            onPress={() => router.push('/(tabs)' as any)}
          >
            <Image
              source={require('../../assets/images/hasan_logo.jpg')}
              style={styles.brandLogo}
              resizeMode="cover"
            />
            <View style={styles.brandTextCol}>
              <Text style={styles.brandTitle}>Hasan's Flavors</Text>
              <View style={styles.halalSubrow}>
                <View style={styles.greenDot} />
                <Text style={styles.brandSubtitle}>100% Halal Certified</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {title && showBack && (
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      )}

      <View style={styles.rightSection}>
        {/* Dine-In Table Badge */}
        {currentTable && (
          <TouchableOpacity
            style={showBack ? styles.tableBadgeCompact : styles.tableBadge}
            onPress={() => router.push('/qr-scan' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="restaurant" size={showBack ? 11 : 13} color={Colors.primary} />
            <Text style={showBack ? styles.tableBadgeCompactText : styles.tableBadgeText}>{currentTable}</Text>
          </TouchableOpacity>
        )}

        {/* Staff Mode Access Button (Only on Main screens, not cluttering back subpages) */}
        {!showBack && (
          <TouchableOpacity
            style={[styles.staffBtn, currentRole !== 'customer' && styles.staffBtnActive]}
            onPress={handleRoleSwitch}
            activeOpacity={0.8}
          >
            <Ionicons
              name="grid-outline"
              size={13}
              color={currentRole !== 'customer' ? Colors.textLight : Colors.primary}
            />
            <Text
              style={[
                styles.staffBtnText,
                currentRole !== 'customer' && styles.staffBtnTextActive,
              ]}
              numberOfLines={1}
            >
              {currentRole !== 'customer' ? getRoleBadge() : 'Staff Mode'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Customer Cart Icon */}
        {currentRole === 'customer' && (
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push('/(tabs)/cart' as any)}
            activeOpacity={0.8}
            hitSlop={6}
          >
            <Ionicons name="cart-outline" size={22} color={Colors.text} />
            {itemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadows.subtle,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '55%',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 38,
    height: 38,
    borderRadius: Radius.round,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  halalSubrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.halalGreen,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.halalGreen,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: Spacing.xs,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E5',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.round,
    gap: 4,
  },
  tableBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.saffronDark,
  },
  tableBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E5',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.round,
    gap: 3,
  },
  tableBadgeCompactText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.saffronDark,
  },
  staffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD4D4',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.round,
    gap: 4,
  },
  staffBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  staffBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  staffBtnTextActive: {
    color: Colors.textLight,
  },
  cartButton: {
    position: 'relative',
    padding: 6,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.primary,
    borderRadius: Radius.round,
    minWidth: 17,
    height: 17,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.card,
  },
  badgeText: {
    color: Colors.textLight,
    fontSize: 9,
    fontWeight: '900',
  },
  iconButton: {
    padding: 6,
  },
});
