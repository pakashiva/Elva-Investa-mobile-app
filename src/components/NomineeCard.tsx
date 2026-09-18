import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NomineeListItem } from '../types/nominee';
import { colors } from '../theme/colors';

type Props = {
  nominee: NomineeListItem;
};

export default function NomineeCard({ nominee }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <Text style={styles.initial}>{nominee.initial}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {nominee.name}
          </Text>
          <Text style={styles.relationship}>{nominee.relationshipLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>AADHAAR</Text>
        <Text style={styles.footerValue}>{nominee.maskedAadhaar}</Text>
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
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  relationship: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
    marginVertical: 12,
  },
  footer: {
    gap: 4,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
