import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors } from '../../theme/colors';

type Props = {
  label: string;
  required?: boolean;
  hint?: string;
  labelIcon?: React.ReactNode;
} & TextInputProps;

export default function FormTextField({
  label,
  required,
  hint,
  labelIcon,
  style,
  ...inputProps
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        {labelIcon}
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.asterisk}> *</Text> : null}
        </Text>
      </View>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, style]}
        {...inputProps}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  asterisk: {
    color: colors.danger,
    fontWeight: '700',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
