import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

type Props = {
  label: string;
  required?: boolean;
  error?: string;
  showValidIcon?: boolean;
  isValid?: boolean;
} & TextInputProps;

export default function BankFormField({
  label,
  required,
  error,
  showValidIcon,
  isValid,
  style,
  ...inputProps
}: Props) {
  const borderColor = error
    ? colors.danger
    : showValidIcon && isValid
      ? colors.success
      : colors.borderStrong;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.asterisk}> *</Text> : null}
      </Text>
      <View style={styles.inputWrap}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { borderColor },
            showValidIcon ? styles.inputWithIcon : null,
            style,
          ]}
          {...inputProps}
        />
        {showValidIcon && isValid ? (
          <View style={styles.validIcon}>
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={colors.success}
            />
          </View>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  asterisk: {
    color: colors.danger,
    fontWeight: '700',
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inputWithIcon: {
    paddingRight: 44,
  },
  validIcon: {
    position: 'absolute',
    right: 12,
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    color: colors.danger,
  },
});
