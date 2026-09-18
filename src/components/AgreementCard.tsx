import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AgreementListItem } from '../types/agreement';
import { colors } from '../theme/colors';

type Props = {
  agreement: AgreementListItem;
  onRequestRenewal: (agreement: AgreementListItem) => void;
};

export default function AgreementCard({
  agreement,
  onRequestRenewal,
}: Props) {
  return (
    <View style={styles.card}>
      {agreement.showRenewalUpcoming ? (
        <View style={styles.alertBanner}>
          <View style={styles.alertIcon}>
            <Ionicons name="alert" size={14} color={colors.danger} />
          </View>
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitle}>Renewal Upcoming</Text>
            <Text style={styles.alertBody}>
              Your agreement is due for renewal in {agreement.daysUntilEnd} day
              {agreement.daysUntilEnd === 1 ? '' : 's'}.
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.topRow}>
        <View style={styles.docIcon}>
          <Ionicons name="document-text" size={22} color={colors.success} />
        </View>
        <View style={styles.topInfo}>
          <Text style={styles.agreementTitle}>
            Agreement #{agreement.agreementId}
          </Text>
          <Text
            style={[
              styles.statusText,
              agreement.isExpired ? styles.statusExpired : styles.statusActive,
            ]}
          >
            {agreement.isExpired ? 'Expired' : 'Active'}
          </Text>
        </View>
        <View style={styles.amountCol}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>{agreement.fundAmountLabel}</Text>
          <Text style={styles.amountWords} numberOfLines={2}>
            {agreement.fundAmountWords}
          </Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>CUSTOMER ID</Text>
          <Text style={styles.metaValue}>{agreement.customerId}</Text>
        </View>
        <View style={[styles.metaCell, styles.metaCellRight]}>
          <Text style={styles.metaLabel}>START DATE</Text>
          <Text style={styles.metaValue}>{agreement.startDateLabel}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>END DATE</Text>
          <Text style={styles.metaValue}>{agreement.endDateLabel}</Text>
        </View>
        <View style={[styles.metaCell, styles.metaCellRight]}>
          <Text style={styles.metaLabel}>RENEWAL IN</Text>
          <Text
            style={[
              styles.metaValue,
              agreement.showRenewalUpcoming && styles.metaValueUrgent,
              agreement.isExpired && styles.metaValueMuted,
            ]}
          >
            {agreement.renewalInLabel}
          </Text>
        </View>
      </View>

      {agreement.isActive ? (
        <TouchableOpacity
          style={styles.renewBtn}
          activeOpacity={0.85}
          onPress={() => onRequestRenewal(agreement)}
        >
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.renewBtnText}>Request Renewal</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 14,
    marginBottom: 12,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FDECEC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  alertIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  alertTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: 2,
  },
  alertBody: {
    fontSize: 12,
    lineHeight: 16,
    color: '#C0392B',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  docIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topInfo: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  agreementTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusActive: {
    color: colors.successText,
  },
  statusExpired: {
    color: colors.closedText,
  },
  amountCol: {
    alignItems: 'flex-end',
    maxWidth: '42%',
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  amountWords: {
    marginTop: 2,
    fontSize: 10,
    fontStyle: 'italic',
    color: colors.successText,
    textAlign: 'right',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  metaCell: {
    width: '50%',
    paddingVertical: 6,
  },
  metaCellRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaValueUrgent: {
    color: colors.danger,
  },
  metaValueMuted: {
    color: colors.closedText,
  },
  renewBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  renewBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
