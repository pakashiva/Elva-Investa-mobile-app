import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MonthlyEarning } from '../types/earning';
import { colors } from '../theme/colors';

type Props = {
  earning: MonthlyEarning;
};

export default function EarningCard({ earning }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <Text style={styles.monthLabel}>{earning.monthLabel}</Text>
          <Text style={styles.investmentName} numberOfLines={2}>
            {earning.investmentName}
          </Text>
          <Text style={styles.metaText}>
            Period {earning.periodIndex} · ends {earning.periodEndLabel}
          </Text>
        </View>
        <View style={styles.netBadge}>
          <Text style={styles.netBadgeLabel}>Net payout</Text>
          <Text style={styles.netBadgeValue}>{earning.netPayoutLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.amountGrid}>
        <View style={styles.amountCell}>
          <Text style={styles.amountLabel}>Interest earned</Text>
          <Text style={styles.amountValue}>{earning.interestEarnedLabel}</Text>
        </View>
        <View style={styles.amountCell}>
          <Text style={styles.amountLabel}>TDS deducted</Text>
          <Text style={[styles.amountValue, styles.tdsValue]}>
            {earning.tdsDeductedLabel}
          </Text>
        </View>
        <View style={[styles.amountCell, styles.amountCellLast]}>
          <Text style={styles.amountLabel}>Net payout</Text>
          <Text style={[styles.amountValue, styles.netValue]}>
            {earning.netPayoutLabel}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Investment ID</Text>
        <Text style={styles.detailValue}>{earning.investmentCode}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Principal</Text>
        <Text style={styles.detailValue}>{earning.principalLabel}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Interest rate</Text>
        <Text style={styles.detailValue}>
          {earning.interestRatePercent}% p.m.
        </Text>
      </View>

      <View style={styles.bankBox}>
        <View style={styles.bankIcon}>
          <Ionicons name="card-outline" size={16} color={colors.primary} />
        </View>
        <View style={styles.bankCopy}>
          <Text style={styles.bankName} numberOfLines={1}>
            {earning.bankName}
          </Text>
          <Text style={styles.bankMeta} numberOfLines={1}>
            {earning.bankMaskedNumber}
            {earning.bankAccountType !== '—'
              ? ` · ${earning.bankAccountType}`
              : ''}
          </Text>
          <Text style={styles.bankMeta} numberOfLines={1}>
            IFSC {earning.bankIfsc}
          </Text>
        </View>
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
  monthLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  investmentName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
  },
  netBadge: {
    alignItems: 'flex-end',
    backgroundColor: colors.successBg,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  netBadgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.successText,
    marginBottom: 2,
  },
  netBadgeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.success,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
    marginVertical: 12,
  },
  amountGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  amountCell: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  amountCellLast: {
    // spacing handled by gap
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tdsValue: {
    color: colors.danger,
  },
  netValue: {
    color: colors.success,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  bankBox: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bankIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankCopy: {
    flex: 1,
    minWidth: 0,
  },
  bankName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  bankMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
