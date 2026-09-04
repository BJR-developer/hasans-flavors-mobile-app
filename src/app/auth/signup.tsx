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
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;
  const isWeb = Platform.OS === 'web';

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
    } catch {}
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
    } catch {}

    const res = await signup({
      name,
      email,
      phone,
      password,
    });

    if (res.success) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
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
    } catch {}

    const res = await socialLogin(provider);
    if (res.success) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      router.replace('/(tabs)' as any);
    }
  };

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
        <View style={styles.demoBannerLeft}>
          <Ionicons name="sparkles" size={14} color={Colors.saffron} />
          <Text style={styles.demoBannerText}>
            Autofill demo diner: <Text style={styles.demoBold}>Amina Sheikh</Text>
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={13} color={Colors.saffron} />
      </TouchableOpacity>

      {/* Input Form */}
      <View style={styles.formContainer}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
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
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
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
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
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
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
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
            <View style={styles.submitBtnInner}>
              <Text style={styles.submitButtonText}>Create Account</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
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
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Bar (Hidden on web; "Skip to menu" removed) */}
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
                  uri: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=85',
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
                    <Ionicons name="gift" size={13} color={Colors.saffronAccent} />
                    <Text style={styles.splitPillTagText}>MEMBER REWARDS</Text>
                  </View>

                  <Text style={styles.splitHeroTitle}>
                    Join the Hasan's Spice Club
                  </Text>
                  <Text style={styles.splitHeroSubtitle}>
                    Earn 100 bonus Spice Points on sign up. Unlock secret chef specials, priority table orders, and exclusive seasonal invitations.
                  </Text>

                  {/* Highlights row */}
                  <View style={styles.splitFeaturesRow}>
                    <View style={styles.splitFeatureBadge}>
                      <Ionicons name="sparkles" size={16} color={Colors.saffronAccent} />
                      <Text style={styles.splitFeatureText}>+100 Bonus Points</Text>
                    </View>
                    <View style={styles.splitFeatureBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.halalGreen} />
                      <Text style={styles.splitFeatureText}>100% Zabihah Halal</Text>
                    </View>
                    <View style={styles.splitFeatureBadge}>
                      <Ionicons name="flame" size={16} color={Colors.primary} />
                      <Text style={styles.splitFeatureText}>Heirloom Recipes</Text>
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
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
  },

  /* Split Layout (Tablet / Web) */
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
    backgroundColor: 'rgba(29, 21, 19, 0.74)',
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

  /* Brand Header */
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  brandHeaderSplit: {
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
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
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },

  /* Autofill Banner */
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.saffronLight,
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    marginBottom: Spacing.lg,
    ...Shadows.subtle,
  },
  demoBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  demoBannerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.saffronDark,
    fontFamily: Typography.fontFamily.medium,
  },
  demoBold: {
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
  },

  /* Form Container */
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  termsText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
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
  signinLink: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
});
