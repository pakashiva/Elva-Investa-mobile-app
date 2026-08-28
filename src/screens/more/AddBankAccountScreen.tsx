import React, { useState } from 'react';
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
import BankFormField from '../../components/bank/BankFormField';
import AccountTypeSelector from '../../components/bank/AccountTypeSelector';
import FormCheckbox from '../../components/form/FormCheckbox';
import {
  ADD_BANK_ACCOUNT_DEFAULTS,
  isValidIfscFormat,
} from '../../data/bankAccountForm';
import { MoreStackScreenProps } from '../../navigation/types';
import { AddBankAccountFormErrors } from '../../types/bankAccountForm';
import { BankAccountType } from '../../types/bankAccount';
import {
  hasFormErrors,
  validateAddBankAccountForm,
} from '../../utils/validateBankAccountForm';
import { colors, spacing } from '../../theme/colors';

type Props = MoreStackScreenProps<'AddBankAccount'>;

export default function AddBankAccountScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [accountHolderName, setAccountHolderName] = useState(
    ADD_BANK_ACCOUNT_DEFAULTS.accountHolderName
  );
  const [accountNumber, setAccountNumber] = useState(
    ADD_BANK_ACCOUNT_DEFAULTS.accountNumber
  );
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(
    ADD_BANK_ACCOUNT_DEFAULTS.confirmAccountNumber
  );
  const [ifscCode, setIfscCode] = useState(ADD_BANK_ACCOUNT_DEFAULTS.ifscCode);
  const [accountType, setAccountType] = useState<BankAccountType>(
    ADD_BANK_ACCOUNT_DEFAULTS.accountType
  );
  const [authorized, setAuthorized] = useState(
    ADD_BANK_ACCOUNT_DEFAULTS.authorized
  );
  const [errors, setErrors] = useState<AddBankAccountFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const goBack = () => {
    navigation.goBack();
  };

  const clearFieldError = (field: keyof AddBankAccountFormErrors) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleVerifyAndAdd = () => {
    setSubmitted(true);
    const nextErrors = validateAddBankAccountForm({
      accountHolderName,
      accountNumber,
      confirmAccountNumber,
      ifscCode,
      accountType,
      authorized,
    });
    setErrors(nextErrors);

    if (hasFormErrors(nextErrors)) {
      return;
    }

    // Local validation only — backend verification comes later
    Alert.alert(
      'Form validated',
      'Bank account details look valid locally. Backend verification and account linking will be added in a later stage.'
    );
  };

  const ifscLooksValid = isValidIfscFormat(ifscCode);

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={goBack}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Add Bank Account</Text>
          <Text style={styles.subtitle}>
            Link a new account to receive withdrawals.
          </Text>
        </View>
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
          <View style={styles.securityBanner}>
            <Ionicons
              name="shield-checkmark"
              size={18}
              color={colors.successText}
            />
            <Text style={styles.securityText}>
              Your banking details are fully encrypted and protected using
              bank-grade security protocols.
            </Text>
          </View>

          <BankFormField
            label="Account Holder Name"
            required
            value={accountHolderName}
            onChangeText={(text) => {
              setAccountHolderName(text);
              clearFieldError('accountHolderName');
            }}
            error={errors.accountHolderName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <BankFormField
            label="Account Number"
            required
            value={accountNumber}
            onChangeText={(text) => {
              setAccountNumber(text.replace(/[^\d]/g, ''));
              clearFieldError('accountNumber');
              if (submitted && confirmAccountNumber) {
                clearFieldError('confirmAccountNumber');
              }
            }}
            error={errors.accountNumber}
            keyboardType="number-pad"
            returnKeyType="next"
          />

          <BankFormField
            label="Confirm Account Number"
            required
            value={confirmAccountNumber}
            onChangeText={(text) => {
              setConfirmAccountNumber(text.replace(/[^\d]/g, ''));
              clearFieldError('confirmAccountNumber');
            }}
            placeholder="Re-enter bank account number"
            error={errors.confirmAccountNumber}
            keyboardType="number-pad"
            returnKeyType="next"
          />

          <BankFormField
            label="IFSC Code"
            required
            value={ifscCode}
            onChangeText={(text) => {
              setIfscCode(text.toUpperCase());
              clearFieldError('ifscCode');
            }}
            error={errors.ifscCode}
            autoCapitalize="characters"
            autoCorrect={false}
            showValidIcon
            isValid={ifscLooksValid && !errors.ifscCode}
            returnKeyType="done"
          />

          <AccountTypeSelector value={accountType} onChange={setAccountType} />

          <FormCheckbox
            checked={authorized}
            onChange={(next) => {
              setAuthorized(next);
              clearFieldError('authorized');
            }}
            checkedColor={colors.primary}
            labelColor={colors.primary}
            label="I authorize Roxru Financial to initiate a penny-drop transaction of ₹1 to verify this bank account."
          />
          {errors.authorized ? (
            <Text style={styles.checkboxError}>{errors.authorized}</Text>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={goBack}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              onPress={handleVerifyAndAdd}
            >
              <Text style={styles.submitText}>Verify & Add</Text>
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
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.screen,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: 14,
    paddingBottom: 28,
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
    marginBottom: 18,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.successText,
    fontWeight: '500',
  },
  checkboxError: {
    marginTop: -8,
    marginBottom: 12,
    fontSize: 12,
    color: colors.danger,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
