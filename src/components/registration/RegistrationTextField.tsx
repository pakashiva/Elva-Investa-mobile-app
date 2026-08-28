import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { authColors } from '../../theme/authColors';

type Props = {
  label: string;
  required?: boolean;
  error?: string;
  readOnly?: boolean;
} & TextInputProps;

export default function RegistrationTextField({
  label,
  required,
  error,
  readOnly,
  style,
  ...inputProps
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.asterisk}> *</Text> : null}
      </Text>
      <TextInput
        placeholderTextColor={authColors.textLight}
        style={[
          styles.input,
          readOnly && styles.inputReadonly,
          error ? styles.inputError : null,
          style,
        ]}
        editable={!readOnly}
        {...inputProps}
      />
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
    color: authColors.textDark,
    marginBottom: 8,
  },
  asterisk: {
    color: '#FF3B30',
    fontWeight: '700',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: authColors.textDark,
    backgroundColor: '#FFFFFF',
  },
  inputReadonly: {
    backgroundColor: authColors.inputBg,
    color: authColors.textMuted,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    color: '#FF3B30',
  },
});
