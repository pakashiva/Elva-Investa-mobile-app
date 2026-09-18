import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EarningCard from '../../components/EarningCard';
import ProfileAvatar from '../../components/ProfileAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationBell } from '../../hooks/useNotificationBell';
import { getUserMonthlyEarnings } from '../../services/earningService';
import { MonthlyEarning } from '../../types/earning';
import { formatInr } from '../../utils/currency';
import { isMissingTableError } from '../../utils/supabaseErrors';
import { MoreStackScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme/colors';
import { DEFAULT_PROFILE_AVATAR } from '../../constants/brandAssets';

const avatarSource = DEFAULT_PROFILE_AVATAR;

type Props = MoreStackScreenProps<'Earnings'>;

export default function EarningsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { hasUnread, openNotifications } = useNotificationBell();
  const [earnings, setEarnings] = useState<MonthlyEarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadEarnings = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setEarnings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await getUserMonthlyEarnings(userId);
      setEarnings(data);
    } catch (error) {
      if (isMissingTableError(error)) {
        setEarnings([]);
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Failed to load earnings.';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadEarnings();
    }, [loadEarnings])
  );

  const totals = useMemo(() => {
    return earnings.reduce(
      (acc, row) => {
        acc.interest += row.interestEarned;
        acc.tds += row.tdsDeducted;
        acc.net += row.netPayout;
        return acc;
      },
      { interest: 0, tds: 0, net: 0 }
    );
  }, [earnings]);

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.title}>Earnings</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Monthly interest, TDS & net payout
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.bellBtn}
            activeOpacity={0.7}
            onPress={openNotifications}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.textPrimary}
            />
            {hasUnread ? <View style={styles.notifBadge} /> : null}
          </TouchableOpacity>
          <ProfileAvatar source={avatarSource} size={36} showChevron />
        </View>
      </View>

      <FlatList
        data={earnings}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {!isLoading && earnings.length > 0 ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Lifetime totals</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Interest earned</Text>
                  <Text style={styles.summaryValue}>
                    {formatInr(totals.interest)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>TDS deducted</Text>
                  <Text style={[styles.summaryValue, styles.summaryTds]}>
                    {formatInr(totals.tds)}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryRowLast]}>
                  <Text style={styles.summaryNetLabel}>Net payout</Text>
                  <Text style={styles.summaryNetValue}>
                    {formatInr(totals.net)}
                  </Text>
                </View>
              </View>
            ) : null}

            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null}

            {loadError ? (
              <Text style={styles.errorText}>{loadError}</Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => <EarningCard earning={item} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="wallet-outline"
                  size={28}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>No earnings yet</Text>
              <Text style={styles.emptyText}>
                Monthly interest credits will appear here after your first
                30-day period completes.
              </Text>
            </View>
          ) : null
        }
      />
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
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.screen,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: spacing.screen,
    paddingTop: 14,
    paddingBottom: 24,
    flexGrow: 1,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryRowLast: {
    marginBottom: 0,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryTds: {
    color: colors.danger,
  },
  summaryNetLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryNetValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  loadingRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    marginBottom: 12,
  },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
