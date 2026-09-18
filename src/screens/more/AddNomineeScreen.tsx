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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BankFormField from '../../components/bank/BankFormField';
import FormSelectField from '../../components/form/FormSelectField';
import { useAuth } from '../../contexts/AuthContext';
import { RELATIONSHIP_OPTIONS } from '../../data/registrationForm';
import { ADD_NOMINEE_DEFAULTS } from '../../data/nomineeForm';
import { createNominee } from '../../services/nomineeService';
import { MoreStackScreenProps } from '../../navigation/types';
import { AddNomineeFormErrors } from '../../types/nominee';
import {
  hasNomineeFormErrors,
  validateAddNomineeForm,
} from '../../utils/validateNomineeForm';
import { colors, spacing } from '../../theme/colors';

type Props = MoreStackScreenProps<'AddNominee'>;

export default function AddNomineeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [nomineeName, setNomineeName] = useState(
    ADD_NOMINEE_DEFAULTS.nomineeName
  );
  const [relationship, setRelationship] = useState(
    ADD_NOMINEE_DEFAULTS.relationship
  );
  const [nomineeAadhaar, setNomineeAadhaar] = useState(
    ADD_NOMINEE_DEFAULTS.nomineeAadhaar
  );
  const [errors, setErrors] = useState<AddNomineeFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goBack = () => {
    navigation.goBack();
  };

  const clearFieldError = (field: keyof AddNomineeFormErrors) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAddNominee = async () => {
    const userId = session?.user?.id;
    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in to add a nominee.');
      return;
    }

    const nextErrors = validateAddNomineeForm({
      nomineeName,
      relationship,
      nomineeAadhaar,
    });
    setErrors(nextErrors);

    if (hasNomineeFormErrors(nextErrors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createNominee(userId, {
        nomineeName,
        relationship,
        nomineeAadhaar,
      });
      navigation.navigate('MyNominees');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to add nominee. Please try again.';
      Alert.alert('Unable to add nominee', message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <Text style={styles.title}>Add Nominee</Text>
          <Text style={styles.subtitle}>
            Add a nominee for succession on your investments.
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
              Nominee details are encrypted and protected using bank-grade
              security protocols.
            </Text>
          </View>

          <BankFormField
            label="Nominee Name"
            required
            value={nomineeName}
            onChangeText={(text) => {
              setNomineeName(text);
              clearFieldError('nomineeName');
            }}
            error={errors.nomineeName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <FormSelectField
            label="Relationship"
            required
            placeholder="Select relationship"
            value={relationship}
            options={RELATIONSHIP_OPTIONS}
            onChange={(id) => {
              setRelationship(id);
              clearFieldError('relationship');
            }}
          />
          {errors.relationship ? (
            <Text style={styles.fieldError}>{errors.relationship}</Text>
          ) : null}

          <BankFormField
            label="Nominee Aadhaar Number"
            required
            value={nomineeAadhaar}
            onChangeText={(text) => {
              setNomineeAadhaar(text.replace(/\D/g, '').slice(0, 12));
              clearFieldError('nomineeAadhaar');
            }}
            error={errors.nomineeAadhaar}
            keyboardType="number-pad"
            maxLength={12}
            returnKeyType="done"
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={goBack}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleAddNominee}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>Add Nominee</Text>
              )}
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
  fieldError: {
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
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
