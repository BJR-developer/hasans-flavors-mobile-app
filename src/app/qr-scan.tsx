import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Header } from '@/components/Header';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTableStore } from '@/store/useTableStore';
import { useCartStore } from '@/store/useCartStore';

export function parseTableFromQr(
  data: string,
  availableTables: Array<{ tableNumber: string }>
): string | null {
  if (!data || typeof data !== 'string') return null;
  const trimmed = data.trim();

  // 1. Check URL formats (e.g., https://domain.com/qr-scan?table=T-01 or mobileapp://qr-scan?table=T-01)
  try {
    if (trimmed.includes('?') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('://')) {
      const url = new URL(
        trimmed.startsWith('http')
          ? trimmed
          : ('https://dummy.internal/' + trimmed.split('://')[1])
      );
      const tableParam =
        url.searchParams.get('table') ||
        url.searchParams.get('t') ||
        url.searchParams.get('tableNumber');
      if (tableParam) {
        return decodeURIComponent(tableParam).trim();
      }
    }
  } catch {}

  // 2. Query string regex fallback
  const matchQuery = trimmed.match(/[?&](?:table|t|tableNumber)=([^&#]+)/i);
  if (matchQuery && matchQuery[1]) {
    return decodeURIComponent(matchQuery[1]).trim();
  }

  // 3. JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.table) return String(parsed.table).trim();
      if (parsed.tableNumber) return String(parsed.tableNumber).trim();
    } catch {}
  }

  // 4. Exact table number match
  const directMatch = availableTables.find(
    (t) => t.tableNumber.toLowerCase() === trimmed.toLowerCase()
  );
  if (directMatch) return directMatch.tableNumber;

  // 5. Normalized prefix (e.g., "Table 1" or "1" -> "T-01")
  const numMatch = trimmed.match(/(?:table|t)?[-_\s]*([0-9]{1,2})/i);
  if (numMatch && numMatch[1]) {
    const num = parseInt(numMatch[1], 10);
    const formatted = `T-${num.toString().padStart(2, '0')}`;
    const found = availableTables.find(
      (t) =>
        t.tableNumber.toLowerCase() === formatted.toLowerCase() ||
        t.tableNumber.toLowerCase() === `t-${num}` ||
        t.tableNumber.toLowerCase() === `table ${num}`
    );
    if (found) return found.tableNumber;
    return formatted;
  }

  return trimmed;
}

export default function QRTableScreen() {
  const router = useRouter();
  const { table: urlTableParam } = useLocalSearchParams<{ table?: string }>();
  const {
    currentTable,
    setTable,
    clearTable,
    guestCount,
    updateGuestCount,
    tables,
    fetchTables,
  } = useTableStore();
  const setDeliveryType = useCartStore((state) => state.setDeliveryType);

  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const [selectedTableNum, setSelectedTableNum] = useState<string>(
    currentTable || (tables[0]?.tableNumber || 'T-01')
  );
  const [selectedGuests, setSelectedGuests] = useState<number>(guestCount || 2);
  const [isCustomGuest, setIsCustomGuest] = useState<boolean>(
    ![1, 2, 4, 6, 8].includes(guestCount || 2)
  );

  // Real Camera States
  const [scanned, setScanned] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isFullScreenScanner, setIsFullScreenScanner] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedResult, setLastScannedResult] = useState<string | null>(null);

  // Laser scanning animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    scanLoop.start();
    return () => scanLoop.stop();
  }, [scanLineAnim]);

  // Request camera permissions on load if available
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  // Auto-connect table if URL parameter was provided from QR scan
  useEffect(() => {
    if (urlTableParam) {
      const decodedTable = decodeURIComponent(urlTableParam).trim();
      if (decodedTable) {
        setSelectedTableNum(decodedTable);
        setTable(decodedTable, guestCount || 2);
        setDeliveryType('dine_in');
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }
    }
  }, [urlTableParam]);

  const handleConfirmTable = (tableNumber: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setTable(tableNumber, selectedGuests);
    setDeliveryType('dine_in');
    router.replace('/(tabs)/menu' as any);
  };

  // Real Barcode Scanned Handler
  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    const rawData = result.data;
    if (!rawData) return;

    setScanned(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const detectedTable = parseTableFromQr(rawData, tables);

    if (detectedTable) {
      setLastScannedResult(detectedTable);
      setSelectedTableNum(detectedTable);
      setTable(detectedTable, selectedGuests);
      setDeliveryType('dine_in');

      if (isFullScreenScanner) {
        setIsFullScreenScanner(false);
      }

      setTimeout(() => {
        router.replace('/(tabs)/menu' as any);
      }, 700);
    } else {
      Alert.alert(
        'QR Code Scanned',
        `Scanned content: ${rawData}.\n\nPlease scan an official Hasan’s Flavors table QR code.`,
        [
          {
            text: 'Scan Again',
            onPress: () => {
              setScanned(false);
            },
          },
        ]
      );
    }
  };

  const laserTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 190],
  });

  const fullScreenLaserTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 250],
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Header title="Table Ordering" showBack />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Real QR Camera Scanner Card */}
        <View style={styles.scannerCard}>
          <View style={styles.scannerViewport}>
            {permission?.granted && !cameraError ? (
              <>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  enableTorch={torchEnabled}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                  onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                  onMountError={(e) => setCameraError(e.message)}
                />

                {/* Real-time laser scanning line */}
                <Animated.View
                  style={[
                    styles.scanLaser,
                    { transform: [{ translateY: laserTranslateY }] },
                  ]}
                />
              </>
            ) : !permission ? (
              <View style={styles.cameraCenterBox}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.cameraStatusText}>Loading Camera...</Text>
              </View>
            ) : !permission.granted ? (
              <View style={styles.cameraCenterBox}>
                <Ionicons name="camera-reverse-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.cameraStatusText}>Camera Permission Needed</Text>
                <TouchableOpacity
                  style={styles.permissionBtn}
                  onPress={requestPermission}
                >
                  <Text style={styles.permissionBtnText}>Allow Camera</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cameraCenterBox}>
                <Ionicons name="hardware-chip-outline" size={38} color={Colors.textMuted} />
                <Text style={styles.cameraStatusText}>Simulator Mode</Text>
                <Text style={styles.cameraSubStatusText}>Camera simulated in simulator</Text>
              </View>
            )}

            {/* Corner Viewfinder Brackets */}
            <View style={styles.cornerTL} pointerEvents="none" />
            <View style={styles.cornerTR} pointerEvents="none" />
            <View style={styles.cornerBL} pointerEvents="none" />
            <View style={styles.cornerBR} pointerEvents="none" />

            {/* Scanned Badge Notification */}
            {lastScannedResult && (
              <View style={styles.scannedSuccessBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.textLight} />
                <Text style={styles.scannedSuccessText}>Connected to {lastScannedResult}</Text>
              </View>
            )}
          </View>

          <Text style={styles.scannerInstruction}>
            Point your camera at the QR code standee on your table
          </Text>

          {/* Action Row: Torch & Fullscreen */}
          <View style={styles.scannerControlsRow}>
            {permission?.granted && !cameraError && (
              <TouchableOpacity
                style={[styles.controlIconBtn, torchEnabled && styles.controlIconBtnActive]}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setTorchEnabled((prev) => !prev);
                }}
              >
                <Ionicons
                  name={torchEnabled ? 'flash' : 'flash-outline'}
                  size={18}
                  color={torchEnabled ? Colors.saffron : Colors.text}
                />
                <Text style={styles.controlIconText}>
                  {torchEnabled ? 'Torch On' : 'Flash'}
                </Text>
              </TouchableOpacity>
            )}

            {permission?.granted && !cameraError && (
              <TouchableOpacity
                style={styles.controlIconBtn}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setIsFullScreenScanner(true);
                }}
              >
                <Ionicons name="scan-outline" size={18} color={Colors.text} />
                <Text style={styles.controlIconText}>Full View</Text>
              </TouchableOpacity>
            )}

            {scanned && (
              <TouchableOpacity
                style={styles.rescanBtn}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setScanned(false);
                  setLastScannedResult(null);
                }}
              >
                <Ionicons name="refresh-outline" size={15} color={Colors.primary} />
                <Text style={styles.rescanBtnText}>Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
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
                  <Text
                    style={[
                      styles.guestPillText,
                      active && styles.guestPillTextActive,
                    ]}
                  >
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
              <Text
                style={[
                  styles.guestPillText,
                  isCustomGuest && styles.guestPillTextActive,
                ]}
              >
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
            <Text style={styles.cardTitle}>Or Select Table Manually</Text>
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
              const isOccupied =
                t.status === 'occupied' && currentTable !== t.tableNumber;

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
                    {isOccupied ? 'Occupied' : `${t.capacity || t.guestCount || 4} Seats`}
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
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={Colors.halalGreen}
              />
              <View>
                <Text style={styles.currentActiveTitle}>
                  Currently Seated at {currentTable}
                </Text>
                <Text style={styles.currentActiveSub}>
                  Party of {guestCount} guests
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.releaseBtn}
              onPress={() => {
                try {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Warning
                  );
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

      {/* Full Screen Live Camera Scanner Modal */}
      <Modal
        visible={isFullScreenScanner}
        animationType="slide"
        onRequestClose={() => setIsFullScreenScanner(false)}
      >
        <SafeAreaView style={styles.fullScreenModal} edges={['top', 'bottom']}>
          {/* Top Bar */}
          <View style={styles.fullModalHeader}>
            <TouchableOpacity
              style={styles.fullModalCloseBtn}
              onPress={() => setIsFullScreenScanner(false)}
            >
              <Ionicons name="close" size={24} color={Colors.textLight} />
            </TouchableOpacity>

            <Text style={styles.fullModalTitle}>Scan Table Standee QR</Text>

            <TouchableOpacity
              style={styles.fullModalTorchBtn}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                setTorchEnabled((prev) => !prev);
              }}
            >
              <Ionicons
                name={torchEnabled ? 'flash' : 'flash-outline'}
                size={22}
                color={torchEnabled ? Colors.saffron : Colors.textLight}
              />
            </TouchableOpacity>
          </View>

          {/* Full Camera View with Cutout */}
          <View style={styles.fullCameraContainer}>
            {permission?.granted && !cameraError ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={torchEnabled}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              />
            ) : (
              <View style={styles.fullModalFallback}>
                <Ionicons name="camera-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.fullModalFallbackText}>Camera not available in simulator</Text>
              </View>
            )}

            {/* Viewfinder Cutout Box */}
            <View style={styles.fullViewfinderBox}>
              <View style={styles.cornerTL} pointerEvents="none" />
              <View style={styles.cornerTR} pointerEvents="none" />
              <View style={styles.cornerBL} pointerEvents="none" />
              <View style={styles.cornerBR} pointerEvents="none" />

              {/* Laser animation */}
              <Animated.View
                style={[
                  styles.scanLaser,
                  { transform: [{ translateY: fullScreenLaserTranslateY }] },
                ]}
              />
            </View>

            <Text style={styles.fullModalInstruction}>
              Align the QR code inside the box to connect your table automatically
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
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
    width: 220,
    height: 220,
    borderRadius: Radius.lg,
    backgroundColor: '#0F0E0D',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  cameraCenterBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: 8,
  },
  cameraStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cameraSubStatusText: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    marginTop: 4,
  },
  permissionBtnText: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '700',
  },
  scanLaser: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2.5,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    borderRadius: 2,
  },
  scannedSuccessBadge: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.halalGreen,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.round,
    gap: 5,
  },
  scannedSuccessText: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '700',
  },
  cornerTL: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.primary,
  },
  cornerTR: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.primary,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.primary,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.primary,
  },
  scannerInstruction: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  scannerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
    gap: 6,
  },
  controlIconBtnActive: {
    borderColor: Colors.saffron,
    backgroundColor: Colors.saffronLight,
  },
  controlIconText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    gap: 5,
  },
  rescanBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
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
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    zIndex: 10,
  },
  fullModalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullModalTitle: {
    color: Colors.textLight,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  fullModalTorchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullCameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullModalFallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#141210',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  fullModalFallbackText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.xs,
  },
  fullViewfinderBox: {
    width: 270,
    height: 270,
    borderRadius: Radius.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  fullModalInstruction: {
    position: 'absolute',
    bottom: 40,
    left: Spacing.xl,
    right: Spacing.xl,
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: Typography.fontSize.xs,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.round,
  },
});
