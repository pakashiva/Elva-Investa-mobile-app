import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getWithdrawalById } from '../../data/withdrawals';
import { WithdrawalsStackScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme/colors';

type Props = WithdrawalsStackScreenProps<'WithdrawalDetails'>;

/** Placeholder — withdrawal request details will be built in a later stage */
export default function WithdrawalDetailsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const withdrawal = useMemo(
    () => getWithdrawalById(route.params.withdrawalId),
    [route.params.withdrawalId]
  );

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Withdrawal Details</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.code}>{withdrawal?.investmentCode ?? '—'}</Text>
        <Text style={styles.name}>{withdrawal?.fundName ?? 'Request'}</Text>
        <Text style={styles.placeholder}>
          Full withdrawal request details will be available in a later step.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  body: {
    paddingHorizontal: spacing.screen,
    paddingTop: 20,
  },
  code: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  placeholder: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
