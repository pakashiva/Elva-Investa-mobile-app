import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OtpVisual from '../../components/auth/OtpVisual';
import OtpInput from '../../components/auth/OtpInput';
import PasswordInput from '../../components/auth/PasswordInput';
import {
  PASSWORD_REQUIREMENT_TEXT,
  VERIFY_MOBILE_DEFAULTS,
} from '../../data/verifyMobile';
import { useAuth } from '../../contexts/AuthContext';
import { useOtpCountdown } from '../../hooks/useOtpCountdown';
import {
  resendOtp,
  resetPasswordWithOtp,
  sendOtp,
  verifyOtp,
} from '../../services/otpService';
import { signInWithEmail, signOut } from '../../services/authService';
import {
  getProfileMobileNumber,
  markMobileVerified,
} from '../../services/profileService';
import { RootStackScreenProps } from '../../navigation/types';
import { OtpMode } from '../../types/otp';
import { maskMobileNumber } from '../../utils/phoneNumber';
import { authColors } from '../../theme/authColors';
import { colors, spacing } from '../../theme/colors';

const DEFAULT_EXPIRES_IN = 300;

type Props = RootStackScreenProps<'VerifyMobileNumber'>;

export default function VerifyMobileNumberScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { session, refreshMobileVerified } = useAuth();
  const mode: OtpMode = route.params?.mode ?? 'registration';
  const recoveryEmail = route.params?.email?.trim().toLowerCase() ?? '';
  const isRecovery = mode === 'recovery';

  const [otp, setOtp] = useState(VERIFY_MOBILE_DEFAULTS.otp);
  const [newPassword, setNewPassword] = useState(
    VERIFY_MOBILE_DEFAULTS.newPassword
  );
  const [confirmPassword, setConfirmPassword] = useState(
    VERIFY_MOBILE_DEFAULTS.confirmPassword
  );
  const [maskedMobile, setMaskedMobile] = useState('—');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [expiresIn, setExpiresIn] = useState(DEFAULT_EXPIRES_IN);
  const initialSendRef = useRef(false);

  const { formatted, canResend, isExpired, reset } = useOtpCountdown(expiresIn);

  const otpOptions = isRecovery
    ? { mode: 'recovery' as const, email: recoveryEmail }
    : { mode: 'registration' as const, userId: session?.user?.id };

  const loadMobileNumber = useCallback(async () => {
    if (isRecovery) {
      if (!recoveryEmail) {
        setErrorMessage('Registered email address is required.');
        return;
      }
      return;
    }

    const userId = session?.user?.id;
    if (!userId) {
      setErrorMessage('Please complete registration before verifying your mobile number.');
      return;
    }

    try {
      const mobileNumber = await getProfileMobileNumber(userId);
      if (!mobileNumber) {
        setErrorMessage('Registered mobile number not found.');
        return;
      }
      setMaskedMobile(maskMobileNumber(mobileNumber));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load mobile number.';
      setErrorMessage(message);
    }
  }, [isRecovery, recoveryEmail, session?.user?.id]);

  const handleSendOtp = useCallback(async () => {
    if (isRecovery && !recoveryEmail) {
      setErrorMessage('Registered email address is required.');
      return;
    }

    setIsSendingOtp(true);
    setErrorMessage(null);
    setOtpVerified(false);

    try {
      const response = await sendOtp(otpOptions);
      const nextExpiresIn = response.expiresIn ?? DEFAULT_EXPIRES_IN;
      setExpiresIn(nextExpiresIn);
      reset(nextExpiresIn);
      setStatusMessage(response.message);
      if (response.maskedPhone) {
        setMaskedMobile(response.maskedPhone);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to send OTP.';
      setErrorMessage(message);
    } finally {
      setIsSendingOtp(false);
    }
  }, [isRecovery, otpOptions, recoveryEmail, reset]);

  useEffect(() => {
    loadMobileNumber();
  }, [loadMobileNumber]);

  useEffect(() => {
    if (initialSendRef.current) {
      return;
    }

    if (isRecovery) {
      if (!recoveryEmail) {
        setErrorMessage('Registered email address is required.');
        return;
      }
    } else if (!session?.user?.id) {
      return;
    }

    initialSendRef.current = true;
    handleSendOtp();
  }, [handleSendOtp, isRecovery, recoveryEmail, session?.user?.id]);

  const handleResendOtp = async () => {
    if (!canResend || isResendingOtp || isSendingOtp) {
      return;
    }

    setIsResendingOtp(true);
    setErrorMessage(null);
    setOtpVerified(false);

    try {
      const response = await resendOtp(otpOptions);
      const nextExpiresIn = response.expiresIn ?? DEFAULT_EXPIRES_IN;
      setExpiresIn(nextExpiresIn);
      reset(nextExpiresIn);
      setOtp('');
      setStatusMessage(response.message);
      if (response.maskedPhone) {
        setMaskedMobile(response.maskedPhone);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to resend OTP.';
      setErrorMessage(message);
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (isVerifyingOtp) {
      return;
    }

    if (isExpired) {
      setErrorMessage('OTP has expired. Please resend OTP.');
      return;
    }

    const cleanedOtp = otp.replace(/\D/g, '');
    if (!/^\d{6}$/.test(cleanedOtp)) {
      setErrorMessage('Please enter the 6-digit OTP.');
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMessage(null);

    try {
      const response = await verifyOtp(cleanedOtp, otpOptions);

      if (isRecovery) {
        setOtpVerified(true);
        setStatusMessage(response.message);
        return;
      }

      await markMobileVerified();
      await refreshMobileVerified();
      setStatusMessage(response.message);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'OTP verification failed.';
      setErrorMessage(message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSetPasswordAndContinue = async () => {
    if (!isRecovery || isResettingPassword) {
      return;
    }

    if (!otpVerified) {
      setErrorMessage('Please verify the OTP before setting a new password.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    const cleanedOtp = otp.replace(/\D/g, '');
    if (!/^\d{6}$/.test(cleanedOtp)) {
      setErrorMessage('Please enter the 6-digit OTP.');
      return;
    }

    setIsResettingPassword(true);
    setErrorMessage(null);

    try {
      const response = await resetPasswordWithOtp(
        recoveryEmail,
        cleanedOtp,
        newPassword
      );
      await signInWithEmail(recoveryEmail, newPassword);
      setStatusMessage(response.message);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to reset password.';
      setErrorMessage(message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleBack = async () => {
    if (!isRecovery && session) {
      await signOut();
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'SignIn' }],
    });
  };

  const verifyDisabled =
    isVerifyingOtp ||
    isSendingOtp ||
    isExpired ||
    otp.replace(/\D/g, '').length !== 6;

  const passwordContinueDisabled =
    isResettingPassword ||
    !otpVerified ||
    !newPassword ||
    !confirmPassword;

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={handleBack}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Mobile Number</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.securityBanner}>
            <Ionicons
              name="shield-checkmark"
              size={18}
              color={colors.successText}
            />
            <Text style={styles.securityText}>
              SEBI & RBI compliant safe-encryption protocols are active.
            </Text>
          </View>

          <OtpVisual />

          <Text style={styles.sectionTitle}>OTP Verification</Text>
          <Text style={styles.instruction}>
            We have sent a 6-digit verification code to your registered mobile
            number{' '}
            <Text style={styles.mobileBold}>{maskedMobile}</Text>
          </Text>

          {isSendingOtp ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color={authColors.header} />
              <Text style={styles.inlineLoadingText}>Sending OTP...</Text>
            </View>
          ) : null}

          {statusMessage ? (
            <Text style={styles.statusText}>{statusMessage}</Text>
          ) : null}

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <OtpInput value={otp} onChange={setOtp} />

          <View style={styles.resendRow}>
            <Ionicons
              name="time-outline"
              size={15}
              color={authColors.textMuted}
            />
            <Text style={styles.resendCountdown}>
              {isExpired ? (
                <Text style={styles.expiredText}>OTP expired</Text>
              ) : (
                <>
                  OTP expires in{' '}
                  <Text style={styles.resendBold}>{formatted}</Text>
                </>
              )}
            </Text>
          </View>

          <View style={styles.resendPromptRow}>
            <Text style={styles.resendPrompt}>Didn&apos;t receive the code? </Text>
            <TouchableOpacity
              activeOpacity={canResend && !isResendingOtp ? 0.7 : 1}
              onPress={handleResendOtp}
              disabled={!canResend || isResendingOtp || isSendingOtp}
            >
              <Text
                style={[
                  styles.resendLink,
                  (!canResend || isResendingOtp || isSendingOtp) &&
                    styles.resendLinkDisabled,
                ]}
              >
                {isResendingOtp ? 'Resending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              verifyDisabled && styles.primaryBtnDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleVerifyOtp}
            disabled={verifyDisabled}
          >
            {isVerifyingOtp ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          {isRecovery ? (
            <View style={styles.passwordSection}>
              <Text style={styles.passwordHeading}>Set Your Password</Text>

              <PasswordInput
                label="New Password"
                required
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />

              <PasswordInput
                label="Confirm Password"
                required
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />

              <Text style={styles.passwordHint}>{PASSWORD_REQUIREMENT_TEXT}</Text>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  passwordContinueDisabled && styles.primaryBtnDisabled,
                ]}
                activeOpacity={0.85}
                onPress={handleSetPasswordAndContinue}
                disabled={passwordContinueDisabled}
              >
                {isResettingPassword ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Set Password & Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.passwordSection}>
              <Text style={styles.passwordHeading}>Set Your Password</Text>
              <Text style={styles.passwordHint}>
                Your password was created during registration. Verify your mobile
                number above to continue.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: authColors.header,
    paddingHorizontal: spacing.screen,
    paddingBottom: 14,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: spacing.screen,
    paddingTop: 16,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: '#B7E4C7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 22,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.successText,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: authColors.header,
    textAlign: 'center',
    marginBottom: 10,
  },
  instruction: {
    fontSize: 14,
    lineHeight: 21,
    color: authColors.textMuted,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  mobileBold: {
    fontWeight: '700',
    color: authColors.textDark,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  inlineLoadingText: {
    fontSize: 13,
    color: authColors.textMuted,
  },
  statusText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.successText,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 12,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  resendCountdown: {
    fontSize: 13,
    color: authColors.textMuted,
  },
  expiredText: {
    fontWeight: '700',
    color: '#FF3B30',
  },
  resendBold: {
    fontWeight: '700',
    color: authColors.textDark,
  },
  resendPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  resendPrompt: {
    fontSize: 13,
    color: authColors.textMuted,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '700',
    color: authColors.gold,
    textDecorationLine: 'underline',
  },
  resendLinkDisabled: {
    opacity: 0.55,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: authColors.header,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  primaryBtnDisabled: {
    opacity: 0.65,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  passwordSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: authColors.divider,
    paddingTop: 24,
  },
  passwordHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: authColors.header,
    marginBottom: 18,
  },
  passwordHint: {
    fontSize: 12,
    lineHeight: 18,
    color: authColors.textMuted,
    marginBottom: 20,
  },
});
