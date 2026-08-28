import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
};

export default function FormSectionHeader({ icon, title }: Props) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color="#7B8798" />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#7B8798',
  },
});
