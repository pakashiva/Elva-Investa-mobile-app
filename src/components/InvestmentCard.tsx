import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Investment, InvestmentStatus } from '../types/investment';
import { colors } from '../theme/colors';

type Props = {
  investment: Investment;
  onPress: () => void;
};

function statusStyle(status: InvestmentStatus) {
  switch (status) {
    case 'Active':
      return { bg: colors.successBg, text: colors.successText };
    case 'Pending':
      return { bg: colors.pendingBg, text: colors.pendingText };
    case 'Closed':
    default:
      return { bg: colors.closedBg, text: colors.closedText };
  }
}

export default function InvestmentCard({ investment, onPress }: Props) {
  const badge = statusStyle(investment.status);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <Text style={styles.code}>{investment.code}</Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>
            {investment.status}
          </Text>
        </View>
      </View>

      <Text style={styles.name}>{investment.name}</Text>

      <View style={styles.divider} />

      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.label}>Invested</Text>
          <Text style={styles.valueDark}>{investment.invested}</Text>
        </View>
        <View style={[styles.cell, styles.cellRight]}>
          <Text style={styles.label}>Current Value</Text>
          <Text style={styles.valueBlue}>{investment.currentValue}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Yield</Text>
          <Text style={styles.valueYield}>{investment.yieldRate}</Text>
        </View>
        <View style={[styles.cell, styles.cellRight]}>
          <Text style={styles.label}>Earned Interest</Text>
          <Text style={styles.valueGreen}>{investment.earnedInterest}</Text>
        </View>
      </View>
    </TouchableOpacity>
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
    paddingBottom: 16,
    marginBottom: 12,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  code: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '50%',
    marginBottom: 12,
  },
  cellRight: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  valueDark: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  valueBlue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primarySoft,
  },
  valueYield: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.yield,
  },
  valueGreen: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.success,
  },
});
