import { Colors } from '@/constants/theme';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { useAuthStore } from '@/store/useAuthStore';
import { useMenuStore } from '@/store/useMenuStore';
import { useOrderStore } from '@/store/useOrderStore';
import { useTableStore } from '@/store/useTableStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';

SplashScreen.preventAutoHideAsync().catch(() => { });

// Global Web CSS injection to completely disable browser focus outlines on desktop inputs
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'hasan-global-web-inputs-reset';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      input, textarea, select, [contenteditable="true"] {
        outline: none !important;
        outline-width: 0 !important;
        outline-style: none !important;
        box-shadow: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      input:focus, textarea:focus, select:focus, [contenteditable="true"]:focus {
        outline: none !important;
        outline-width: 0 !important;
        outline-style: none !important;
        box-shadow: none !important;
      }
      input:focus-visible, textarea:focus-visible, select:focus-visible {
        outline: none !important;
        outline-width: 0 !important;
      }
    `;
    document.head.appendChild(style);
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [fontsLoaded, fontError]);

  // Initialize Auth session & bootstrap live menu, tables, favorites, and order stores from Supabase
  useEffect(() => {
    useAuthStore.getState().initializeAuth();
    useMenuStore.getState().fetchMenuData();
    useOrderStore.getState().fetchOrders();
    useTableStore.getState().fetchTables();
    useFavoritesStore.getState().loadFavorites();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="splash" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/signin" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/forgot-password" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen
          name="dish/[id]"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        <Stack.Screen name="checkout" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="track/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="chat" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen
          name="qr-scan"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        <Stack.Screen name="staff/owner" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="staff/pos" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="staff/kds" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
