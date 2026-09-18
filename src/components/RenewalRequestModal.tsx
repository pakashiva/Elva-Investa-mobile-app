import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AgreementListItem,
  AgreementRenewalMode,
} from '../types/agreement';
import { formatInr, parseInrInput } from '../utils/currency';
import { colors, spacing } from '../theme/colors';

export type RenewalSubmitPayload = {
  mode: AgreementRenewalMode;
  incrementAmount: number | null;
};

type Props = {
  visible: boolean;
  agreement: AgreementListItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: RenewalSubmitPayload) => void;
};

export default function RenewalRequestModal({
  visible,
  agreement,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const [mode, setMode] = useState<AgreementRenewalMode>('same_amount');
  const [incrementText, setIncrementText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setMode('same_amount');
      setIncrementText('');
      setErrorMessage(null);
    }
  }, [visible, agreement?.id]);

  const incrementAmount = useMemo(
    () => parseInrInput(incrementText),
    [incrementText]
  );

  const proposedPrincipal = useMemo(() => {
    if (!agreement) return 0;
    return agreement.fundAmount + (Number.isFinite(incrementAmount) ? incrementAmount : 0);
  }, [agreement, incrementAmount]);

  if (!agreement) {
    return null;
  }

  const handleSubmit = () => {
    setErrorMessage(null);

    if (mode === 'increase') {
      if (!incrementText.trim() || !Number.isFinite(incrementAmount) || incrementAmount <= 0) {
        setErrorMessage('Enter a valid amount to add to your principal.');
        return;
      }
      onSubmit({ mode, incrementAmount });
      return;
    }

    // Same-amount renewal only within ≤15 days of expiry
    if (!agreement.showRenewalUpcoming) {
      setErrorMessage(
        'Renew with same amount is only available when your agreement expires in 15 days or less. You can still increase your investment anytime.'
      );
      return;
    }

    onSubmit({ mode, incrementAmount: null });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerIcon}>
                    <Ionicons name="refresh" size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.title}>Renewal Request</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  activeOpacity={0.7}
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Agreement ID</Text>
                  <Text style={styles.infoValue}>{agreement.agreementId}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Customer ID</Text>
                  <Text style={styles.infoValue}>{agreement.customerId}</Text>
                </View>
                <View style={[styles.infoRow, styles.infoRowLast]}>
                  <Text style={styles.infoLabel}>Current Principal</Text>
                  <Text style={styles.infoAmount}>{agreement.fundAmountLabel}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.option,
                  mode === 'same_amount' && styles.optionSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setMode('same_amount');
                  setErrorMessage(null);
                }}
                disabled={isSubmitting}
              >
                <View
                  style={[
                    styles.radio,
                    mode === 'same_amount' && styles.radioSelected,
                  ]}
                >
                  {mode === 'same_amount' ? (
                    <View style={styles.radioDot} />
                  ) : null}
                </View>
                <Text style={styles.optionText}>Renew with same amount</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.option,
                  mode === 'increase' && styles.optionSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setMode('increase');
                  setErrorMessage(null);
                }}
                disabled={isSubmitting}
              >
                <View
                  style={[
                    styles.radio,
                    mode === 'increase' && styles.radioSelected,
                  ]}
                >
                  {mode === 'increase' ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={styles.optionText}>Increase investment amount</Text>
              </TouchableOpacity>

              {mode === 'increase' ? (
                <View style={styles.increaseSection}>
                  <Text style={styles.inputLabel}>Additional principal</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.currencyPrefix}>₹</Text>
                    <TextInput
                      style={styles.input}
                      value={incrementText}
                      onChangeText={(text) => {
                        setIncrementText(text.replace(/[^\d.]/g, ''));
                        setErrorMessage(null);
                      }}
                      placeholder="Enter amount to add"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      editable={!isSubmitting}
                    />
                  </View>

                  {incrementAmount > 0 ? (
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryHeading}>Proposed principal</Text>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Current principal</Text>
                        <Text style={styles.summaryValue}>
                          {formatInr(agreement.fundAmount)}
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Increment</Text>
                        <Text style={styles.summaryIncrement}>
                          + {formatInr(incrementAmount)}
                        </Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryTotalLabel}>
                          Total principal
                        </Text>
                        <Text style={styles.summaryTotalValue}>
                          {formatInr(proposedPrincipal)}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.hintText}>
                      Enter how much you want to add to your current principal.
                    </Text>
                  )}
                </View>
              ) : null}

              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  activeOpacity={0.8}
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    isSubmitting && styles.submitDisabled,
                  ]}
                  activeOpacity={0.85}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitText}>Submit Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
  },
  keyboardWrap: {
    width: '100%',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F7F8FF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  increaseSection: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  hintText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  summaryHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryIncrement: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.successText,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    marginBottom: 8,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  submitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
