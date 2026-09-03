import { Radius, Spacing, Typography } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
    Dimensions,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function SplashScreenComponent() {
    const router = useRouter();
    const { isOnboarded, isAuthenticated, setHasSeenSplash } = useAuthStore();

    // Shared values
    const logoOpacity = useSharedValue(0);
    const contentOpacity = useSharedValue(0);
    const loaderWidth = useSharedValue(0);

    const navigateNext = () => {
        setHasSeenSplash(true);
        if (!isOnboarded) {
            router.replace('/onboarding' as any);
        } else if (!isAuthenticated) {
            router.replace('/auth/signin' as any);
        } else {
            router.replace('/(tabs)' as any);
        }
    };

    useEffect(() => {
        // Logo fade in
        logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });

        // Content fade in
        contentOpacity.value = withDelay(
            300,
            withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
        );

        // Progress bar loading fill
        loaderWidth.value = withDelay(
            300,
            withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }, (finished) => {
                if (finished) {
                    runOnJS(navigateNext)();
                }
            })
        );
    }, []);

    const animatedLogoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
    }));

    const animatedLoaderStyle = useAnimatedStyle(() => ({
        width: `${loaderWidth.value * 100}%`,
    }));

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#18181B" translucent />

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
        backgroundColor: '#18181B',
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
        width: 180,
        height: 120,
        backgroundColor: 'transparent',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
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
        fontWeight: '700',
        color: '#FAFAFA',
        letterSpacing: -0.4,
    },
    brandSubtitle: {
        fontSize: Typography.fontSize.xs,
        fontWeight: '500',
        color: '#A1A1AA',
        marginTop: 4,
        letterSpacing: 0.2,
    },
    footerSection: {
        width: '100%',
        alignItems: 'center',
        gap: Spacing.md,
    },
    progressTrack: {
        width: 100,
        height: 2,
        backgroundColor: '#27272A',
        borderRadius: 1,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FAFAFA',
        borderRadius: 1,
    },
    skipButton: {
        paddingVertical: Spacing.xs,
    },
    skipText: {
        fontSize: 11,
        color: '#71717A',
    },
});
