import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
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

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.pill, isSelected && styles.selectedPill]}
      onPress={handlePress}
    >
      <Text style={[styles.name, isSelected && styles.selectedName]}>{category.name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 9,
    borderRadius: Radius.round,
    marginRight: Spacing.sm,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedPill: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  name: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  selectedName: {
    color: Colors.textLight,
    fontWeight: '700',
  },
});
