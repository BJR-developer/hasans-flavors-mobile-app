import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface Slide {
    id: string;
    tag: string;
    title: string;
    description: string;
    imageUrl: string;
}

const ONBOARDING_SLIDES: Slide[] = [
    {
        id: '1',
        tag: 'HERITAGE RECIPES',
        title: 'Authentic Royal Flavors',
        description:
            'Centuries-old recipes prepared with slow-cooked meats, aged fragrant basmati, and hand-ground spices.',
        imageUrl:
            'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '2',
        tag: 'DIGITAL ORDERING',
        title: 'Instant Table QR Service',
        description:
            'Scan your table QR code to browse our live menu, customize your spice level, and order directly.',
        imageUrl:
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '3',
        tag: 'SPICE CLUB',
        title: 'Earn Loyalty Points',
        description:
            'Track live kitchen preparation, collect reward points on every order, and unlock chef specials.',
        imageUrl:
            'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80',
    },
];

export default function OnboardingScreen() {
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
            } catch { }
        }
    };

    const handleNext = () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch { }

        if (currentIndex < ONBOARDING_SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            finishOnboarding('/auth/signin');
        }
    };

    const handleSkip = () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch { }
        finishOnboarding('/(tabs)');
    };

    const finishOnboarding = (targetRoute: string) => {
        completeOnboarding();
        router.replace(targetRoute as any);
    };

    const renderSlide = ({ item }: { item: Slide }) => {
        return (
            <View style={[styles.slideContainer, { width }]}>
                <View style={styles.imageCard}>
                    <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.slideImage}
                        resizeMode="cover"
                    />
                    <View style={styles.tagBadge}>
                        <Text style={styles.tagBadgeText}>{item.tag}</Text>
                    </View>
                </View>

                <View style={styles.textContent}>
                    <Text style={styles.slideTitle}>{item.title}</Text>
                    <Text style={styles.slideDescription}>{item.description}</Text>
                </View>
            </View>
        );
    };

    const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            {/* Top Bar */}
            <View style={styles.headerRow}>
                <View style={styles.brandRow}>
                    <Image
                        source={require('../../assets/images/hasan_logo.jpg')}
                        style={styles.headerLogo}
                        resizeMode="cover"
                    />
                    <Text style={styles.brandName}>Hasan's Flavors</Text>
                </View>

                {!isLastSlide ? (
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={handleSkip}
                        hitSlop={12}
                    >
                        <Text style={styles.skipButtonText}>Skip</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={() => finishOnboarding('/(tabs)')}
                        hitSlop={12}
                    >
                        <Text style={styles.skipButtonText}>Menu</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Carousel */}
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
            />

            {/* Bottom Controls */}
            <View style={styles.bottomSection}>
                {/* Dots */}
                <View style={styles.paginationRow}>
                    {ONBOARDING_SLIDES.map((_, index) => {
                        const isActive = index === currentIndex;
                        return (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    isActive ? styles.dotActive : styles.dotInactive,
                                ]}
                            />
                        );
                    })}
                </View>

                {/* Buttons */}
                <View style={styles.actionButtonContainer}>
                    {isLastSlide ? (
                        <View style={styles.finalButtonStack}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => finishOnboarding('/auth/signin')}
                                activeOpacity={0.88}
                            >
                                <Text style={styles.primaryButtonText}>Get Started</Text>
                                <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => finishOnboarding('/(tabs)')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.secondaryButtonText}>Continue as Guest</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.navRow}>
                            <TouchableOpacity
                                style={styles.guestLink}
                                onPress={() => finishOnboarding('/(tabs)')}
                            >
                                <Text style={styles.guestLinkText}>Browse Menu</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.nextButton}
                                onPress={handleNext}
                                activeOpacity={0.88}
                            >
                                <Text style={styles.nextButtonText}>Next</Text>
                                <Ionicons name="arrow-forward" size={15} color={Colors.textLight} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerLogo: {
        width: 28,
        height: 28,
        borderRadius: Radius.round,
    },
    brandName: {
        fontSize: Typography.fontSize.sm,
        fontWeight: '700',
        color: Colors.text,
    },
    skipButton: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
    },
    skipButtonText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    slideContainer: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageCard: {
        width: '100%',
        height: height * 0.38,
        borderRadius: Radius.lg,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: Colors.surface,
        ...Shadows.subtle,
    },
    slideImage: {
        width: '100%',
        height: '100%',
    },
    tagBadge: {
        position: 'absolute',
        top: Spacing.md,
        left: Spacing.md,
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Radius.xs,
    },
    tagBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textLight,
        letterSpacing: 0.6,
    },
    textContent: {
        marginTop: Spacing.xl,
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
    },
    slideTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'center',
        letterSpacing: -0.3,
        marginBottom: 6,
    },
    slideDescription: {
        fontSize: Typography.fontSize.xs,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: Spacing.sm,
    },
    bottomSection: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        gap: Spacing.lg,
    },
    paginationRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        height: 4,
        borderRadius: 2,
    },
    dotActive: {
        width: 20,
        backgroundColor: Colors.primary,
    },
    dotInactive: {
        width: 6,
        backgroundColor: Colors.border,
    },
    actionButtonContainer: {
        width: '100%',
    },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    guestLink: {
        paddingVertical: Spacing.md,
    },
    guestLinkText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: 10,
        borderRadius: Radius.md,
    },
    nextButtonText: {
        color: Colors.textLight,
        fontSize: Typography.fontSize.sm,
        fontWeight: '700',
    },
    finalButtonStack: {
        gap: Spacing.xs,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 13,
        borderRadius: Radius.md,
    },
    primaryButtonText: {
        color: Colors.textLight,
        fontSize: Typography.fontSize.sm,
        fontWeight: '700',
    },
    secondaryButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    secondaryButtonText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSize.xs,
        fontWeight: '600',
    },
});
