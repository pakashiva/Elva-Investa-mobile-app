import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WithdrawalStrategy } from '../../types/withdrawal';
import { colors } from '../../theme/colors';

type Props = {
  value: WithdrawalStrategy;
  onChange: (strategy: WithdrawalStrategy) => void;
  disablePartial?: boolean;
};

export default function WithdrawalStrategyCards({
  value,
  onChange,
  disablePartial = false,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Withdrawal Strategy</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, value === 'full' && styles.cardSelected]}
          activeOpacity={0.85}
          onPress={() => onChange('full')}
        >
          <Text
            style={[styles.cardTitle, value === 'full' && styles.cardTitleSelected]}
          >
            Full Withdrawal
          </Text>
          <Text style={styles.cardDesc}>
            Withdraw principal and close account.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.card,
            value === 'partial' && styles.cardSelected,
            disablePartial && styles.cardDisabled,
          ]}
          activeOpacity={disablePartial ? 1 : 0.85}
          onPress={() => {
            if (!disablePartial) {
              onChange('partial');
            }
          }}
          disabled={disablePartial}
        >
          <Text
            style={[
              styles.cardTitle,
              value === 'partial' && styles.cardTitleSelected,
              disablePartial && styles.cardTitleDisabled,
            ]}
          >
            Partial Withdrawal
          </Text>
          <Text
            style={[styles.cardDesc, disablePartial && styles.cardDescDisabled]}
          >
            Minimum ₹1L balance required.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 96,
  },
  cardSelected: {
    borderColor: colors.primarySoft,
    backgroundColor: '#F3F0FF',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  cardTitleSelected: {
    color: colors.primarySoft,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  cardDisabled: {
    opacity: 0.45,
    backgroundColor: '#F7F8FA',
  },
  cardTitleDisabled: {
    color: colors.textSecondary,
  },
  cardDescDisabled: {
    color: colors.textMuted,
  },
});
