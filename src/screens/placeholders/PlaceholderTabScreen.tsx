import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/colors';

type Props = {
  title: string;
  message?: string;
};

export default function PlaceholderTabScreen({
  title,
  message = 'This screen will be built in a later step.',
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safe, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.screen,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
