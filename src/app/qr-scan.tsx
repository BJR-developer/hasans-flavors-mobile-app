import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTableStore } from '@/store/useTableStore';
import { useCartStore } from '@/store/useCartStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function QRTableScreen() {
  const router = useRouter();
  const { currentTable, setTable, clearTable, guestCount, updateGuestCount, tables } = useTableStore();
  const setDeliveryType = useCartStore((state) => state.setDeliveryType);

  const [selectedTableNum, setSelectedTableNum] = useState<string>(currentTable || 'Table 04');
  const [selectedGuests, setSelectedGuests] = useState<number>(guestCount || 2);
  const [isCustomGuest, setIsCustomGuest] = useState<boolean>(![1, 2, 4, 6, 8].includes(guestCount || 2));
  const [isCameraScanning, setIsCameraScanning] = useState<boolean>(false);

  const handleConfirmTable = (tableNumber: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setTable(tableNumber, selectedGuests);
    setDeliveryType('dine_in');
    router.replace('/(tabs)/menu' as any);
  };

  const handleSimulateScan = () => {
    setIsCameraScanning(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setTimeout(() => {
      setIsCameraScanning(false);
      handleConfirmTable(selectedTableNum);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Dine-In QR Ordering" showBack />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* QR Scanner Simulation Card */}
        <View style={styles.scannerCard}>
          <View style={styles.scannerViewport}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />

            <Ionicons
              name="qr-code"
              size={120}
              color={isCameraScanning ? Colors.primary : '#333333'}
            />

            {isCameraScanning && <View style={styles.scanningLaser} />}
          </View>

          <Text style={styles.scannerInstruction}>
            Point camera at the QR code standee on your restaurant dining table
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.scanActionBtn, isCameraScanning && styles.scanningActiveBtn]}
            onPress={handleSimulateScan}
            disabled={isCameraScanning}
          >
            <Ionicons
              name={isCameraScanning ? 'sync' : 'camera'}
              size={18}
              color={Colors.textLight}
            />
            <Text style={styles.scanActionBtnText}>
              {isCameraScanning ? 'Scanning Table QR...' : 'Scan Table QR Code'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Guest Count Selector */}
        <View style={styles.card}>
          <View style={styles.guestHeaderRow}>
            <Text style={styles.cardTitle}>Number of Guests</Text>
            <Text style={styles.activeGuestCountBadge}>
              👥 {selectedGuests} {selectedGuests === 1 ? 'Guest' : 'Guests'}
            </Text>
          </View>

          <View style={styles.guestSelectorRow}>
            {[1, 2, 4, 6, 8].map((num) => {
              const active = !isCustomGuest && selectedGuests === num;
              return (
                <TouchableOpacity
                  key={num}
                  style={[styles.guestPill, active && styles.guestPillActive]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setIsCustomGuest(false);
                    setSelectedGuests(num);
                    updateGuestCount(num);
                  }}
                >
                  <Text style={[styles.guestPillText, active && styles.guestPillTextActive]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.guestPill, isCustomGuest && styles.guestPillActive]}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                setIsCustomGuest(true);
              }}
            >
              <Text style={[styles.guestPillText, isCustomGuest && styles.guestPillTextActive]}>
                Custom
              </Text>
            </TouchableOpacity>
          </View>

          {/* Custom Guest Count Input & Stepper */}
          {isCustomGuest && (
            <View style={styles.customGuestContainer}>
              <Text style={styles.customGuestPrompt}>Type party size or use stepper:</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    if (selectedGuests > 1) {
                      const next = selectedGuests - 1;
                      setSelectedGuests(next);
                      updateGuestCount(next);
                    }
                  }}
                >
                  <Ionicons name="remove" size={20} color={Colors.text} />
                </TouchableOpacity>

                <TextInput
                  style={styles.customGuestInput}
                  value={selectedGuests.toString()}
                  onChangeText={(val) => {
                    const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
                    if (!isNaN(parsed) && parsed > 0) {
                      setSelectedGuests(Math.min(99, parsed));
                      updateGuestCount(Math.min(99, parsed));
                    } else if (val === '') {
                      setSelectedGuests(1);
                      updateGuestCount(1);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    const next = Math.min(99, selectedGuests + 1);
                    setSelectedGuests(next);
                    updateGuestCount(next);
                  }}
                >
                  <Ionicons name="add" size={20} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Manual Table Selector Grid */}
        <View style={styles.card}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.cardTitle}>Or Select Your Table Number</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendDotAvailable} />
              <Text style={styles.legendText}>Available</Text>
              <View style={styles.legendDotOccupied} />
              <Text style={styles.legendText}>Occupied</Text>
            </View>
          </View>

          <View style={styles.tableGrid}>
            {tables.map((t) => {
              const isSelected = selectedTableNum === t.tableNumber;
              const isOccupied = t.status === 'occupied' && currentTable !== t.tableNumber;

              return (
                <TouchableOpacity
                  key={t.tableNumber}
                  style={[
                    styles.tableGridItem,
                    isSelected && styles.tableGridItemSelected,
                    isOccupied && styles.tableGridItemOccupied,
                  ]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setSelectedTableNum(t.tableNumber);
                  }}
                >
                  <Ionicons
                    name="restaurant"
                    size={20}
                    color={
                      isSelected
                        ? Colors.primary
                        : isOccupied
                        ? Colors.textMuted
                        : Colors.halalGreen
                    }
                  />
                  <Text
                    style={[
                      styles.tableNumberLabel,
                      isSelected && styles.tableNumberLabelSelected,
                      isOccupied && styles.tableNumberLabelOccupied,
                    ]}
                  >
                    {t.tableNumber}
                  </Text>
                  <Text style={styles.tableStatusLabel}>
                    {isOccupied ? 'Occupied' : 'Open'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Active Seated Table Banner if already assigned */}
        {currentTable && (
          <View style={styles.currentActiveCard}>
            <View style={styles.currentActiveLeft}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.halalGreen} />
              <View>
                <Text style={styles.currentActiveTitle}>Currently Seated at {currentTable}</Text>
                <Text style={styles.currentActiveSub}>Party of {guestCount} guests</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.releaseBtn}
              onPress={() => {
                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                } catch {}
                clearTable();
              }}
            >
              <Text style={styles.releaseBtnText}>Leave Table</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Confirm Selection Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.confirmBtn}
          onPress={() => handleConfirmTable(selectedTableNum)}
        >
          <Text style={styles.confirmBtnText}>
            Confirm {selectedTableNum} & Open Menu
          </Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.textLight} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 90,
    gap: Spacing.md,
  },
  scannerCard: {
    backgroundColor: '#1E1B18',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.card,
  },
  scannerViewport: {
    width: 200,
    height: 200,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  cornerTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.primary,
  },
  cornerTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.primary,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.primary,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.primary,
  },
  scanningLaser: {
    position: 'absolute',
    top: '50%',
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  scannerInstruction: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  scanActionBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    gap: 8,
    ...Shadows.card,
  },
  scanningActiveBtn: {
    backgroundColor: '#B71C1C',
  },
  scanActionBtnText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontSize: Typography.fontSize.sm,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.subtle,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  guestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  activeGuestCountBadge: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
    color: Colors.primary,
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.round,
  },
  guestSelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  guestPill: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#FAF9F8',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestPillActive: {
    backgroundColor: '#FFEBEE',
    borderColor: Colors.primary,
  },
  guestPillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  guestPillTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  customGuestContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customGuestPrompt: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F4F0',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  customGuestInput: {
    width: 44,
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    paddingVertical: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotAvailable: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.halalGreen,
  },
  legendDotOccupied: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  tableGridItem: {
    width: '31%',
    backgroundColor: '#FAF9F8',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  tableGridItemSelected: {
    backgroundColor: '#FFF8F8',
    borderColor: Colors.primary,
  },
  tableGridItemOccupied: {
    backgroundColor: '#F5F5F5',
    borderColor: '#EEEEEE',
    opacity: 0.6,
  },
  tableNumberLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  tableNumberLabelSelected: {
    color: Colors.primary,
    fontWeight: '800',
  },
  tableNumberLabelOccupied: {
    color: Colors.textMuted,
  },
  tableStatusLabel: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  currentActiveCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentActiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentActiveTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    color: Colors.halalGreenDark,
  },
  currentActiveSub: {
    fontSize: 11,
    color: Colors.halalGreen,
    marginTop: 1,
  },
  releaseBtn: {
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  releaseBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.error,
  },
  footer: {
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.lg,
    gap: 8,
    ...Shadows.card,
  },
  confirmBtnText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontSize: Typography.fontSize.sm,
  },
});
