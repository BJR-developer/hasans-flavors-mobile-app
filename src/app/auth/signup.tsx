import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import {
  getPasswordRules,
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from '@/lib/validation';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
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

  const { signup, socialLogin, isLoading, isAuthenticated, user } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Field-level error messages
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
    general?: string;
  }>({});

  // Dynamic keyboard height tracking to ensure scrolling is never stuck
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const emailInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  // If already authenticated, redirect to role-based dashboard immediately
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'owner') router.replace('/staff/owner' as any);
      else if (user.role === 'staff') router.replace('/staff/pos' as any);
      else router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates?.height || 260);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const passwordRules = getPasswordRules(password);

  const handleNameChange = (val: string) => {
    setName(val);
    if (errors.name || errors.general) {
      setErrors((prev) => ({ ...prev, name: undefined, general: undefined }));
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (errors.email || errors.general) {
      setErrors((prev) => ({ ...prev, email: undefined, general: undefined }));
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (errors.phone || errors.general) {
      setErrors((prev) => ({ ...prev, phone: undefined, general: undefined }));
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (errors.password || errors.general) {
      setErrors((prev) => ({ ...prev, password: undefined, general: undefined }));
    }
    if (confirmPassword && errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (errors.confirmPassword || errors.general) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined, general: undefined }));
    }
  };

  const handleSignUp = async () => {
    const nextErrors: typeof errors = {};

    // 1. Validate full name
    const nameVal = validateFullName(name);
    if (!nameVal.isValid) {
      nextErrors.name = nameVal.error;
    }

    // 2. Validate email address format and presence
    const emailVal = validateEmail(email);
    if (!emailVal.isValid) {
      nextErrors.email = emailVal.error;
    }

    // 3. Validate phone number
    const phoneVal = validatePhone(phone);
    if (!phoneVal.isValid) {
      nextErrors.phone = phoneVal.error;
    }

    // 4. Validate password and enforce strength patterns
    const passVal = validatePassword(password);
    if (!passVal.isValid) {
      nextErrors.password = passVal.error;
    }

    // 5. Validate confirm password matches
    const confirmVal = validateConfirmPassword(password, confirmPassword);
    if (!confirmVal.isValid) {
      nextErrors.confirmPassword = confirmVal.error;
    }

    // 6. Validate terms agreement
    if (!agreeTerms) {
      nextErrors.terms = 'Please accept the Terms of Service to create an account.';
    }

    // Stop if any errors found
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}

      // Scroll to the first error area if needed
      if (nextErrors.name || nextErrors.email) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else if (nextErrors.phone || nextErrors.password) {
        scrollViewRef.current?.scrollTo({ y: 180, animated: true });
      } else {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
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
    } else {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      setErrors({
        general: res.message || 'Failed to create account. Please try again.',
      });
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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
          Join Hasan's Flavors to manage your orders with ease.
        </Text>
      </View>

      {/* General Error Banner */}
      {errors.general && (
        <View style={styles.generalErrorBanner}>
          <Ionicons name="alert-circle" size={18} color={Colors.error} />
          <Text style={styles.generalErrorText}>{errors.general}</Text>
        </View>
      )}

      {/* Input Form */}
      <View style={styles.formContainer}>
        {/* Full Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <View
            style={[
              styles.inputWrapper,
              errors.name ? styles.inputWrapperError : null,
            ]}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color={errors.name ? Colors.error : Colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={handleNameChange}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailInputRef.current?.focus()}
            />
          </View>
          {errors.name && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
              <Text style={styles.errorText}>{errors.name}</Text>
            </View>
          )}
        </View>

        {/* Email Address */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Email Address</Text>
          <View
            style={[
              styles.inputWrapper,
              errors.email ? styles.inputWrapperError : null,
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={18}
              color={errors.email ? Colors.error : Colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              ref={emailInputRef}
              style={styles.input}
              value={email}
              onChangeText={handleEmailChange}
              placeholder="Enter your email (e.g. name@example.com)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => phoneInputRef.current?.focus()}
            />
          </View>
          {errors.email && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
              <Text style={styles.errorText}>{errors.email}</Text>
            </View>
          )}
        </View>

        {/* Phone Number */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <View
            style={[
              styles.inputWrapper,
              errors.phone ? styles.inputWrapperError : null,
            ]}
          >
            <Ionicons
              name="call-outline"
              size={18}
              color={errors.phone ? Colors.error : Colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              ref={phoneInputRef}
              style={styles.input}
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="+63 9xx xxx xxxx"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
          </View>
          {errors.phone && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
              <Text style={styles.errorText}>{errors.phone}</Text>
            </View>
          )}
        </View>

        {/* Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View
            style={[
              styles.inputWrapper,
              errors.password ? styles.inputWrapperError : null,
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={errors.password ? Colors.error : Colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              ref={passwordInputRef}
              style={styles.input}
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="8+ characters with uppercase, number & symbol"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPassword}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({ y: 220, animated: true });
                }, 150);
              }}
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

          {/* Password pattern checklist badges */}
          <View style={styles.passwordRulesContainer}>
            <View style={styles.ruleBadge}>
              <Ionicons
                name={passwordRules.minLength ? 'checkmark-circle' : 'ellipse-outline'}
                size={13}
                color={passwordRules.minLength ? Colors.halalGreen : Colors.textMuted}
              />
              <Text
                style={[
                  styles.ruleText,
                  passwordRules.minLength && styles.ruleTextPassed,
                ]}
              >
                8+ chars
              </Text>
            </View>
            <View style={styles.ruleBadge}>
              <Ionicons
                name={passwordRules.hasUpper ? 'checkmark-circle' : 'ellipse-outline'}
                size={13}
                color={passwordRules.hasUpper ? Colors.halalGreen : Colors.textMuted}
              />
              <Text
                style={[
                  styles.ruleText,
                  passwordRules.hasUpper && styles.ruleTextPassed,
                ]}
              >
                Uppercase (A-Z)
              </Text>
            </View>
            <View style={styles.ruleBadge}>
              <Ionicons
                name={passwordRules.hasLower ? 'checkmark-circle' : 'ellipse-outline'}
                size={13}
                color={passwordRules.hasLower ? Colors.halalGreen : Colors.textMuted}
              />
              <Text
                style={[
                  styles.ruleText,
                  passwordRules.hasLower && styles.ruleTextPassed,
                ]}
              >
                Lowercase (a-z)
              </Text>
            </View>
            <View style={styles.ruleBadge}>
              <Ionicons
                name={passwordRules.hasNumber ? 'checkmark-circle' : 'ellipse-outline'}
                size={13}
                color={passwordRules.hasNumber ? Colors.halalGreen : Colors.textMuted}
              />
              <Text
                style={[
                  styles.ruleText,
                  passwordRules.hasNumber && styles.ruleTextPassed,
                ]}
              >
                Number (0-9)
              </Text>
            </View>
            <View style={styles.ruleBadge}>
              <Ionicons
                name={passwordRules.hasSpecial ? 'checkmark-circle' : 'ellipse-outline'}
                size={13}
                color={passwordRules.hasSpecial ? Colors.halalGreen : Colors.textMuted}
              />
              <Text
                style={[
                  styles.ruleText,
                  passwordRules.hasSpecial && styles.ruleTextPassed,
                ]}
              >
                Symbol (!@#$)
              </Text>
            </View>
          </View>

          {errors.password && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
              <Text style={styles.errorText}>{errors.password}</Text>
            </View>
          )}
        </View>

        {/* Confirm Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Confirm Password</Text>
          <View
            style={[
              styles.inputWrapper,
              errors.confirmPassword ? styles.inputWrapperError : null,
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={errors.confirmPassword ? Colors.error : Colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              ref={confirmPasswordInputRef}
              style={styles.input}
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              placeholder="Re-enter your password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 150);
              }}
            />
          </View>
          {errors.confirmPassword && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            </View>
          )}
        </View>

        {/* Terms Checkbox */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => {
            setAgreeTerms(!agreeTerms);
            if (errors.terms) {
              setErrors((prev) => ({ ...prev, terms: undefined }));
            }
          }}
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
        {errors.terms && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
            <Text style={styles.errorText}>{errors.terms}</Text>
          </View>
        )}

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

  if (isAuthenticated && user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Bar Navigation (Hidden on web) */}
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
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
              ref={scrollViewRef}
              style={styles.splitRightScroll}
              contentContainerStyle={[
                styles.splitRightScrollContent,
                { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 60 : Spacing.xxl },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
            >
              {renderFormContent()}
            </ScrollView>
          </View>
        ) : (
          /* =========================================================
             MOBILE SINGLE COLUMN LAYOUT
             ========================================================= */
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: keyboardHeight > 0 ? keyboardHeight + 70 : Spacing.xxxl,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            keyboardDismissMode="interactive"
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
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
    justifyContent: 'center',
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

  /* General Error Banner */
  generalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF2F2',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  generalErrorText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error,
    lineHeight: 16,
  },

  /* Form Container */
  formContainer: {
    gap: Spacing.md,
  },
  fieldGroup: {
    gap: 5,
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
  inputWrapperError: {
    borderColor: Colors.error,
    backgroundColor: '#FFFBFB',
    borderWidth: 1.5,
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
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
    paddingHorizontal: 2,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error,
  },

  /* Password Pattern Checklist */
  passwordRulesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  ruleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  ruleText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
  },
  ruleTextPassed: {
    color: Colors.halalGreen,
    fontWeight: '600',
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
