import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { authColors } from '../../theme/authColors';

const OTP_LENGTH = 6;

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function OtpInput({ value, onChange }: Props) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const digits = Array.from(
    { length: OTP_LENGTH },
    (_, index) => value[index] ?? ''
  );

  const activeIndex = isFocused
    ? value.length < OTP_LENGTH
      ? value.length
      : OTP_LENGTH - 1
    : -1;

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(cleaned);
  };

  const handleBoxPress = () => {
    focusInput();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <View style={styles.wrap}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={handleFocus}
        onBlur={() => setIsFocused(false)}
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        style={styles.hiddenInput}
        caretHidden
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        textContentType="oneTimeCode"
        importantForAutofill="yes"
      />

      <Pressable style={styles.row} onPress={focusInput}>
        {digits.map((digit, index) => {
          const isActive = activeIndex === index;
          return (
            <Pressable
              key={index}
              style={[
                styles.box,
                isActive && styles.boxFocused,
                digit !== '' && styles.boxFilled,
              ]}
              onPress={handleBoxPress}
            >
              <Text style={styles.digitText}>{digit}</Text>
            </Pressable>
          );
        })}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    marginBottom: 18,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 52,
    opacity: 0,
    color: 'transparent',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    minWidth: 44,
    maxWidth: 48,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
    backgroundColor: authColors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: {
    borderWidth: 2,
    borderColor: authColors.header,
    backgroundColor: '#FFFFFF',
  },
  boxFilled: {
    backgroundColor: '#FFFFFF',
  },
  digitText: {
    fontSize: 20,
    fontWeight: '700',
    color: authColors.header,
    textAlign: 'center',
    lineHeight: 24,
    minHeight: 24,
    minWidth: 14,
  },
});
