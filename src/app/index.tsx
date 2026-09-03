import { useAuthStore } from '@/store/useAuthStore';
import { Redirect } from 'expo-router';

export default function Index() {
  const hasSeenSplash = useAuthStore((state) => state.hasSeenSplash);
  const isOnboarded = useAuthStore((state) => state.isOnboarded);

  if (!hasSeenSplash) {
    return <Redirect href="/splash" />;
  }

  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
