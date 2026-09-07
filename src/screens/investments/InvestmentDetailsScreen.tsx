import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DetailMetricCard from '../../components/DetailMetricCard';
import ProfileAvatar from '../../components/ProfileAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationBell } from '../../hooks/useNotificationBell';
import { getInvestmentByIdForUser } from '../../services/investmentService';
import { Investment } from '../../types/investment';
import { AddFundsStackScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme/colors';
import { DEFAULT_PROFILE_AVATAR } from '../../constants/brandAssets';

const avatarSource = DEFAULT_PROFILE_AVATAR;

type Props = AddFundsStackScreenProps<'InvestmentDetails'>;

export default function InvestmentDetailsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { hasUnread, openNotifications } = useNotificationBell();
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadInvestment = useCallback(async () => {
    const investmentId = route.params.investmentId;
    const userId = session?.user?.id;

    setIsLoading(true);
    setLoadError(null);

    if (!userId) {
      setInvestment(null);
      setLoadError('Please sign in to view investment details.');
      setIsLoading(false);
      return;
    }

    try {
      const fromDb = await getInvestmentByIdForUser(userId, investmentId);
      setInvestment(fromDb);
      if (!fromDb) {
        setLoadError('Investment not found.');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load investment.';
      setLoadError(message);
      setInvestment(null);
    } finally {
      setIsLoading(false);
    }
  }, [route.params.investmentId, session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadInvestment();
    }, [loadInvestment])
  );

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MyInvestments');
    }
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={goBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.code} numberOfLines={1}>
            {investment?.code ?? 'Investment'}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {investment?.detailSubtitle ?? investment?.name ?? ''}
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={colors.primarySoft} />
          </View>
        ) : null}

        {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}

        {investment ? (
          <View style={styles.grid}>
            <DetailMetricCard
              label="PRINCIPAL"
              value={investment.invested ?? '—'}
            />
            <DetailMetricCard
              label="INTEREST RATE"
              value={investment.yieldRate ?? '—'}
            />
            <DetailMetricCard
              label="TDS DEDUCTED"
              value={investment.tdsDeducted ?? '—'}
            />
            <DetailMetricCard
              label="NET EARNED"
              value={investment.netEarned ?? '—'}
              valueColor={colors.success}
            />
          </View>
        ) : null}
      </ScrollView>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 10,
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
  code: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: 16,
    paddingBottom: 24,
  },
  loadingWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
