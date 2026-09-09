import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface ScanTableModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ScanTableModal: React.FC<ScanTableModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous scanning laser line animation
      const scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      scanLoop.start();

      return () => scanLoop.stop();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      scanLineAnim.setValue(0);
    }
  }, [visible]);

  const handleOpenScanner = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onClose();
    router.push('/qr-scan' as any);
  };

  const handleSkip = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    onClose();
  };

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 96],
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        {/* Background dismissible touch area */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleSkip}
        />

        <Animated.View
          style={[
            styles.modalCard,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Top Close Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleSkip}
            hitSlop={12}
          >
            <Ionicons name="close" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Icon Badge */}
          <View style={styles.badgeRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="restaurant" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.badgeText}>Dine-In Reminder</Text>
          </View>

          {/* Interactive QR Frame with Scanning Laser */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.scannerBox}
            onPress={handleOpenScanner}
          >
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />

            <Ionicons name="qr-code-outline" size={82} color={Colors.primary} />

            {/* Animated Laser Beam */}
            <Animated.View
              style={[
                styles.laserBeam,
                {
                  transform: [{ translateY: scanLineTranslateY }],
                },
              ]}
            />
          </TouchableOpacity>

          {/* Title & Copy */}
          <Text style={styles.title}>Scan QR to Seat & Order</Text>
          <Text style={styles.description}>
            Please scan the QR code located on your table standee to link your table for instant service and live kitchen updates.
          </Text>

          {/* Primary Action: Open Scanner */}
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.88}
            onPress={handleOpenScanner}
          >
            <Ionicons name="camera-outline" size={19} color={Colors.textLight} />
            <Text style={styles.primaryBtnText}>Scan Table QR Code</Text>
          </TouchableOpacity>

          {/* Secondary Action: Skip */}
          <TouchableOpacity
            style={styles.skipBtn}
            activeOpacity={0.8}
            onPress={handleSkip}
          >
            <Text style={styles.skipBtnText}>Skip & Browse Menu</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 28, 28, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: Math.min(width * 0.9, 360),
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    ...Shadows.floating,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.round,
    gap: 6,
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  scannerBox: {
    width: 140,
    height: 140,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceCream,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  cornerTL: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 18,
    height: 18,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.primary,
  },
  cornerTR: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.primary,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 18,
    height: 18,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.primary,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 18,
    height: 18,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.primary,
  },
  laserBeam: {
    position: 'absolute',
    top: 18,
    left: 12,
    right: 12,
    height: 2.5,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  description: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.md,
    gap: 8,
    ...Shadows.subtle,
  },
  primaryBtnText: {
    color: Colors.textLight,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: '700',
  },
  skipBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  skipBtnText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    fontWeight: '600',
  },
});
