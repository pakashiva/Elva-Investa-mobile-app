import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

type Props = {
  requestedDate: string;
  processing?: string;
  settlement?: string;
};

export default function RequestTimelineBar({
  requestedDate,
  processing = '--',
  settlement = '--',
}: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.cell}>
        <Text style={styles.cellLabel}>REQUESTED</Text>
        <Text style={styles.cellValue}>{requestedDate}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.cell}>
        <Text style={styles.cellLabel}>PROCESSING</Text>
        <Text style={styles.cellValue}>{processing}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.cell}>
        <Text style={styles.cellLabel}>SETTLEMENT</Text>
        <Text style={styles.cellValue}>{settlement}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  cellValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
