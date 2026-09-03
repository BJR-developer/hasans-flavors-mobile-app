import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useCartStore } from '@/store/useCartStore';
import { useTableStore } from '@/store/useTableStore';

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
              <Text style={styles.brandSubtitle}>Halal Cuisine</Text>
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
            <Ionicons name="restaurant-outline" size={13} color={Colors.textSecondary} />
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
          <Ionicons name="bag-outline" size={21} color={Colors.text} />
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '60%',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 34,
    height: 34,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: Spacing.xs,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    gap: 4,
  },
  tableBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    gap: 4,
  },
  qrBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  cartButton: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: Radius.round,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.textLight,
    fontSize: 9,
    fontWeight: '700',
  },
  iconButton: {
    padding: 4,
  },
});
