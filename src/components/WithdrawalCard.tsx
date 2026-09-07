import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { WithdrawalRequest, WithdrawalStatus } from '../types/withdrawal';
import { colors } from '../theme/colors';

type Props = {
  withdrawal: WithdrawalRequest;
  selected?: boolean;
  onPress?: () => void;
  onCancelPress?: () => void;
  isCancelling?: boolean;
};

function statusColors(status: WithdrawalStatus) {
  switch (status) {
    case 'Paid':
      return { bg: '#E6F7EF', text: '#1B7A4E' };
    case 'Approved':
      return { bg: '#E8F1FF', text: '#1B6BC7' };
    case 'Processing':
      return { bg: '#FFF4E5', text: '#C47A00' };
    case 'Rejected':
      return { bg: '#FFEBEE', text: '#C62828' };
    default:
      return { bg: colors.closedBg, text: colors.closedText };
  }
}

export default function WithdrawalCard({
  withdrawal,
  selected = false,
  onPress,
  onCancelPress,
  isCancelling = false,
}: Props) {
  const badge = statusColors(withdrawal.status);
  const showCancel =
    selected && withdrawal.status === 'Processing' && Boolean(onCancelPress);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[styles.card, selected && styles.cardSelected]}
        activeOpacity={onPress ? 0.85 : 1}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <Text style={styles.code}>{withdrawal.investmentCode}</Text>
            <Text style={styles.fundName}>{withdrawal.fundName}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>
              {withdrawal.status}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.amountsRow}>
          <View style={styles.col}>
            <Text style={styles.label}>Requested</Text>
            <Text style={styles.amount}>{withdrawal.requestedAmount}</Text>
          </View>
          <View style={[styles.col, styles.colRight]}>
            <Text style={styles.label}>Net payout</Text>
            <Text style={styles.amount}>{withdrawal.netPayout}</Text>
          </View>
        </View>

        <View style={styles.datesRow}>
          <View style={styles.col}>
            <Text style={styles.label}>Requested on</Text>
            <Text style={styles.date}>{withdrawal.requestedOn}</Text>
          </View>
          <View style={[styles.col, styles.colRight]}>
            <Text style={styles.label}>{withdrawal.statusDateLabel}</Text>
            <Text style={styles.date}>{withdrawal.statusDate}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {showCancel ? (
        <TouchableOpacity
          style={[styles.cancelBtn, isCancelling && styles.cancelBtnDisabled]}
          activeOpacity={0.85}
          onPress={onCancelPress}
          disabled={isCancelling}
        >
          {isCancelling ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.cancelBtnText}>Cancel Withdraw Request</Text>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardSelected: {
    borderColor: colors.primarySoft,
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
  code: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  fundName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
    marginVertical: 12,
  },
  amountsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  datesRow: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  colRight: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cancelBtn: {
    marginTop: 8,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  cancelBtnDisabled: {
    opacity: 0.7,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
