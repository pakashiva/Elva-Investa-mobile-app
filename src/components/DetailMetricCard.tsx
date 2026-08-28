import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../theme/colors';

const GAP = 12;
const H_PAD = 16;
const CARD_WIDTH = (Dimensions.get('window').width - H_PAD * 2 - GAP) / 2;

type Props = {
  label: string;
  value: string;
  valueColor?: string;
};

export default function DetailMetricCard({
  label,
  value,
  valueColor = colors.textPrimary,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 16,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
