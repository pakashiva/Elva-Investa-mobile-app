import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BankAccount } from '../types/bankAccount';
import { colors } from '../theme/colors';

type Props = {
  account: BankAccount;
};

export default function BankAccountCard({ account }: Props) {
  const isPrimary = account.isPrimary;
  const badgeBg = isPrimary ? colors.successBg : colors.closedBg;
  const badgeText = isPrimary ? colors.successText : colors.closedText;

  return (
    <View style={[styles.card, isPrimary && styles.cardPrimary]}>
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <Text style={styles.initial}>{account.initial}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.bankName} numberOfLines={1}>
            {account.bankName}
          </Text>
          <Text style={styles.masked}>{account.maskedNumber}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeText }]}>
            {account.badge}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>IFSC CODE</Text>
          <Text style={styles.footerValue}>{account.ifsc}</Text>
        </View>
        <View style={[styles.footerCol, styles.footerColRight]}>
          <Text style={styles.footerLabel}>ACCOUNT TYPE</Text>
          <Text style={styles.footerValue}>{account.accountType}</Text>
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
    borderColor: colors.borderStrong,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    marginBottom: 12,
  },
  cardPrimary: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  bankName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  masked: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
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
  footer: {
    flexDirection: 'row',
  },
  footerCol: {
    flex: 1,
  },
  footerColRight: {
    alignItems: 'flex-end',
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
