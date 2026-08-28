import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { authColors } from '../../theme/authColors';

const OTP_LENGTH = 6;

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function OtpInput({ value, onChange }: Props) {
  const refs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(
    Math.min(value.length, OTP_LENGTH - 1)
  );

  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? '');

  useEffect(() => {
    refs.current[focusedIndex]?.focus();
  }, [focusedIndex]);

  const updateDigit = (index: number, digit: string) => {
    const chars = digits.slice();
    chars[index] = digit;
    const nextValue = chars.join('').replace(/\s/g, '');
    onChange(nextValue);

    if (digit && index < OTP_LENGTH - 1) {
      setFocusedIndex(index + 1);
    }
  };

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, '');
    if (!cleaned) {
      updateDigit(index, '');
      return;
    }

    if (cleaned.length > 1) {
      let next = value.slice(0, index);
      for (const char of cleaned) {
        if (next.length < OTP_LENGTH) {
          next += char;
        }
      }
      onChange(next);
      setFocusedIndex(Math.min(next.length, OTP_LENGTH - 1));
      return;
    }

    updateDigit(index, cleaned);
  };

  const handleKeyPress = (
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (event.nativeEvent.key !== 'Backspace') {
      return;
    }

    if (digits[index]) {
      const chars = digits.slice();
      chars[index] = '';
      onChange(chars.join(''));
      return;
    }

    if (index > 0) {
      const chars = digits.slice();
      chars[index - 1] = '';
      onChange(chars.join(''));
      setFocusedIndex(index - 1);
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => {
        const isFocused = focusedIndex === index;
        return (
          <Pressable
            key={index}
            style={[
              styles.box,
              isFocused && styles.boxFocused,
              digit ? styles.boxFilled : null,
            ]}
            onPress={() => setFocusedIndex(index)}
          >
            <TextInput
              ref={(ref) => {
                refs.current[index] = ref;
              }}
              style={styles.input}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(event) => handleKeyPress(event, index)}
              onFocus={() => setFocusedIndex(index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? OTP_LENGTH : 1}
              selectTextOnFocus
              caretHidden={false}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 18,
  },
  box: {
    flex: 1,
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
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: authColors.header,
    padding: 0,
  },
});
