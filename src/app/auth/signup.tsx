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

export default function SignUpScreen() {
    const router = useRouter();
    const { signup, socialLogin, isLoading } = useAuthStore();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(true);

    const handleFillDemo = () => {
        try {
            Haptics.selectionAsync();
        } catch { }
        setName('Amina Sheikh');
        setEmail('amina.sheikh@example.com');
        setPhone('+63 917 555 7890');
        setPassword('secret123');
        setConfirmPassword('secret123');
    };

    const handleSignUp = async () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Please enter your full name.');
            return;
        }
        if (!email.trim()) {
            Alert.alert('Required', 'Please enter your email address.');
            return;
        }
        if (!phone.trim()) {
            Alert.alert('Required', 'Please enter your phone number.');
            return;
        }
        if (!password) {
            Alert.alert('Required', 'Please choose a password.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'The passwords you entered do not match.');
            return;
        }
        if (!agreeTerms) {
            Alert.alert('Terms', 'Please accept the Terms of Service to create your account.');
            return;
        }

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch { }

        const res = await signup({
            name,
            email,
            phone,
            password,
        });

        if (res.success) {
            try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch { }
            Alert.alert(
                'Welcome',
                'Your account has been created with 100 bonus Spice Points.',
                [
                    {
                        text: 'Continue',
                        onPress: () => router.replace('/(tabs)' as any),
                    },
                ]
            );
        }
    };

    const handleSocialSignUp = async (provider: 'google' | 'apple') => {
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
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../../assets/images/logo.png')}
                                style={styles.brandLogo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.welcomeTitle}>Create Account</Text>
                        <Text style={styles.welcomeSubtitle}>
                            Join Hasan's Spice Club to earn rewards and reorder with ease.
                        </Text>
                    </View>

                    {/* Autofill Demo */}
                    <TouchableOpacity
                        style={styles.demoBanner}
                        onPress={handleFillDemo}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.demoBannerText}>
                            Autofill demo: <Text style={styles.demoBold}>Amina Sheikh</Text>
                        </Text>
                    </TouchableOpacity>

                    {/* Input Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Full Name</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your full name"
                                    placeholderTextColor={Colors.textMuted}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

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
                            <Text style={styles.fieldLabel}>Phone Number</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="+63 9xx xxx xxxx"
                                    placeholderTextColor={Colors.textMuted}
                                    keyboardType="phone-pad"
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
                                    placeholder="At least 6 characters"
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

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Confirm Password</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Confirm your password"
                                    placeholderTextColor={Colors.textMuted}
                                    secureTextEntry={!showPassword}
                                />
                            </View>
                        </View>

                        {/* Terms Checkbox */}
                        <TouchableOpacity
                            style={styles.termsRow}
                            onPress={() => setAgreeTerms(!agreeTerms)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={agreeTerms ? 'checkbox' : 'square-outline'}
                                size={18}
                                color={agreeTerms ? Colors.primary : Colors.textMuted}
                            />
                            <Text style={styles.termsText}>
                                I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                                <Text style={styles.termsLink}>Privacy Policy</Text>
                            </Text>
                        </TouchableOpacity>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                            onPress={handleSignUp}
                            disabled={isLoading}
                            activeOpacity={0.88}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={Colors.textLight} size="small" />
                            ) : (
                                <Text style={styles.submitButtonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Social Auth */}
                    <View style={styles.socialRow}>
                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialSignUp('google')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="logo-google" size={18} color={Colors.text} />
                            <Text style={styles.socialButtonText}>Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialSignUp('apple')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="logo-apple" size={18} color={Colors.text} />
                            <Text style={styles.socialButtonText}>Apple</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footerRow}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/auth/signin' as any)}>
                            <Text style={styles.signinLink}>Sign In</Text>
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
    logoContainer: {
        width: 150,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
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
        marginBottom: Spacing.md,
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
    termsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginVertical: 2,
    },
    termsText: {
        fontSize: 12,
        color: Colors.textSecondary,
        flex: 1,
    },
    termsLink: {
        color: Colors.primary,
        fontWeight: '700',
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
    signinLink: {
        fontSize: Typography.fontSize.xs,
        fontWeight: '700',
        color: Colors.primary,
    },
});
