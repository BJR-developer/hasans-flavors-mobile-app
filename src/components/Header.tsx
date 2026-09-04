import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useCartStore } from '@/store/useCartStore';
import { useTableStore } from '@/store/useTableStore';
import { useAuthStore } from '@/store/useAuthStore';
import * as Haptics from 'expo-haptics';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showCart?: boolean;
  showScanTable?: boolean;
  onBackPress?: () => void;
  showSearch?: boolean;
  onSearchPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  showCart = false,
  showScanTable = true,
  onBackPress,
}) => {
  const router = useRouter();
  const itemCount = useCartStore((state) => state.getItemCount());
  const currentTable = useTableStore((state) => state.currentTable);
  const user = useAuthStore((state) => state.user);

  const handleBack = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (onBackPress) {
      onBackPress();
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/(tabs)' as any);
      }
    }
  };

  const handleProfilePress = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    router.push('/(tabs)/profile' as any);
  };

  return (
    <View style={styles.container}>
      {/* Left Section */}
      <View style={styles.leftSection}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleBack}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.profileContainer}
            onPress={handleProfilePress}
          >
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri:
                    user?.avatarUrl ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
                }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.profileTextCol}>
              <Text style={styles.greetingText} numberOfLines={1}>
                Hello, {user?.name ? user.name.split(' ')[0] : 'Diner'} 👋
              </Text>
              <Text style={styles.statusText} numberOfLines={1}>
                {currentTable ? `Table: ${currentTable}` : user?.tier || "Hasan's Flavors"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Centered Page Title */}
      {title ? (
        <View style={styles.centerTitleContainer} pointerEvents="none">
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
      ) : null}

      {/* Right Section */}
      <View style={styles.rightSection}>
        {/* Table Badge / Scan Table Button */}
        {showScanTable && (
          currentTable ? (
            <TouchableOpacity
              style={styles.tableBadge}
              onPress={() => router.push('/qr-scan' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="restaurant-outline" size={13} color={Colors.primary} />
              <Text style={styles.tableBadgeText}>{currentTable}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.qrBtn}
              onPress={() => router.push('/qr-scan' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.qrBtnText}>Scan Table</Text>
            </TouchableOpacity>
          )
        )}

        {/* Optional Cart Icon */}
        {showCart && (
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push('/(tabs)/cart' as any)}
            activeOpacity={0.8}
            hitSlop={6}
          >
            <Ionicons name="bag-outline" size={21} color={Colors.text} />
            {itemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Spacer to maintain balance if neither is shown */}
        {!showScanTable && !showCart && (
          <View style={styles.placeholderBox} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
    minWidth: 40,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: Radius.round,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileTextCol: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  statusText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
    marginTop: 2,
  },
  centerTitleContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 80,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
    minWidth: 40,
    justifyContent: 'flex-end',
  },
  placeholderBox: {
    width: 40,
    height: 40,
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
  qrBtn: {
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
  qrBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },
  cartButton: {
    position: 'relative',
    padding: 6,
    width: 40,
    height: 40,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.primary,
    borderRadius: Radius.round,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  badgeText: {
    color: Colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
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
});
