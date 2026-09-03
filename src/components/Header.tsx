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
  showSearch?: boolean;
  onSearchPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = false }) => {
  const router = useRouter();
  const itemCount = useCartStore((state) => state.getItemCount());
  const currentTable = useTableStore((state) => state.currentTable);
  const user = useAuthStore((state) => state.user);

  const handleProfilePress = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    router.push('/(tabs)/profile' as any);
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

      {title && showBack && (
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      )}

      <View style={styles.rightSection}>
        {/* Table Badge if seated */}
        {currentTable ? (
          <TouchableOpacity
            style={styles.tableBadge}
            onPress={() => router.push('/qr-scan' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="restaurant-outline" size={13} color={Colors.primary} />
            <Text style={styles.tableBadgeText}>{currentTable}</Text>
          </TouchableOpacity>
        ) : (
          !showBack && (
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

        {/* Cart Icon */}
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push('/(tabs)/cart' as any)}
          activeOpacity={0.8}
          hitSlop={6}
        >
          <Ionicons name="bag-outline" size={22} color={Colors.text} />
          {itemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
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
    paddingLeft: Spacing.md,
    paddingRight: Spacing.lg,
    backgroundColor: 'transparent',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarWrapper: {
    width: 42,
    height: 42,
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
    flexShrink: 1,
  },
  greetingText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
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
  },
  iconButton: {
    padding: 6,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
