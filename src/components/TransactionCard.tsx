import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Transaction } from '../types/transaction';
import { colors } from '../theme/colors';

type Props = {
  transaction: Transaction;
};

export default function TransactionCard({ transaction }: Props) {
  const amountColor =
    transaction.direction === 'credit' ? colors.success : colors.textPrimary;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <Text style={styles.date}>{transaction.date}</Text>
          <Text style={styles.txnId}>{transaction.txnId}</Text>
        </View>
        <Text style={[styles.amount, { color: amountColor }]}>
          {transaction.amount}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Investment plan ID</Text>
        <Text style={styles.planId}>{transaction.planId}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Type</Text>
        <Text style={styles.detailValue}>{transaction.type}</Text>
      </View>
      <View style={[styles.detailRow, styles.detailRowLast]}>
        <Text style={styles.detailLabel}>Reference ID</Text>
        <Text style={styles.detailValue}>{transaction.referenceId}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  topLeft: {
    flex: 1,
    minWidth: 0,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  txnId: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  detailRowLast: {
    marginBottom: 0,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
    flexShrink: 1,
  },
  planId: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primarySoft,
    textAlign: 'right',
  },
});
