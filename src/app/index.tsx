import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { Redirect } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function Index() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isOnboarded = useAuthStore((state) => state.isOnboarded);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // Wait for AsyncStorage and auth session checks to complete before routing
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // 1. First time user: show onboarding (one-time only)
  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  // 2. User is authenticated: direct to their role dashboard
  if (isAuthenticated && user) {
    if (user.role === 'owner') {
      return <Redirect href="/staff/owner" />;
    }
    if (user.role === 'staff') {
      return <Redirect href="/staff/pos" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  // 3. User is onboarded but not authenticated (including on app refresh): show sign-in
  return <Redirect href="/auth/signin" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

