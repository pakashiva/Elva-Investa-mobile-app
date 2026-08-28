import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FormSelectField from '../../components/form/FormSelectField';
import HistoryRequestTabs from '../../components/withdrawals/HistoryRequestTabs';
import WithdrawalStrategyCards from '../../components/withdrawals/WithdrawalStrategyCards';
import RequestTimelineBar from '../../components/withdrawals/RequestTimelineBar';
import {
  WITHDRAWAL_FUND_OPTIONS,
  WITHDRAWAL_BANK_OPTIONS,
  WITHDRAWAL_REQUESTED_DATE,
  WithdrawalStrategy,
} from '../../data/withdrawalRequest';
import { WithdrawalsStackScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme/colors';

type Props = WithdrawalsStackScreenProps<'CreateWithdrawalRequest'>;

export default function CreateWithdrawalRequestScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [fundId, setFundId] = useState<string | null>(null);
  const [bankId, setBankId] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<WithdrawalStrategy>('full');
  const [amount, setAmount] = useState('');
  const [agreed, setAgreed] = useState(true);

  const goToHistory = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('WithdrawalsList');
    }
  };

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const normalized =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
    setAmount(normalized);
  };

  const handleSubmitReview = () => {
    // UI structure only — backend submission comes in a later stage
    Alert.alert(
      'Review ready',
      'Withdrawal request captured locally. Submission will be connected in the next stage.'
    );
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goToHistory}
          activeOpacity={0.7}
          hitSlop={8}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Request</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <HistoryRequestTabs
            active="request"
            onHistory={goToHistory}
            onRequest={() => {
              /* already on Request tab */
            }}
          />

          <FormSelectField
            label="Select Fund"
            mutedLabel
            placeholder="Select Account..."
            value={fundId}
            options={WITHDRAWAL_FUND_OPTIONS}
            onChange={setFundId}
          />

          <FormSelectField
            label="Payout Bank Account"
            mutedLabel
            placeholder="Select Bank..."
            value={bankId}
            options={WITHDRAWAL_BANK_OPTIONS}
            onChange={setBankId}
          />

          <WithdrawalStrategyCards value={strategy} onChange={setStrategy} />

          <View style={styles.amountWrap}>
            <Text style={styles.fieldLabel}>Withdrawal Amount</Text>
            <View style={styles.amountField}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <RequestTimelineBar requestedDate={WITHDRAWAL_REQUESTED_DATE} />

          <TouchableOpacity
            style={styles.termsBox}
            activeOpacity={0.85}
            onPress={() => setAgreed((prev) => !prev)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed ? (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              ) : null}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms and Conditions</Text>. I
              understand that full withdrawals will close my account and partial
              withdrawals require maintaining a minimum balance of ₹1,00,000.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.85}
            onPress={handleSubmitReview}
          >
            <Text style={styles.submitText}>Submit Review</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 28,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  amountWrap: {
    marginBottom: 18,
  },
  amountField: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    backgroundColor: '#F7F8FA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  currency: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  termsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 18,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  termsLink: {
    color: colors.primarySoft,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
