import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Category } from '@/types';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface CategoryPillProps {
  category: Category;
  isSelected: boolean;
  onSelect: (categoryId: string) => void;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({ category, isSelected, onSelect }) => {
  const handlePress = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    onSelect(category.id);
  };

  const getEmoji = (icon: string) => {
    switch (icon) {
      case 'bowl-rice':
        return '🍚';
      case 'flame':
        return '🥘';
      case 'beef':
        return '🥩';
      case 'sandwich':
        return '🌯';
      case 'wheat':
        return '🫓';
      case 'users':
        return '👑';
      case 'cup-soda':
        return '🥤';
      default:
        return '🍽️';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.pill, isSelected && styles.selectedPill]}
      onPress={handlePress}
    >
      <Text style={styles.icon}>{getEmoji(category.icon)}</Text>
      <Text style={[styles.name, isSelected && styles.selectedName]}>{category.name}</Text>
      {category.count > 0 && (
        <View style={[styles.countBadge, isSelected && styles.selectedCountBadge]}>
          <Text style={[styles.countText, isSelected && styles.selectedCountText]}>
            {category.count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.round,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  selectedPill: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  icon: {
    fontSize: 14,
  },
  name: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedName: {
    color: Colors.textLight,
  },
  countBadge: {
    backgroundColor: '#F0EFEA',
    borderRadius: Radius.round,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  selectedCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  selectedCountText: {
    color: Colors.textLight,
  },
});
