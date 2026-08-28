import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FormSectionHeader from '../../components/form/FormSectionHeader';
import FormTextField from '../../components/form/FormTextField';
import FormSelectField from '../../components/form/FormSelectField';
import FormCheckbox from '../../components/form/FormCheckbox';
import PayableInfoBanner from '../../components/form/PayableInfoBanner';
import {
  DUMMY_BANK_ACCOUNTS,
  DUMMY_NOMINEES,
  getAutoSelectedPaydate,
  formatPayableBreakdown,
} from '../../data/fundRequest';
import { AddFundsStackScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme/colors';

type Props = AddFundsStackScreenProps<'NewFundRequest'>;

export default function NewFundRequestScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const autoPaydate = useMemo(() => getAutoSelectedPaydate(), []);

  const [fundAmount, setFundAmount] = useState('');
  const [bankAccountId, setBankAccountId] = useState<string | null>(null);
  const [nomineeId, setNomineeId] = useState<string | null>(null);
  const [hasReferralCode, setHasReferralCode] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  const payable = useMemo(
    () => formatPayableBreakdown(fundAmount),
    [fundAmount]
  );

  const goBackToInvestments = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MyInvestments');
    }
  };

  const handleSubmit = () => {
    // UI + form structure only — backend submission comes in a later stage
    Alert.alert(
      'Fund request ready',
      'Form captured locally. Backend submission will be connected in the next stage.'
    );
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBackToInvestments}
          activeOpacity={0.7}
          hitSlop={8}
          style={styles.headerIconBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Fund Request</Text>
        <TouchableOpacity
          onPress={goBackToInvestments}
          activeOpacity={0.7}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
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
          <FormSectionHeader icon="wallet-outline" title="FUND DETAILS" />

          <FormTextField
            label="Fund Amount (in ₹)"
            required
            placeholder="e.g. 1,00,000"
            hint="Minimum fund is ₹1,00,000"
            value={fundAmount}
            onChangeText={setFundAmount}
            keyboardType="numeric"
          />

          <FormSelectField
            label="Select Paydate"
            required
            labelIcon={
              <Ionicons name="calendar-outline" size={15} color={colors.textPrimary} />
            }
            placeholder="Choose a date"
            value={autoPaydate}
            options={[{ id: autoPaydate, label: autoPaydate }]}
            onChange={() => {}}
            editable={false}
          />

          <FormSelectField
            label="Source Bank Account"
            required
            labelIcon={
              <Ionicons name="card-outline" size={15} color={colors.textPrimary} />
            }
            placeholder="Select account"
            value={bankAccountId}
            options={DUMMY_BANK_ACCOUNTS.map((a) => ({
              id: a.id,
              label: a.label,
            }))}
            onChange={setBankAccountId}
          />

          <FormSectionHeader icon="person-outline" title="NOMINEE DETAILS" />

          <FormSelectField
            label="Select Nominee"
            required
            placeholder="Select an existing nominee"
            value={nomineeId}
            options={DUMMY_NOMINEES.map((n) => ({
              id: n.id,
              label: n.name,
            }))}
            onChange={setNomineeId}
          />

          <FormCheckbox
            checked={hasReferralCode}
            onChange={setHasReferralCode}
            label="I have a Referral Code (Optional)"
          />

          {hasReferralCode ? (
            <FormTextField
              label="Referral Code"
              placeholder="Enter referral code"
              value={referralCode}
              onChangeText={setReferralCode}
              autoCapitalize="characters"
            />
          ) : null}

          <PayableInfoBanner
            totalDisplay={payable.displayTotal}
            detail={payable.detail}
          />

          <FormCheckbox
            checked={agreedToTerms}
            onChange={setAgreedToTerms}
            label="I agree to the Terms & Conditions and understand all risks associated with this investment."
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={goBackToInvestments}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              onPress={handleSubmit}
            >
              <Text style={styles.submitText}>Submit Fund</Text>
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
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.screen,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: 12,
    paddingBottom: 28,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5A6577',
  },
  submitBtn: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
