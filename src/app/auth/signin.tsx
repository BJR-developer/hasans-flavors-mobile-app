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
    const { login, quickLogin, socialLogin, isLoading } = useAuthStore();

    const [email, setEmail] = useState('customer@hasan.com');
    const [password, setPassword] = useState('spice1234');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    const handleRouteByRole = (role: 'customer' | 'staff' | 'owner') => {
        if (role === 'owner') {
            router.replace('/staff/owner' as any);
        } else if (role === 'staff') {
            router.replace('/staff/pos' as any);
        } else {
            router.replace('/(tabs)' as any);
        }
    };

    const handleSignIn = async () => {
        if (!email.trim()) {
            Alert.alert('Required Field', 'Please enter your email address.');
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
            handleRouteByRole(res.role);
        }
    };

    const handleQuickAccount = async (accountType: 'customer' | 'staff' | 'owner') => {
        try {
            Haptics.selectionAsync();
        } catch { }

        if (accountType === 'customer') {
            setEmail('customer@hasan.com');
        } else if (accountType === 'staff') {
            setEmail('staff@hasan.com');
        } else {
            setEmail('owner@hasan.com');
        }

        const res = await quickLogin(accountType);
        if (res.success) {
            try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch { }
            handleRouteByRole(res.role);
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
            handleRouteByRole(res.role);
        }
    };

    const handleForgotPassword = () => {
        Alert.alert(
            'Reset Password',
            'Password reset instructions have been sent to your registered email address.',
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
                            Select a demo profile or sign in with your credentials.
                        </Text>
                    </View>

                    {/* 3 Quick Role Switcher Buttons */}
                    <View style={styles.demoProfileSection}>
                        <Text style={styles.demoSectionLabel}>QUICK DEMO PROFILES (1-TAP LOGIN):</Text>
                        <View style={styles.demoButtonsRow}>
                            <TouchableOpacity
                                style={styles.demoRoleBtn}
                                onPress={() => handleQuickAccount('customer')}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="person-outline" size={16} color={Colors.primary} />
                                <View style={styles.demoRoleInfo}>
                                    <Text style={styles.demoRoleTitle}>Customer Account</Text>
                                    <Text style={styles.demoRoleSub}>customer@hasan.com</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.demoRoleBtn}
                                onPress={() => handleQuickAccount('staff')}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="calculator-outline" size={16} color={Colors.primary} />
                                <View style={styles.demoRoleInfo}>
                                    <Text style={styles.demoRoleTitle}>Staff (POS / KDS)</Text>
                                    <Text style={styles.demoRoleSub}>staff@hasan.com</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.demoRoleBtn}
                                onPress={() => handleQuickAccount('owner')}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="stats-chart-outline" size={16} color={Colors.halalGreen} />
                                <View style={styles.demoRoleInfo}>
                                    <Text style={styles.demoRoleTitle}>Owner Admin</Text>
                                    <Text style={styles.demoRoleSub}>owner@hasan.com</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Input Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter your email"
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
                                    color={rememberMe ? Colors.primary : Colors.textMuted}
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
        fontWeight: '600',
        color: Colors.primary,
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
        marginBottom: Spacing.md,
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
        marginBottom: Spacing.sm,
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
    demoProfileSection: {
        marginBottom: Spacing.lg,
    },
    demoSectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textMuted,
        letterSpacing: 0.6,
        marginBottom: Spacing.xs,
    },
    demoButtonsRow: {
        gap: 6,
    },
    demoRoleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        gap: 10,
        ...Shadows.subtle,
    },
    demoRoleInfo: {
        flex: 1,
    },
    demoRoleTitle: {
        fontSize: Typography.fontSize.xs,
        fontWeight: '700',
        color: Colors.text,
    },
    demoRoleSub: {
        fontSize: 10,
        color: Colors.textMuted,
    },
    formContainer: {
        gap: Spacing.md,
    },
    fieldGroup: {
        gap: 5,
    },
    fieldLabel: {
        fontSize: Typography.fontSize.xs,
        fontWeight: '600',
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
        color: Colors.primary,
        fontWeight: '600',
    },
    submitButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
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
        fontWeight: '700',
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
        fontWeight: '600',
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
        fontWeight: '700',
        color: Colors.primary,
    },
});
