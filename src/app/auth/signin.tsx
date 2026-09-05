import React, { useState } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

export default function SignInScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;
  const isWeb = Platform.OS === 'web';

  const { login, quickLogin, socialLogin, isLoading } = useAuthStore();

  const [email, setEmail] = useState('customer@hasan.com');
  const [password, setPassword] = useState('Password123!');
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
    } catch {}

    const res = await login(email, password);
    if (res.success) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      handleRouteByRole(res.role);
    }
  };

  const handleQuickAccount = async (accountType: 'customer' | 'staff' | 'owner') => {
    try {
      Haptics.selectionAsync();
    } catch {}

    if (accountType === 'customer') {
      setEmail('customer@hasan.com');
      setPassword('Password123!');
    } else if (accountType === 'staff') {
      setEmail('cashier@hasan.com');
      setPassword('Password123!');
    } else {
      setEmail('owner@hasan.com');
      setPassword('Password123!');
    }

    const res = await quickLogin(accountType);
    if (res.success) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      handleRouteByRole(res.role);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    try {
      Haptics.selectionAsync();
    } catch {}

    const res = await socialLogin(provider);
    if (res.success) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      handleRouteByRole(res.role);
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password' as any);
  };

  // Shared Form & Login Elements
  const renderFormContent = () => (
    <View style={styles.formInner}>
      {/* Brand Header */}
      <View style={[styles.brandHeader, isTabletOrDesktop && styles.brandHeaderSplit]}>
        {!isTabletOrDesktop && (
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>
        )}
        <Text style={styles.welcomeTitle}>Welcome Back</Text>
        <Text style={styles.welcomeSubtitle}>
          Select a 1-tap demo profile or enter your credentials to continue.
        </Text>
      </View>

      {/* 3 Quick Role Switcher Buttons */}
      <View style={styles.demoProfileSection}>
        <View style={styles.demoLabelRow}>
          <Ionicons name="flash-outline" size={13} color={Colors.saffron} />
          <Text style={styles.demoSectionLabel}>QUICK ROLE SIGN IN (1-TAP ACCESS):</Text>
        </View>
        <View style={styles.demoButtonsRow}>
          <TouchableOpacity
            style={styles.demoRoleBtn}
            onPress={() => handleQuickAccount('customer')}
            activeOpacity={0.8}
          >
            <View style={[styles.demoRoleIconWrapper, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="person" size={15} color={Colors.primary} />
            </View>
            <View style={styles.demoRoleInfo}>
              <Text style={styles.demoRoleTitle}>Customer Account</Text>
              <Text style={styles.demoRoleSub}>customer@hasan.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoRoleBtn}
            onPress={() => handleQuickAccount('staff')}
            activeOpacity={0.8}
          >
            <View style={[styles.demoRoleIconWrapper, { backgroundColor: Colors.saffronLight }]}>
              <Ionicons name="receipt" size={15} color={Colors.saffron} />
            </View>
            <View style={styles.demoRoleInfo}>
              <Text style={styles.demoRoleTitle}>Cashier (POS / KDS)</Text>
              <Text style={styles.demoRoleSub}>cashier@hasan.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoRoleBtn}
            onPress={() => handleQuickAccount('owner')}
            activeOpacity={0.8}
          >
            <View style={[styles.demoRoleIconWrapper, { backgroundColor: Colors.halalGreenLight }]}>
              <Ionicons name="stats-chart" size={15} color={Colors.halalGreen} />
            </View>
            <View style={styles.demoRoleInfo}>
              <Text style={styles.demoRoleTitle}>Owner Admin</Text>
              <Text style={styles.demoRoleSub}>owner@hasan.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Form Inputs */}
      <View style={styles.formContainer}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
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
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
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
            <View style={styles.submitBtnInner}>
              <Text style={styles.submitButtonText}>Sign In</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
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
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Bar Navigation (Hidden on web; "Skip to menu" removed) */}
      {!isWeb && (
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isTabletOrDesktop ? (
          /* =========================================================
             RESPONSIVE SPLIT LAYOUT (TABLET / IPAD / DESKTOP WEB)
             ========================================================= */
          <View style={styles.splitMasterContainer}>
            {/* Left Showcase Banner */}
            <View style={styles.splitLeftHero}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85',
                }}
                style={styles.splitHeroImage}
                resizeMode="cover"
              />
              <View style={styles.splitHeroOverlay}>
                <View style={styles.splitHeroContent}>
                  <View style={styles.splitHeroLogoContainer}>
                    <Image
                      source={require('../../../assets/images/logo.png')}
                      style={styles.splitBrandLogo}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.splitPillTag}>
                    <Ionicons name="sparkles" size={13} color={Colors.saffronAccent} />
                    <Text style={styles.splitPillTagText}>AUTHENTIC FLAVORS</Text>
                  </View>

                  <Text style={styles.splitHeroTitle}>
                    Heritage Spices &amp; Saffron Infusions
                  </Text>
                  <Text style={styles.splitHeroSubtitle}>
                    Order directly from your table with 1-tap QR scanning, collect Spice Points, or explore our handcrafted chef selections.
                  </Text>

                  {/* Highlights row */}
                  <View style={styles.splitFeaturesRow}>
                    <View style={styles.splitFeatureBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.halalGreen} />
                      <Text style={styles.splitFeatureText}>100% Zabihah Halal</Text>
                    </View>
                    <View style={styles.splitFeatureBadge}>
                      <Ionicons name="flash" size={16} color={Colors.saffronAccent} />
                      <Text style={styles.splitFeatureText}>Instant QR Ordering</Text>
                    </View>
                    <View style={styles.splitFeatureBadge}>
                      <Ionicons name="heart" size={16} color={Colors.primary} />
                      <Text style={styles.splitFeatureText}>Slow Cooked Daily</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Right Form Column */}
            <ScrollView
              style={styles.splitRightScroll}
              contentContainerStyle={styles.splitRightScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderFormContent()}
            </ScrollView>
          </View>
        ) : (
          /* =========================================================
             MOBILE SINGLE COLUMN LAYOUT
             ========================================================= */
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderFormContent()}
          </ScrollView>
        )}
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.background,
    zIndex: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.subtle,
  },
  guestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guestPillText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    fontWeight: '600',
    color: Colors.primary,
  },

  /* Split Screen Layout (Tablet & Web) */
  splitMasterContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  splitLeftHero: {
    flex: 1.1,
    position: 'relative',
    backgroundColor: '#1E1917',
  },
  splitHeroImage: {
    width: '100%',
    height: '100%',
  },
  splitHeroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(29, 21, 19, 0.72)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  splitHeroContent: {
    maxWidth: 500,
  },
  splitHeroLogoContainer: {
    width: 170,
    height: 64,
    marginBottom: Spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    ...Shadows.card,
  },
  splitBrandLogo: {
    width: '100%',
    height: '100%',
  },
  splitPillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(252, 130, 12, 0.18)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: 'rgba(252, 130, 12, 0.35)',
    marginBottom: Spacing.md,
  },
  splitPillTagText: {
    color: '#FFB74D',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 0.8,
  },
  splitHeroTitle: {
    color: Colors.textLight,
    fontSize: Typography.fontSize.hero,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    lineHeight: 42,
    letterSpacing: -0.6,
    marginBottom: Spacing.md,
  },
  splitHeroSubtitle: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  splitFeaturesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  splitFeatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.round,
  },
  splitFeatureText: {
    color: Colors.textLight,
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: '600',
  },
  splitRightScroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  splitRightScrollContent: {
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.xxl,
    justifyContent: 'center',
    minHeight: '100%',
  },

  /* Mobile Single Column */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  formInner: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },

  /* Brand Header (Form) */
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  brandHeaderSplit: {
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 140,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  welcomeTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },

  /* Demo Profiles Section */
  demoProfileSection: {
    marginBottom: Spacing.lg,
  },
  demoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing.xs,
  },
  demoSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.saffron,
    letterSpacing: 0.6,
  },
  demoButtonsRow: {
    gap: 7,
  },
  demoRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    gap: 10,
    ...Shadows.subtle,
  },
  demoRoleIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: Radius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoRoleInfo: {
    flex: 1,
  },
  demoRoleTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  demoRoleSub: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
  },

  /* Form Fields */
  formContainer: {
    gap: Spacing.md,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    ...Shadows.subtle,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
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
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  forgotText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    height: 48,
    marginTop: Spacing.xs,
    ...Shadows.card,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: Colors.textLight,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
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
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
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
    borderRadius: Radius.lg,
    height: 46,
    ...Shadows.subtle,
  },
  socialButtonText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
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
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  signupLink: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
});
