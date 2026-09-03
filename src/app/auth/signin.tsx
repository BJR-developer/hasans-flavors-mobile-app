import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
    const router = useRouter();
    const { login, socialLogin, isLoading } = useAuthStore();

    const [email, setEmail] = useState('hasan.raza@example.com');
    const [password, setPassword] = useState('spice1234');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    const handleSignIn = async () => {
        if (!email.trim()) {
            Alert.alert('Required Field', 'Please enter your email address or phone number.');
            return;
        }

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch { }

        const res = await login(email, password);
        if (res.success) {
            try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch { }
            router.replace('/(tabs)' as any);
        }
    };

    const handleSocialSignIn = async (provider: 'google' | 'apple') => {
        try {
            Haptics.selectionAsync();
        } catch { }

        const res = await socialLogin(provider);
        if (res.success) {
            try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch { }
            router.replace('/(tabs)' as any);
        }
    };

    const handleFillDemo = () => {
        try {
            Haptics.selectionAsync();
        } catch { }
        setEmail('hasan.raza@example.com');
        setPassword('spice1234');
    };

    const handleForgotPassword = () => {
        Alert.alert(
            'Reset Password',
            'Password reset instructions have been sent to your registered email.',
            [{ text: 'OK' }]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Top Bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        hitSlop={12}
                    >
                        <Ionicons name="arrow-back" size={20} color={Colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.guestPill}
                        onPress={() => router.replace('/(tabs)' as any)}
                        hitSlop={10}
                    >
                        <Text style={styles.guestPillText}>Skip to Menu</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Brand Header */}
                    <View style={styles.brandHeader}>
                        <View style={styles.logoBadgeWrapper}>
                            <Image
                                source={require('../../../assets/images/hasan_logo.jpg')}
                                style={styles.brandLogo}
                                resizeMode="cover"
                            />
                        </View>
                        <Text style={styles.welcomeTitle}>Sign In</Text>
                        <Text style={styles.welcomeSubtitle}>
                            Sign in to track orders, save favorites, and earn Spice Club points.
                        </Text>
                    </View>

                    {/* Demo Autofill Button */}
                    <TouchableOpacity
                        style={styles.demoBanner}
                        onPress={handleFillDemo}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.demoBannerText}>
                            Autofill demo: <Text style={styles.demoBold}>hasan.raza@example.com</Text>
                        </Text>
                    </TouchableOpacity>

                    {/* Input Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Email or Phone</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter your email or phone"
                                    placeholderTextColor={Colors.textMuted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Enter your password"
                                    placeholderTextColor={Colors.textMuted}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    hitSlop={8}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={18}
                                        color={Colors.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Options Row */}
                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={styles.rememberRow}
                                onPress={() => setRememberMe(!rememberMe)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={rememberMe ? 'checkbox' : 'square-outline'}
                                    size={18}
                                    color={rememberMe ? Colors.text : Colors.textMuted}
                                />
                                <Text style={styles.rememberText}>Remember me</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleForgotPassword} hitSlop={6}>
                                <Text style={styles.forgotText}>Forgot password?</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                            onPress={handleSignIn}
                            disabled={isLoading}
                            activeOpacity={0.88}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={Colors.textLight} size="small" />
                            ) : (
                                <Text style={styles.submitButtonText}>Sign In</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Social Auth Buttons */}
                    <View style={styles.socialRow}>
                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialSignIn('google')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="logo-google" size={18} color={Colors.text} />
                            <Text style={styles.socialButtonText}>Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialSignIn('apple')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="logo-apple" size={18} color={Colors.text} />
                            <Text style={styles.socialButtonText}>Apple</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footerRow}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/auth/signup' as any)}>
                            <Text style={styles.signupLink}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: Radius.round,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    guestPill: {
        backgroundColor: Colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Radius.round,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    guestPillText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xxxl,
    },
    brandHeader: {
        alignItems: 'center',
        marginTop: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    logoBadgeWrapper: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
        overflow: 'hidden',
    },
    brandLogo: {
        width: '100%',
        height: '100%',
    },
    welcomeTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: -0.3,
        marginBottom: 4,
    },
    welcomeSubtitle: {
        fontSize: Typography.fontSize.xs,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: Spacing.md,
    },
    demoBanner: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: Radius.md,
        marginBottom: Spacing.lg,
        alignItems: 'center',
    },
    demoBannerText: {
        fontSize: Typography.fontSize.xs,
        color: Colors.textSecondary,
    },
    demoBold: {
        fontWeight: '600',
        color: Colors.text,
    },
    formContainer: {
        gap: Spacing.md,
    },
    fieldGroup: {
        gap: 5,
    },
    fieldLabel: {
        fontSize: Typography.fontSize.xs,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
        height: 46,
    },
    input: {
        flex: 1,
        fontSize: Typography.fontSize.sm,
        color: Colors.text,
    },
    optionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 2,
    },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    rememberText: {
        fontSize: Typography.fontSize.xs,
        color: Colors.textSecondary,
    },
    forgotText: {
        fontSize: Typography.fontSize.xs,
        color: Colors.text,
        fontWeight: '500',
    },
    submitButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.text,
        borderRadius: Radius.md,
        height: 48,
        marginTop: Spacing.xs,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: Colors.textLight,
        fontSize: Typography.fontSize.sm,
        fontWeight: '600',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.lg,
        gap: 10,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
    },
    dividerText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    socialRow: {
        flexDirection: 'row',
        gap: 10,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        height: 44,
    },
    socialButtonText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: '500',
        color: Colors.text,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    footerText: {
        fontSize: Typography.fontSize.xs,
        color: Colors.textSecondary,
    },
    signupLink: {
        fontSize: Typography.fontSize.xs,
        fontWeight: '600',
        color: Colors.text,
    },
});
