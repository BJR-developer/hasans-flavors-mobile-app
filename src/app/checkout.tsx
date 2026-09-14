import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useCartStore } from '@/store/useCartStore';
import { useOrderStore } from '@/store/useOrderStore';
import { useTableStore } from '@/store/useTableStore';
import { useAuthStore } from '@/store/useAuthStore';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

// INR Currency Multiplier: ₱ Total * 1.65 = ₹ INR
const INR_MULTIPLIER = 1.65;

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    items,
    deliveryType,
    setDeliveryType,
    promoCode,
    discountAmount,
    getSubtotal,
    getTax,
    getDeliveryFee,
    getServiceFee,
    getTotal,
    clearCart,
  } = useCartStore();

  const currentTable = useTableStore((state) => state.currentTable);
  const placeOrder = useOrderStore((state) => state.placeOrder);
  const cancelDraftOrder = useOrderStore((state) => state.cancelDraftOrder);
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.replace('/auth/signin' as any);
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Delivery & Payment States
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'gcash' | 'inr_qr'>('cash');
  const [inrUtrNumber, setInrUtrNumber] = useState('');
  const [gcashRefNumber, setGcashRefNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLandmark, setDeliveryLandmark] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showInrModal, setShowInrModal] = useState(false);
  const [razorpayQrData, setRazorpayQrData] = useState<{
    orderId: string;
    id: string;
    qrImageUrl: string;
    paymentUrl: string;
    amountInr: number;
  } | null>(null);
  const [inrPaymentSuccess, setInrPaymentSuccess] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('Verifying payment with PayMongo...');

  // Automated Razorpay INR QR Real-time listener & Fallback poller
  useEffect(() => {
    if (!showInrModal || !razorpayQrData || inrPaymentSuccess) return;

    const apiBase =
      process.env.EXPO_PUBLIC_API_URL ||
      'https://restaurant.aura-predictions.site';

    let isMounted = true;

    // 1. Supabase Realtime Listener for instant webhook update (<500ms)
    const channel = supabase
      .channel(`inr-pay-${razorpayQrData.orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${razorpayQrData.orderId}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.payment_status === 'paid' && isMounted) {
            triggerInrSuccess(razorpayQrData.orderId);
          }
        }
      )
      .subscribe();

    // 2. Active Poller every 2.5s (fallback API verification)
    const intervalId = setInterval(async () => {
      if (!isMounted) return;
      try {
        const vRes = await fetch(`${apiBase}/api/razorpay/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: razorpayQrData.orderId,
            paymentLinkId: razorpayQrData.id,
            qrCodeId: razorpayQrData.id,
          }),
        });
        const vData = await vRes.json();
        if (vData.paid && isMounted) {
          triggerInrSuccess(razorpayQrData.orderId);
        }
      } catch (err) {
        // Silently retry next poll
      }
    }, 2500);

    function triggerInrSuccess(orderId: string) {
      if (!isMounted) return;
      setInrPaymentSuccess(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setTimeout(() => {
        setShowInrModal(false);
        setRazorpayQrData(null);
        clearCart();
        router.replace(`/track/${orderId}` as any);
      }, 1200);
    }

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [showInrModal, razorpayQrData, inrPaymentSuccess, clearCart, router]);

  const subtotal = getSubtotal();
  const tax = getTax();
  const deliveryFee = getDeliveryFee();
  const serviceFee = getServiceFee();
  const grandTotal = getTotal();

  // Calculate INR equivalent: ₱ Total * 1.65
  const inrAmount = Math.round(grandTotal * INR_MULTIPLIER);
  // Dynamic UPI / INR QR code URL
  const inrQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `upi://pay?pa=hasansflavors@bank&pn=Hasans+Flavors&am=${inrAmount}&cu=INR&tn=OrderBill`
  )}`;

  if (items.length === 0) {
    return (
      <View style={styles.screenContainer}>
        <SafeAreaView style={styles.topSafeArea} edges={['top']}>
          <Header title="Checkout" showBack showCart={false} showScanTable={false} />
        </SafeAreaView>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ maxWidth: 400, width: '100%', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadows.subtle }}>
            <Ionicons name="bag-outline" size={44} color={Colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 8 }}>
              Your Cart is Empty
            </Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 20 }}>
              You don't have any items in your cart to checkout. Please browse our menu and add items to order.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: Radius.md, width: '100%', alignItems: 'center' }}
              onPress={() => router.replace('/(tabs)/menu' as any)}
            >
              <Text style={{ color: Colors.textLight, fontWeight: '700', fontSize: 13 }}>Browse Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.screenContainer}>
        <SafeAreaView style={styles.topSafeArea} edges={['top']}>
          <Header title="Checkout" showBack showCart={false} showScanTable={false} />
        </SafeAreaView>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ maxWidth: 400, width: '100%', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadows.subtle }}>
            <Ionicons name="lock-closed-outline" size={44} color={Colors.primary} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 8 }}>
              Sign In Required
            </Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 20 }}>
              Please sign in to your account to review items and complete checkout.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: Radius.md, width: '100%', alignItems: 'center' }}
              onPress={() => router.push('/auth/signin' as any)}
            >
              <Text style={{ color: Colors.textLight, fontWeight: '700', fontSize: 13 }}>Sign In to Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const handlePlaceOrder = async () => {
    if (items.length === 0 || isPlacingOrder || verifyingPayment) return;
    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      Alert.alert('Delivery Address Required', 'Please enter your complete delivery address to proceed.');
      return;
    }

    const isDraftOrder = paymentMethod === 'gcash' || paymentMethod === 'card' || paymentMethod === 'inr_qr';

    setIsPlacingOrder(true);
    try {
      const fullNotes = [
        specialInstructions.trim(),
        deliveryType === 'delivery' && deliveryLandmark ? `Landmark: ${deliveryLandmark}` : '',
        paymentMethod === 'gcash' && gcashRefNumber ? `GCash Ref: ${gcashRefNumber}` : '',
        paymentMethod === 'inr_qr' ? `Paid via Razorpay INR QR: ₹${inrAmount} (Rate: 1.65)` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      // 1. Create order in store and Supabase
      // If online payment (card/gcash/inr_qr), status is 'draft' so kitchen does NOT prepare it before payment
      const order = await placeOrder({
        type: deliveryType,
        items,
        customerId: user.id,
        customerName: user.name || 'Valued Diner',
        customerPhone: contactPhone || user.phone || undefined,
        deliveryAddress: deliveryType === 'delivery' ? deliveryAddress.trim() : undefined,
        tableNumber: deliveryType === 'dine_in' ? currentTable || 'Table 04' : undefined,
        paymentMethod: paymentMethod as any,
        status: isDraftOrder ? 'draft' : 'pending',
        paymentStatus: 'unpaid',
        subtotal,
        tax,
        serviceFee,
        deliveryFee,
        discount: discountAmount,
        total: grandTotal,
        specialNotes: fullNotes,
      });

      // 2. If online payment (GCash or Card): launch PayMongo and strictly verify before proceeding
      if (paymentMethod === 'gcash' || paymentMethod === 'card') {
        const apiBase =
          process.env.EXPO_PUBLIC_API_URL ||
          'https://restaurant.aura-predictions.site';

        let checkoutSessionId = '';
        let checkoutUrl = '';

        try {
          const res = await fetch(`${apiBase}/api/paymongo/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              orderNumber: order.orderNumber,
              amount: grandTotal,
              paymentMethod,
              items: items.map((i) => ({
                name: i.dish?.name || 'Food Item',
                price: i.unitPrice || i.dish?.price || 0,
                quantity: i.quantity,
              })),
              customerName: user.name || 'Valued Diner',
              customerEmail: user.email || 'customer@hasansflavors.com',
              customerPhone: contactPhone || user.phone || '',
            }),
          });

          const payData = await res.json();
          if (!res.ok || !payData.checkoutUrl) {
            throw new Error(payData.error || 'Failed to initialize payment gateway');
          }
          checkoutUrl = payData.checkoutUrl;
          checkoutSessionId = payData.checkoutSessionId;
        } catch (checkoutErr: any) {
          console.error('Checkout creation error:', checkoutErr);
          await cancelDraftOrder(order.id);
          setIsPlacingOrder(false);
          Alert.alert(
            'Payment Gateway Error',
            checkoutErr.message || 'Could not connect to payment gateway. Please try again or choose cash.'
          );
          return;
        }

        // Open PayMongo checkout window
        setIsPlacingOrder(false);
        setVerifyingPayment(true);
        setVerificationMessage('Opening secure PayMongo payment window...');

        try {
          await WebBrowser.openBrowserAsync(checkoutUrl);
        } catch (browserErr) {
          console.warn('Browser launch notice:', browserErr);
        }

        // User returned from browser - verify payment with backend
        setVerificationMessage('Verifying payment with PayMongo...');
        let isPaid = false;

        // Poll verification endpoint up to 4 times (1.5s interval)
        for (let attempt = 1; attempt <= 4; attempt++) {
          try {
            const verifyRes = await fetch(`${apiBase}/api/paymongo/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: order.id,
                checkoutSessionId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.paid) {
              isPaid = true;
              break;
            }
          } catch (vErr) {
            console.warn(`Verification attempt ${attempt} failed:`, vErr);
          }
          if (attempt < 4) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }

        setVerifyingPayment(false);

        if (isPaid) {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
          clearCart();
          router.replace(`/track/${order.id}` as any);
        } else {
          // PAYMENT WAS NOT MADE (cancelled, closed browser, or failed)
          // Clean up the draft order from Supabase so kitchen NEVER cooks an unpaid order!
          await cancelDraftOrder(order.id);
          // DO NOT CLEAR CART! Keep customer items intact
          Alert.alert(
            'Payment Not Completed',
            'We did not detect a completed payment from PayMongo. Your items are still in your cart so you can try again or choose another payment method.'
          );
        }
        return;
      }

      // 3. If INR Dynamic UPI QR (Razorpay):
      if (paymentMethod === 'inr_qr') {
        const apiBase =
          process.env.EXPO_PUBLIC_API_URL ||
          'https://restaurant.aura-predictions.site';

        try {
          const res = await fetch(`${apiBase}/api/razorpay/create-qr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              orderNumber: order.orderNumber,
              inrAmount,
              customerName: user.name || 'Valued Diner',
              customerEmail: user.email || undefined,
              customerPhone: contactPhone || user.phone || '',
            }),
          });

          const payData = await res.json();
          if (!res.ok || (!payData.qrImageUrl && !payData.paymentUrl)) {
            throw new Error(payData.error || 'Failed to initialize Razorpay QR');
          }

          setRazorpayQrData({
            orderId: order.id,
            id: payData.id,
            qrImageUrl: payData.qrImageUrl,
            paymentUrl: payData.paymentUrl,
            amountInr: payData.amountInr || inrAmount,
          });
          setInrPaymentSuccess(false);
          setIsPlacingOrder(false);
          setShowInrModal(true);
        } catch (qrErr: any) {
          console.error('Razorpay QR creation error:', qrErr);
          await cancelDraftOrder(order.id);
          setIsPlacingOrder(false);
          Alert.alert(
            'Payment Gateway Error',
            qrErr.message || 'Could not connect to Razorpay. Please try again or choose cash.'
          );
        }
        return;
      }

      // 4. For Cash:
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      clearCart();
      router.replace(`/track/${order.id}` as any);
    } catch (err: any) {
      console.error('Failed to place order:', err);
      setIsPlacingOrder(false);
      setVerifyingPayment(false);
      Alert.alert('Order Error', err.message || 'Could not place order. Please try again.');
    }
  };

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.topSafeArea} edges={['top']}>
        <Header title="Checkout" showBack showCart={false} showScanTable={true} />
      </SafeAreaView>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Dining Mode Selector: Dine-In, Takeout, or Delivery */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fulfillment Channel</Text>
          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[styles.typeButton, deliveryType === 'dine_in' && styles.activeTypeButton]}
              onPress={() => setDeliveryType('dine_in')}
            >
              <Ionicons
                name="restaurant-outline"
                size={16}
                color={deliveryType === 'dine_in' ? Colors.textLight : Colors.textSecondary}
              />
              <Text style={[styles.typeLabel, deliveryType === 'dine_in' && styles.activeTypeLabel]}>
                Dine In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, deliveryType === 'takeout' && styles.activeTypeButton]}
              onPress={() => setDeliveryType('takeout')}
            >
              <Ionicons
                name="bag-handle-outline"
                size={16}
                color={deliveryType === 'takeout' ? Colors.textLight : Colors.textSecondary}
              />
              <Text style={[styles.typeLabel, deliveryType === 'takeout' && styles.activeTypeLabel]}>
                Takeout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, deliveryType === 'delivery' && styles.activeTypeButton]}
              onPress={() => setDeliveryType('delivery')}
            >
              <Ionicons
                name="bicycle-outline"
                size={16}
                color={deliveryType === 'delivery' ? Colors.textLight : Colors.textSecondary}
              />
              <Text style={[styles.typeLabel, deliveryType === 'delivery' && styles.activeTypeLabel]}>
                Delivery
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.prepNoticeRow}>
            <Ionicons name="time-outline" size={15} color={Colors.primary} />
            <Text style={styles.prepNoticeText}>
              Standard preparation time: <Text style={{ fontWeight: '700', color: Colors.text }}>10 minutes</Text>
            </Text>
          </View>
        </View>

        {/* Delivery Details Card (Visible only when Delivery is chosen) */}
        {deliveryType === 'delivery' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Delivery Information</Text>
            <View style={{ gap: 8 }}>
              <TextInput
                style={styles.input}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="Complete street address / building & room number *"
                placeholderTextColor={Colors.textMuted}
              />
              <TextInput
                style={styles.input}
                value={deliveryLandmark}
                onChangeText={setDeliveryLandmark}
                placeholder="Nearby landmark (optional)"
                placeholderTextColor={Colors.textMuted}
              />
              <TextInput
                style={styles.input}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="Rider contact number *"
                keyboardType="phone-pad"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>
        )}

        {/* Payment Methods */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>

          <View style={{ gap: 8 }}>
            {/* 1. Cash */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.singlePaymentOption,
                paymentMethod === 'cash'
                  ? styles.paymentOptionActive
                  : styles.paymentOptionInactive,
              ]}
              onPress={() => setPaymentMethod('cash')}
            >
              <View style={styles.paymentLeft}>
                <View
                  style={
                    paymentMethod === 'cash'
                      ? styles.radioCircleActive
                      : styles.radioCircleInactive
                  }
                >
                  {paymentMethod === 'cash' && <View style={styles.radioDot} />}
                </View>
                <View style={styles.paymentTextCol}>
                  <Text
                    style={
                      paymentMethod === 'cash'
                        ? styles.paymentNameSelected
                        : styles.paymentNameUnselected
                    }
                  >
                    Cash (Pay at Counter)
                  </Text>
                  <Text style={styles.paymentNoticeBold}>
                    ⚠️ Please approach to counter to pay now.
                  </Text>
                </View>
              </View>

              <View style={styles.cashIconBadge}>
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color={paymentMethod === 'cash' ? Colors.primary : Colors.textMuted}
                />
              </View>
            </TouchableOpacity>

            {/* 2. Debit / Credit Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.singlePaymentOption,
                paymentMethod === 'card'
                  ? styles.paymentOptionActive
                  : styles.paymentOptionInactive,
              ]}
              onPress={() => setPaymentMethod('card')}
            >
              <View style={styles.paymentLeft}>
                <View
                  style={
                    paymentMethod === 'card'
                      ? styles.radioCircleActive
                      : styles.radioCircleInactive
                  }
                >
                  {paymentMethod === 'card' && <View style={styles.radioDot} />}
                </View>
                <View style={styles.paymentTextCol}>
                  <Text
                    style={
                      paymentMethod === 'card'
                        ? styles.paymentNameSelected
                        : styles.paymentNameUnselected
                    }
                  >
                    Debit / Credit Card
                  </Text>
                  <Text style={styles.paymentDesc}>Visa, Mastercard, or JCB</Text>
                </View>
              </View>

              <View style={styles.cashIconBadge}>
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={paymentMethod === 'card' ? Colors.primary : Colors.textMuted}
                />
              </View>
            </TouchableOpacity>

            {/* 3. GCash */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.singlePaymentOption,
                paymentMethod === 'gcash'
                  ? styles.paymentOptionActive
                  : styles.paymentOptionInactive,
              ]}
              onPress={() => setPaymentMethod('gcash')}
            >
              <View style={styles.paymentLeft}>
                <View
                  style={
                    paymentMethod === 'gcash'
                      ? styles.radioCircleActive
                      : styles.radioCircleInactive
                  }
                >
                  {paymentMethod === 'gcash' && <View style={styles.radioDot} />}
                </View>
                <View style={styles.paymentTextCol}>
                  <Text
                    style={
                      paymentMethod === 'gcash'
                        ? styles.paymentNameSelected
                        : styles.paymentNameUnselected
                    }
                  >
                    GCash
                  </Text>
                  <Text style={styles.paymentDesc}>Pay via GCash account</Text>
                </View>
              </View>

              <View style={styles.cashIconBadge}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color={paymentMethod === 'gcash' ? Colors.primary : Colors.textMuted}
                />
              </View>
            </TouchableOpacity>

            {/* 4. INR QR Code (* 1.65) */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.singlePaymentOption,
                paymentMethod === 'inr_qr'
                  ? styles.paymentOptionActive
                  : styles.paymentOptionInactive,
              ]}
              onPress={() => setPaymentMethod('inr_qr')}
            >
              <View style={styles.paymentLeft}>
                <View
                  style={
                    paymentMethod === 'inr_qr'
                      ? styles.radioCircleActive
                      : styles.radioCircleInactive
                  }
                >
                  {paymentMethod === 'inr_qr' && <View style={styles.radioDot} />}
                </View>
                <View style={styles.paymentTextCol}>
                  <Text
                    style={
                      paymentMethod === 'inr_qr'
                        ? styles.paymentNameSelected
                        : styles.paymentNameUnselected
                    }
                  >
                    INR Dynamic UPI QR (Razorpay)
                  </Text>
                  <Text style={styles.paymentDesc}>
                    Fixed Rate: ₱1 = ₹1.65 • Total: <Text style={{ fontWeight: '700', color: Colors.primary }}>₹{inrAmount.toLocaleString()} INR</Text>
                  </Text>
                  <Text style={styles.paymentNoticeBold}>
                    ⚡ Instant auto-detection via GPay, PhonePe, Paytm, or BHIM.
                  </Text>
                </View>
              </View>

              <View style={styles.cashIconBadge}>
                <Ionicons
                  name="qr-code-outline"
                  size={20}
                  color={paymentMethod === 'inr_qr' ? Colors.primary : Colors.textMuted}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Special Cooking / Dining Instructions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Special Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            placeholder="E.g. less oil, extra gravy on side..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Order Summary Breakdown with Dish Images */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary ({items.length} items)</Text>

          <View style={styles.itemsListContainer}>
            {items.map((it) => (
              <View key={it.cartItemId} style={styles.summaryItemRow}>
                <Image
                  source={{ uri: it.dish.imageUrl }}
                  style={styles.dishThumbnail}
                  resizeMode="cover"
                />

                <View style={styles.summaryItemInfo}>
                  <View style={styles.itemNameRow}>
                    <Text style={styles.itemQtyBadge}>{it.quantity}x</Text>
                    <Text style={styles.summaryItemName} numberOfLines={1}>
                      {it.dish.name}
                    </Text>
                  </View>
                  <Text style={styles.summaryItemPortion}>{it.portion.name}</Text>
                  {it.selectedAddons && it.selectedAddons.length > 0 ? (
                    <Text style={styles.summaryAddons} numberOfLines={1}>
                      + {it.selectedAddons.map((a) => a.name).join(', ')}
                    </Text>
                  ) : null}
                </View>

                <Text style={styles.summaryItemPrice}>₱{it.totalPrice.toLocaleString()}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Subtotal</Text>
            <Text style={styles.calcVal}>₱{subtotal.toLocaleString()}</Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Tax & VAT (5%)</Text>
            <Text style={styles.calcVal}>₱{tax.toLocaleString()}</Text>
          </View>

          {deliveryType === 'dine_in' && (
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Service Charge (5%)</Text>
              <Text style={styles.calcVal}>₱{serviceFee.toLocaleString()}</Text>
            </View>
          )}

          {deliveryType === 'delivery' && (
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Delivery Fee</Text>
              <Text style={styles.calcVal}>₱{deliveryFee.toLocaleString()}</Text>
            </View>
          )}

          {discountAmount > 0 && (
            <View style={styles.calcRow}>
              <Text style={styles.discountLabel}>Coupon ({promoCode})</Text>
              <Text style={styles.discountVal}>-₱{discountAmount.toLocaleString()}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.finalTotalRow}>
            <Text style={styles.finalTotalLabel}>Grand Total (PHP)</Text>
            <Text style={styles.finalTotalVal}>₱{grandTotal.toLocaleString()}</Text>
          </View>

          {paymentMethod === 'inr_qr' && (
            <View style={styles.inrConversionBanner}>
              <Text style={styles.inrConversionText}>INR Due (Rate: 1.65):</Text>
              <Text style={styles.inrConversionAmount}>₹{inrAmount.toLocaleString()}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* INR Live Automated QR Code Modal */}
      <Modal visible={showInrModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.inrModalBox}>
            {inrPaymentSuccess ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Ionicons name="checkmark-circle" size={60} color="#10B981" />
                <Text style={[styles.inrModalTitle, { marginTop: 12, fontSize: 16 }]}>
                  Payment Received!
                </Text>
                <Text style={[styles.inrModalSub, { textAlign: 'center', marginTop: 4 }]}>
                  ₹{(razorpayQrData?.amountInr || inrAmount).toLocaleString()} INR verified. Preparing your order...
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.inrModalTitle}>Scan to Pay in Indian Rupees (INR)</Text>
                <Text style={styles.inrModalSub}>
                  ₱{grandTotal.toLocaleString()} × 1.65 ={' '}
                  <Text style={{ fontWeight: '800', color: Colors.primary }}>
                    ₹{(razorpayQrData?.amountInr || inrAmount).toLocaleString()} INR
                  </Text>
                </Text>

                {razorpayQrData?.qrImageUrl ? (
                  <Image
                    source={{ uri: razorpayQrData.qrImageUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.qrImage, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                  </View>
                )}

                {/* Real-time verification pulsing status */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={{ fontSize: 12, color: Colors.textSecondary, fontWeight: '600' }}>
                    Waiting for UPI transfer...
                  </Text>
                </View>

                <Text style={styles.qrInstruction}>
                  Scan with GPay, PhonePe, Paytm, or BHIM UPI.{'\n'}
                  Auto-detected instantly once paid.
                </Text>

                {/* Direct link for same-phone payment */}
                {razorpayQrData?.paymentUrl ? (
                  <TouchableOpacity
                    style={{
                      backgroundColor: Colors.primary,
                      paddingVertical: 11,
                      paddingHorizontal: 16,
                      borderRadius: Radius.md,
                      marginTop: 14,
                      width: '100%',
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                    onPress={async () => {
                      try {
                        await WebBrowser.openBrowserAsync(razorpayQrData.paymentUrl);
                      } catch {
                        Linking.openURL(razorpayQrData.paymentUrl);
                      }
                    }}
                  >
                    <Ionicons name="open-outline" size={16} color={Colors.textLight} />
                    <Text style={{ color: Colors.textLight, fontWeight: '700', fontSize: 13 }}>
                      Pay via UPI App / Browser
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: Radius.md,
                    marginTop: 8,
                    width: '100%',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    Alert.alert(
                      'Cancel UPI Payment?',
                      'Your items will stay in your cart so you can try again anytime.',
                      [
                        { text: 'Keep Waiting', style: 'cancel' },
                        {
                          text: 'Cancel Payment',
                          style: 'destructive',
                          onPress: async () => {
                            if (razorpayQrData?.orderId) {
                              await cancelDraftOrder(razorpayQrData.orderId);
                            }
                            setShowInrModal(false);
                            setRazorpayQrData(null);
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Text style={{ color: Colors.textMuted, fontSize: 12, fontWeight: '600' }}>
                    Cancel & Return to Cart
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Verifying Payment Modal */}
      <Modal visible={verifyingPayment} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.verifyingModalBox}>
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.verifyingModalTitle}>Payment in Progress</Text>
            <Text style={styles.verifyingModalSub}>{verificationMessage}</Text>
            <Text style={styles.verifyingModalHint}>
              Complete your payment in PayMongo. We are securely waiting for payment confirmation from the gateway.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Docked Full-Width Flush Bottom Bar */}
      <View
        style={[
          styles.flushBottomBar,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 20 },
        ]}
      >
        <View style={styles.footerInner}>
          <View style={styles.footerPriceCol}>
            <Text style={styles.footerTotalLabel}>Total Amount</Text>
            <Text style={styles.footerTotalAmount}>₱{grandTotal.toLocaleString()}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            style={[styles.placeOrderBtn, isPlacingOrder && { opacity: 0.7 }]}
            onPress={handlePlaceOrder}
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? (
              <ActivityIndicator color={Colors.textLight} size="small" />
            ) : (
              <>
                <Text style={styles.placeOrderBtnText}>Place Order</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topSafeArea: {
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  cardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 10,
    gap: 6,
  },
  activeTypeButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeTypeLabel: {
    color: Colors.textLight,
    fontWeight: '700',
  },
  prepNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    padding: 8,
    borderRadius: Radius.sm,
    marginTop: 4,
  },
  prepNoticeText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  singlePaymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  paymentOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  paymentOptionInactive: {
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radioCircleActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleInactive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  paymentTextCol: {
    flex: 1,
  },
  paymentNameSelected: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  paymentNameUnselected: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text,
  },
  paymentNoticeBold: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: '#D97706',
    marginTop: 2,
  },
  paymentDesc: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  paymentSubBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  subBoxTitle: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  subBoxText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  cashIconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.round,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  itemsListContainer: {
    gap: 10,
    marginTop: 4,
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dishThumbnail: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  summaryItemInfo: {
    flex: 1,
    gap: 2,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemQtyBadge: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  summaryItemName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    flex: 1,
  },
  summaryItemPortion: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
  },
  summaryAddons: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  summaryItemPrice: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  calcLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  calcVal: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text,
  },
  discountLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  discountVal: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  finalTotalLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  finalTotalVal: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.primary,
  },
  inrConversionBanner: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  inrConversionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  inrConversionAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inrModalBox: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: 24,
    alignItems: 'center',
    maxWidth: 360,
    width: '100%',
  },
  inrModalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  inrModalSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
  },
  qrInstruction: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  closeModalBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Radius.md,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: 12,
  },
  flushBottomBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    paddingHorizontal: Spacing.lg,
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.lg,
  },
  footerPriceCol: {
    gap: 2,
  },
  footerTotalLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
  },
  footerTotalAmount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
  },
  placeOrderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: Radius.md,
  },
  placeOrderBtnText: {
    color: Colors.textLight,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
  },
  verifyingModalBox: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: 24,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  verifyingModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  verifyingModalSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  verifyingModalHint: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
