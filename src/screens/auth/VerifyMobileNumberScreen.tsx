import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
import { useOtpCountdown } from '../../hooks/useOtpCountdown';
import { RootStackScreenProps } from '../../navigation/types';
import { authColors } from '../../theme/authColors';
import { colors, spacing } from '../../theme/colors';

type Props = RootStackScreenProps<'VerifyMobileNumber'>;

export default function VerifyMobileNumberScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState(VERIFY_MOBILE_DEFAULTS.otp);
  const [newPassword, setNewPassword] = useState(
    VERIFY_MOBILE_DEFAULTS.newPassword
  );
  const [confirmPassword, setConfirmPassword] = useState(
    VERIFY_MOBILE_DEFAULTS.confirmPassword
  );
  const { formatted, canResend, reset } = useOtpCountdown(
    VERIFY_MOBILE_DEFAULTS.resendSeconds
  );

  const goToHome = () => {
    navigation.replace('MainTabs');
  };

  const handleResendOtp = () => {
    if (!canResend) {
      return;
    }
    reset();
  };

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Mobile Number</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
            <Text style={styles.mobileBold}>
              {VERIFY_MOBILE_DEFAULTS.maskedMobile}
            </Text>
          </Text>

          <OtpInput value={otp} onChange={setOtp} />

          <View style={styles.resendRow}>
            <Ionicons
              name="time-outline"
              size={15}
              color={authColors.textMuted}
            />
            <Text style={styles.resendCountdown}>
              Resend OTP in <Text style={styles.resendBold}>{formatted}</Text>
            </Text>
          </View>

          <View style={styles.resendPromptRow}>
            <Text style={styles.resendPrompt}>Didn&apos;t receive the code? </Text>
            <TouchableOpacity
              activeOpacity={canResend ? 0.7 : 1}
              onPress={handleResendOtp}
              disabled={!canResend}
            >
              <Text
                style={[
                  styles.resendLink,
                  !canResend && styles.resendLinkDisabled,
                ]}
              >
                Resend OTP
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={goToHome}
          >
            <Text style={styles.primaryBtnText}>Verify OTP</Text>
          </TouchableOpacity>

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
              style={styles.primaryBtn}
              activeOpacity={0.85}
              onPress={goToHome}
            >
              <Text style={styles.primaryBtnText}>Set Password & Continue</Text>
            </TouchableOpacity>
          </View>
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
