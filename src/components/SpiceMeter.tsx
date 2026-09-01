import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface SpiceMeterProps {
  level: number; // 1 to 4
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SpiceMeter: React.FC<SpiceMeterProps> = ({ level, showLabel = false, size = 'md' }) => {
  const labels = ['', 'Mild', 'Medium', 'Spicy', 'Extra Fiery'];
  const flames = ['', '🌶️', '🌶️🌶️', '🌶️🌶️🌶️', '🔥🌶️'];

  const fontSize = size === 'sm' ? 10 : size === 'lg' ? 14 : 12;

  return (
    <View style={styles.container}>
      <Text style={[styles.flames, { fontSize }]}>{flames[Math.min(4, Math.max(1, level))]}</Text>
      {showLabel && (
        <Text style={[styles.label, { fontSize: fontSize - 1 }]}>
          {labels[Math.min(4, Math.max(1, level))]}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flames: {
    letterSpacing: -1,
  },
  label: {
    color: Colors.saffronDark,
    fontWeight: '600',
  },
});
