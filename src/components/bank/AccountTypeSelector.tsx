import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BankAccountType } from '../../types/bankAccount';
import { colors } from '../../theme/colors';

type Props = {
  value: BankAccountType;
  onChange: (type: BankAccountType) => void;
};

export default function AccountTypeSelector({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Account Type</Text>
      <View style={styles.track}>
        <TouchableOpacity
          style={[styles.option, value === 'Savings' && styles.optionActive]}
          activeOpacity={0.8}
          onPress={() => onChange('Savings')}
        >
          <Text
            style={[
              styles.optionText,
              value === 'Savings' && styles.optionTextActive,
            ]}
          >
            Savings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, value === 'Current' && styles.optionActive]}
          activeOpacity={0.8}
          onPress={() => onChange('Current')}
        >
          <Text
            style={[
              styles.optionText,
              value === 'Current' && styles.optionTextActive,
            ]}
          >
            Current
          </Text>
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
    color: colors.textPrimary,
    marginBottom: 8,
  },
  track: {
    flexDirection: 'row',
    backgroundColor: '#EEF0F4',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: colors.surface,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
