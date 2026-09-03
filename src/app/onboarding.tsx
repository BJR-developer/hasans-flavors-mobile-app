import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: string;
  line1: string;
  line2: string;
  line3: string;
  subtitle: string;
  imageUrl: string;
}

const ONBOARDING_SLIDES: Slide[] = [
  {
    id: '1',
    line1: 'Flavor',
    line2: 'Crafted',
    line3: 'With Love',
    subtitle: 'Explore mouthwatering cuisines from around the world and find your favorite dishes in seconds.',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: '2',
    line1: 'Authentic',
    line2: 'Dum Handi',
    line3: 'Royal Taste',
    subtitle: 'Centuries-old heirloom recipes prepared with slow-cooked meats, aged basmati, and hand-ground spices.',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: '3',
    line1: 'Instant Table',
    line2: 'QR Ordering',
    line3: 'Fresh To Plate',
    subtitle: 'Scan your table QR code to customize spice levels and order directly to your dining table.',
    imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=1200&q=85',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index !== currentIndex && index >= 0 && index < ONBOARDING_SLIDES.length) {
      setCurrentIndex(index);
      try {
        Haptics.selectionAsync();
      } catch {}
    }
  };

  const handleNext = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    } else {
      finishOnboarding('/auth/signin');
    }
  };

  const finishOnboarding = (targetRoute: string) => {
    completeOnboarding();
    router.push(targetRoute as any);
  };

  const renderSlide = ({ item }: { item: Slide }) => {
    return (
      <View style={[styles.slideContainer, { width }]}>
        {/* Top Text Section (Headline & Subtitle) */}
        <View
          style={[
            styles.headerSection,
            {
              paddingTop: insets.top > 0 ? insets.top + 16 : 36,
            },
          ]}
        >
          <View style={styles.titleGroup}>
            <Text style={styles.headlineText}>{item.line1}</Text>
            <Text style={styles.headlineText}>{item.line2}</Text>
            <Text style={styles.headlineText}>{item.line3}</Text>
          </View>

          <Text style={styles.subtitleText}>{item.subtitle}</Text>
        </View>

        {/* Full-bleed bottom-filling Image Section (extends all the way down to mobile edge) */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.fullBleedImage}
            resizeMode="cover"
          />

          {/* Smooth multi-stop gradient: subtle luminous white shimmer at top edge fading into rich deep dark overlay */}
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0)',
              'rgba(255, 255, 255, 0.28)',
              'rgba(0, 0, 0, 0.35)',
              'rgba(0, 0, 0, 0.72)',
              'rgba(0, 0, 0, 0.92)',
            ]}
            locations={[0, 0.18, 0.42, 0.75, 1]}
            style={styles.bottomOverlayGradient}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Horizontal Carousel with Smooth Slide Transition */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="center"
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Floating Bottom Action CTA Button sitting on top of the gradient */}
      <View
        style={[
          styles.bottomFloatingAction,
          {
            bottom: insets.bottom > 0 ? insets.bottom + 16 : 28,
            paddingHorizontal: Spacing.xl,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.getStartedButton}
          onPress={handleNext}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8583E', // Warm Vibrant Terracotta Coral
    position: 'relative',
  },
  slideContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'space-between',
  },
  headerSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  titleGroup: {
    gap: 0,
  },
  headlineText: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  subtitleText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: Spacing.sm,
    maxWidth: '92%',
  },
  imageSection: {
    flex: 1,
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1A1C1C',
  },
  fullBleedImage: {
    width: '100%',
    height: '100%',
  },
  bottomOverlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  bottomFloatingAction: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: Radius.round,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  getStartedText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -0.2,
  },
});
