import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/constants/theme';

interface SpiceMeterProps {
  level: number; // 1 to 4
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SpiceMeter: React.FC<SpiceMeterProps> = ({ level, showLabel = false, size = 'md' }) => {
  const labels = ['', 'Mild', 'Medium', 'Spicy', 'Fiery'];
  const activeLevel = Math.min(4, Math.max(1, level));

  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;

  return (
    <View style={styles.container}>
      <View style={styles.peppersRow}>
        {[1, 2, 3, 4].map((step) => {
          const isFilled = step <= activeLevel;
          return (
            <Ionicons
              key={step}
              name={isFilled ? 'flame' : 'flame-outline'}
              size={iconSize}
              color={isFilled ? Colors.primary : Colors.border}
            />
          );
        })}
      </View>
      {showLabel && (
        <Text style={[styles.label, size === 'sm' && styles.labelSm, size === 'lg' && styles.labelLg]}>
          {labels[activeLevel]}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  peppersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  labelSm: {
    fontSize: 10,
  },
  labelLg: {
    fontSize: Typography.fontSize.sm,
  },
});
