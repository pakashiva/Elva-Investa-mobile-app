import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { authColors } from '../../theme/authColors';

type Props = {
  label: string;
} & TextInputProps;

export default function SignInTextField({ label, style, ...inputProps }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={authColors.textLight}
        style={[styles.input, style]}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: authColors.textDark,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: authColors.textDark,
    backgroundColor: authColors.inputBg,
  },
});
