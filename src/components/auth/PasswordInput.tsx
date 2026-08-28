import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { authColors } from '../../theme/authColors';

type Props = {
  label: string;
  required?: boolean;
} & TextInputProps;

export default function PasswordInput({
  label,
  required,
  style,
  ...inputProps
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.asterisk}> *</Text> : null}
      </Text>
      <View style={styles.inputWrap}>
        <TextInput
          placeholderTextColor={authColors.textLight}
          style={[styles.input, style]}
          secureTextEntry={!visible}
          {...inputProps}
        />
        <TouchableOpacity
          style={styles.toggle}
          activeOpacity={0.7}
          onPress={() => setVisible((prev) => !prev)}
        >
          <View style={styles.toggleDot} />
        </TouchableOpacity>
      </View>
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
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingRight: 44,
    fontSize: 15,
    color: authColors.textDark,
    backgroundColor: authColors.inputBg,
  },
  toggle: {
    position: 'absolute',
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#C5CAD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});
