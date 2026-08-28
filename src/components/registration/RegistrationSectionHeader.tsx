import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { authColors } from '../../theme/authColors';

type Props = {
  number: number;
  title: string;
  description: string;
};

export default function RegistrationSectionHeader({
  number,
  title,
  description,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{number}</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: authColors.header,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: authColors.header,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: authColors.textMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: authColors.divider,
  },
});
