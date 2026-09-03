import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTableStore } from '@/store/useTableStore';
import { useCartStore } from '@/store/useCartStore';
import * as Haptics from 'expo-haptics';

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
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Header title="Table Ordering" showBack />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* QR Scanner Card */}
        <View style={styles.scannerCard}>
          <View style={styles.scannerViewport}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />

            <Ionicons
              name="qr-code-outline"
              size={90}
              color={Colors.primary}
            />
          </View>

          <Text style={styles.scannerInstruction}>
            Scan the QR code located on your table standee
          </Text>

          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.scanActionBtn}
            onPress={handleSimulateScan}
            disabled={isCameraScanning}
          >
            <Ionicons
              name={isCameraScanning ? 'sync-outline' : 'camera-outline'}
              size={18}
              color={Colors.textLight}
            />
            <Text style={styles.scanActionBtnText}>
              {isCameraScanning ? 'Scanning QR...' : 'Scan Table QR'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Guest Count Selector */}
        <View style={styles.card}>
          <View style={styles.guestHeaderRow}>
            <Text style={styles.cardTitle}>Number of Guests</Text>
            <Text style={styles.activeGuestCountBadge}>
              {selectedGuests} {selectedGuests === 1 ? 'Guest' : 'Guests'}
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

          {/* Custom Guest Count Stepper */}
          {isCustomGuest && (
            <View style={styles.customGuestContainer}>
              <Text style={styles.customGuestPrompt}>Custom Party Size:</Text>
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
                  <Ionicons name="remove" size={18} color={Colors.text} />
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
                  <Ionicons name="add" size={18} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Table Selector Grid */}
        <View style={styles.card}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.cardTitle}>Or Select Table</Text>
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
                    name="restaurant-outline"
                    size={18}
                    color={
                      isSelected
                        ? Colors.primary
                        : isOccupied
                        ? Colors.textMuted
                        : Colors.textSecondary
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

        {/* Active Seated Table Banner */}
        {currentTable && (
          <View style={styles.currentActiveCard}>
            <View style={styles.currentActiveLeft}>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.halalGreen} />
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
              <Text style={styles.releaseBtnText}>Release</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Docked Confirm Selection Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.confirmBtn}
          onPress={() => handleConfirmTable(selectedTableNum)}
        >
          <Text style={styles.confirmBtnText}>
            Confirm {selectedTableNum}
          </Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
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
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  scannerCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  scannerViewport: {
    width: 170,
    height: 170,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: Spacing.md,
  },
  cornerTL: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: Colors.primary,
  },
  cornerTR: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.primary,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: Colors.primary,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.primary,
  },
  scannerInstruction: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  scanActionBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.md,
    gap: 8,
  },
  scanActionBtnText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.sm,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  cardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
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
    fontWeight: '700',
    color: Colors.primary,
  },
  guestSelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  guestPill: {
    flex: 1,
    paddingVertical: 9,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestPillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  guestPillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  guestPillTextActive: {
    color: Colors.primary,
    fontWeight: '700',
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
    fontWeight: '500',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  customGuestInput: {
    width: 36,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.halalGreen,
  },
  legendDotOccupied: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  tableGridItem: {
    width: '31%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 3,
  },
  tableGridItemSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  tableGridItemOccupied: {
    opacity: 0.45,
  },
  tableNumberLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.text,
  },
  tableNumberLabelSelected: {
    fontWeight: '700',
    color: Colors.primary,
  },
  tableNumberLabelOccupied: {
    color: Colors.textMuted,
  },
  tableStatusLabel: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  currentActiveCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currentActiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currentActiveTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  currentActiveSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  releaseBtn: {
    backgroundColor: Colors.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  releaseBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.error,
  },
  footer: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.md,
    gap: 8,
  },
  confirmBtnText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: Typography.fontSize.sm,
  },
});
