import React, { useState, useEffect, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import {
  getPasswordRules,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
} from '@/lib/validation';

type Step = 'email' | 'otp' | 'new_password' | 'success';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;
  const isWeb = Platform.OS === 'web';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { isAuthenticated, user, sendPasswordResetEmail, verifyPasswordResetOtp, updateNewPassword } = useAuthStore();

  // If already authenticated, redirect away from auth screens
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'owner') router.replace('/staff/owner' as any);
      else if (user.role === 'staff') router.replace('/staff/pos' as any);
      else router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, user]);

  // Field errors
  const [errors, setErrors] = useState<{
    email?: string;
    otp?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  // Dynamic keyboard handling
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const otpInputsRef = useRef<(TextInput | null)[]>([]);

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

  // Countdown for OTP resend
  useEffect(() => {
    let interval: any;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const passwordRules = getPasswordRules(newPassword);

  // Step 1: Send OTP
  const handleSendCode = async () => {
    const emailVal = validateEmail(email);
    if (!emailVal.isValid) {
      setErrors({ email: emailVal.error });
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      return;
    }

    setErrors({});
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsLoading(true);
    const res = await sendPasswordResetEmail(email);
    setIsLoading(false);

    if (res.success) {
      setStep('otp');
      setTimer(60);
      setCanResend(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } else {
      setErrors({ email: res.message || 'Failed to send password reset email' });
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
  };

  // Step 2: Handle OTP Input
  const handleOtpChange = (val: string, index: number) => {
    const newArr = [...otp];
    newArr[index] = val;
    setOtp(newArr);

    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: undefined }));
    }

    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const fullCode = otp.join('');
    if (fullCode.length < 6) {
      setErrors({ otp: 'Please enter the complete 6-digit verification code.' });
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      return;
    }

    setErrors({});
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsLoading(true);
    const res = await verifyPasswordResetOtp(email, fullCode);
    setIsLoading(false);

    if (res.success) {
      setStep('new_password');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } else {
      setErrors({ otp: res.message || 'Invalid or expired verification code.' });
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    try {
      Haptics.selectionAsync();
    } catch {}
    setTimer(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    setErrors({});

    const res = await sendPasswordResetEmail(email);
    const msg = res.message || `A new 6-digit code has been sent to ${email}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`Code Sent: ${msg}`);
    } else {
      Alert.alert('Code Sent', msg);
    }
  };

  // Step 3: Set New Password
  const handleUpdatePassword = async () => {
    const nextErrors: typeof errors = {};

    const passVal = validatePassword(newPassword);
    if (!passVal.isValid) {
      nextErrors.newPassword = passVal.error;
    }

    const confirmVal = validateConfirmPassword(newPassword, confirmPassword);
    if (!confirmVal.isValid) {
      nextErrors.confirmPassword = confirmVal.error;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      return;
    }

    setErrors({});
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsLoading(true);
    const res = await updateNewPassword(newPassword);
    setIsLoading(false);

    if (res.success) {
      setStep('success');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } else {
      setErrors({ newPassword: res.message || 'Failed to update password.' });
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
  };

  // Step Indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorRow}>
      <View style={[styles.stepDot, styles.stepDotActive]}>
        <Text style={styles.stepDotNum}>1</Text>
      </View>
      <View
        style={[
          styles.stepLine,
          (step === 'otp' || step === 'new_password' || step === 'success') &&
            styles.stepLineActive,
        ]}
      />
      <View
        style={[
          styles.stepDot,
          (step === 'otp' || step === 'new_password' || step === 'success') &&
            styles.stepDotActive,
        ]}
      >
        <Text
          style={[
            styles.stepDotNum,
            (step === 'otp' || step === 'new_password' || step === 'success') &&
              styles.stepDotNumActive,
          ]}
        >
          2
        </Text>
      </View>
      <View
        style={[
          styles.stepLine,
          (step === 'new_password' || step === 'success') && styles.stepLineActive,
        ]}
      />
      <View
        style={[
          styles.stepDot,
          (step === 'new_password' || step === 'success') && styles.stepDotActive,
        ]}
      >
        <Text
          style={[
            styles.stepDotNum,
            (step === 'new_password' || step === 'success') && styles.stepDotNumActive,
          ]}
        >
          3
        </Text>
      </View>
    </View>
  );

  // Form Body based on current step
  const renderForm = () => {
    if (step === 'email') {
      return (
        <View style={styles.formContainer}>
          <View style={styles.iconCircleHeader}>
            <Ionicons name="mail-unread-outline" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.screenTitle}>Forgot Password</Text>
          <Text style={styles.screenSubtitle}>
            Enter the email address associated with your account and we'll send you a 6-digit verification code.
          </Text>

          {renderStepIndicator()}

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
                style={styles.input}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="name@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSendCode}
              />
            </View>
            {errors.email && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{errors.email}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSendCode}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.textLight} size="small" />
            ) : (
              <View style={styles.submitBtnInner}>
                <Text style={styles.submitButtonText}>Send Code</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToLoginRow}
            onPress={() => router.replace('/auth/signin' as any)}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={14} color={Colors.textSecondary} />
            <Text style={styles.backToLoginText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 'otp') {
      return (
        <View style={styles.formContainer}>
          <View style={styles.iconCircleHeader}>
            <Ionicons name="shield-checkmark-outline" size={28} color={Colors.saffron} />
          </View>
          <Text style={styles.screenTitle}>Enter 6-Digit Code</Text>
          <Text style={styles.screenSubtitle}>
            We've sent a code to <Text style={styles.highlightText}>{email}</Text>. Please check your inbox.
          </Text>

          {renderStepIndicator()}

          {/* 6-box OTP input */}
          <View style={styles.otpBoxesRow}>
            {otp.map((digit, idx) => (
              <View
                key={idx}
                style={[
                  styles.otpBoxWrapper,
                  digit.length > 0 && styles.otpBoxWrapperFilled,
                  errors.otp && styles.otpBoxWrapperError,
                ]}
              >
                <TextInput
                  ref={(ref) => {
                    otpInputsRef.current[idx] = ref;
                  }}
                  style={styles.otpBoxInput}
                  value={digit}
                  onChangeText={(val) => handleOtpChange(val, idx)}
                  onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  autoFocus={idx === 0}
                  selectTextOnFocus
                />
              </View>
            ))}
          </View>

          {errors.otp && (
            <View style={[styles.errorRow, { justifyContent: 'center', marginBottom: Spacing.xs }]}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
              <Text style={styles.errorText}>{errors.otp}</Text>
            </View>
          )}

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResendCode}>
                <Text style={styles.resendLink}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>Resend in {timer}s</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleVerifyOtp}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.textLight} size="small" />
            ) : (
              <View style={styles.submitBtnInner}>
                <Text style={styles.submitButtonText}>Verify &amp; Continue</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToLoginRow}
            onPress={() => setStep('email')}
            hitSlop={8}
          >
            <Ionicons name="pencil-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.backToLoginText}>Change Email Address</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 'new_password') {
      return (
        <View style={styles.formContainer}>
          <View style={styles.iconCircleHeader}>
            <Ionicons name="key-outline" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.screenTitle}>Create New Password</Text>
          <Text style={styles.screenSubtitle}>
            Your new password must be at least 8 characters and include uppercase, lowercase, numbers, and symbols.
          </Text>

          {renderStepIndicator()}

          {/* New Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>New Password</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.newPassword ? styles.inputWrapperError : null,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={errors.newPassword ? Colors.error : Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={(val) => {
                  setNewPassword(val);
                  if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: undefined }));
                }}
                placeholder="8+ characters"
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

            {/* Pattern Badges */}
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
                  Uppercase
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
                  Lowercase
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
                  Number
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
                  Symbol
                </Text>
              </View>
            </View>

            {errors.newPassword && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Confirm New Password</Text>
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
                style={styles.input}
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                placeholder="Re-enter password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
              />
            </View>
            {errors.confirmPassword && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleUpdatePassword}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.textLight} size="small" />
            ) : (
              <View style={styles.submitBtnInner}>
                <Text style={styles.submitButtonText}>Update Password</Text>
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.textLight} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    // Step === 'success'
    return (
      <View style={[styles.formContainer, styles.successContainer]}>
        <View style={styles.successIconWrapper}>
          <Ionicons name="checkmark" size={40} color={Colors.halalGreen} />
        </View>

        <Text style={styles.screenTitle}>Password Updated!</Text>
        <Text style={styles.screenSubtitle}>
          Your password has been successfully reset. You can now sign in with your new credentials.
        </Text>

        <TouchableOpacity
          style={[styles.submitButton, { width: '100%', marginTop: Spacing.lg }]}
          onPress={() => router.replace('/auth/signin' as any)}
          activeOpacity={0.88}
        >
          <View style={styles.submitBtnInner}>
            <Text style={styles.submitButtonText}>Sign In Now</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
          /* Responsive Split View */
          <View style={styles.splitMasterContainer}>
            <View style={styles.splitLeftHero}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=1200&q=85',
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
                    <Ionicons name="lock-closed" size={13} color={Colors.saffronAccent} />
                    <Text style={styles.splitPillTagText}>ACCOUNT SECURITY</Text>
                  </View>

                  <Text style={styles.splitHeroTitle}>Reset &amp; Restore Your Access</Text>
                  <Text style={styles.splitHeroSubtitle}>
                    Follow the simple verification steps to regain access to your Hasan's Flavors account, rewards, and order history.
                  </Text>

                  <View style={styles.splitFeaturesRow}>
                    <View style={styles.splitFeatureBadge}>
                      <Ionicons name="shield-checkmark" size={16} color={Colors.halalGreen} />
                      <Text style={styles.splitFeatureText}>Encrypted &amp; Secure</Text>
                    </View>
                    <View style={styles.splitFeatureBadge}>
                      <Ionicons name="flash" size={16} color={Colors.saffronAccent} />
                      <Text style={styles.splitFeatureText}>Instant OTP Delivery</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

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
              <View style={styles.formInner}>{renderForm()}</View>
            </ScrollView>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: keyboardHeight > 0 ? keyboardHeight + 60 : Spacing.xxxl,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            keyboardDismissMode="interactive"
          >
            <View style={styles.formInner}>{renderForm()}</View>
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
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

  /* Split Layout */
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
    backgroundColor: 'rgba(29, 21, 19, 0.76)',
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

  /* Mobile Scroll */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    justifyContent: 'center',
  },
  formInner: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },

  /* Form Elements */
  formContainer: {
    gap: Spacing.md,
  },
  iconCircleHeader: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  screenTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  highlightText: {
    color: Colors.primary,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
  },

  /* Step Indicator */
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepDotNum: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textMuted,
  },
  stepDotNumActive: {
    color: Colors.textLight,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },

  /* Inputs */
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

  /* OTP Boxes */
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: Spacing.md,
  },
  otpBoxWrapper: {
    width: 48,
    height: 54,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.subtle,
  },
  otpBoxWrapperFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  otpBoxWrapperError: {
    borderColor: Colors.error,
    backgroundColor: '#FFFBFB',
  },
  otpBoxInput: {
    width: '100%',
    height: '100%',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
        } as any)
      : {}),
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  resendText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  resendLink: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: '700',
    color: Colors.primary,
  },
  timerText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
  },

  /* Submit Buttons */
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    height: 48,
    marginTop: Spacing.sm,
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
  backToLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.md,
  },
  backToLoginText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },

  /* Success View */
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  successIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.halalGreenLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
});
