import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

export default function SplashScreen() {
    const router = useRouter();

    // Shared values for staggered animations
    const logoScale = useSharedValue(0.92);
    const logoOpacity = useSharedValue(0);
    const contentOpacity = useSharedValue(0);
    const loaderWidth = useSharedValue(0);

    const navigateNext = () => {
        router.replace('/(tabs)' as any);
    };

    useEffect(() => {
        // Logo fade in & gentle zoom
        logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
        logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.1)) });

        // Content fade in
        contentOpacity.value = withDelay(
            300,
            withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
        );

        // Progress bar fills over 2 seconds
        loaderWidth.value = withTiming(
            1,
            { duration: 2000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
            (finished) => {
                if (finished) {
                    // Navigate to onboarding or tabs
                }
            }
        );

        // Auto navigate after ~2.3 seconds
        const timer = setTimeout(() => {
            navigateNext();
        }, 2300);

        return () => clearTimeout(timer);
    }, []);

    const animatedLogoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }],
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
    }));

    const animatedLoaderStyle = useAnimatedStyle(() => ({
        width: `${loaderWidth.value * 100}%`,
    }));

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} translucent />

            {/* Center Content */}
            <View style={styles.centerSection}>
                <Animated.View style={[styles.logoCard, animatedLogoStyle]}>
                    <Image
                        source={require('../../assets/images/logo.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </Animated.View>

                <Animated.View style={[styles.titleContainer, animatedContentStyle]}>
                    <Text style={styles.brandTitle}>Hasan's Flavors</Text>
                    <Text style={styles.brandSubtitle}>Authentic Halal Cuisine</Text>
                </Animated.View>
            </View>

            {/* Footer Loader */}
            <View style={styles.footerSection}>
                <View style={styles.progressTrack}>
                    <Animated.View style={[styles.progressFill, animatedLoaderStyle]} />
                </View>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={navigateNext}
                    activeOpacity={0.7}
                >
                    <Text style={styles.skipText}>Tap to continue</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.xxxl,
        paddingHorizontal: Spacing.xl,
    },
    centerSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    logoCard: {
        width: 220,
        height: 140,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    titleContainer: {
        alignItems: 'center',
    },
    brandTitle: {
        fontSize: Typography.fontSize.xxl,
        fontWeight: '800',
        fontFamily: Typography.fontFamily.extraBold,
        color: Colors.text,
        letterSpacing: -0.4,
    },
    brandSubtitle: {
        fontSize: Typography.fontSize.xs,
        fontWeight: '600',
        fontFamily: Typography.fontFamily.medium,
        color: Colors.textSecondary,
        marginTop: 4,
        letterSpacing: 0.2,
    },
    footerSection: {
        width: '100%',
        alignItems: 'center',
        gap: Spacing.md,
    },
    progressTrack: {
        width: 120,
        height: 3,
        backgroundColor: Colors.border,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    skipButton: {
        paddingVertical: Spacing.xs,
    },
    skipText: {
        fontSize: 11,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.textMuted,
    },
});
