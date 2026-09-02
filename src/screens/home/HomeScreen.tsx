import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PerformanceChart from '../../components/PerformanceChart';
import { useAuth } from '../../contexts/AuthContext';
import { getProfileFullName } from '../../services/profileService';
import {
  EMPTY_HOME_SUMMARY,
  getHomeSummary,
  HomeSummary,
} from '../../services/homeService';
import { formatInr } from '../../utils/currency';
import {
  formatGainFooter,
  formatInvestmentCountFooter,
  formatPaidWithdrawalFooter,
} from '../../utils/homeFormat';
import { isMissingTableError } from '../../utils/supabaseErrors';
import { MainTabParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = spacing.screen;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - CARD_GAP) / 2;
import { BRAND_LOGO_MARK } from '../../constants/brandAssets';

const avatarSource = BRAND_LOGO_MARK;

type HomeNav = BottomTabNavigationProp<MainTabParamList, 'Home'>;

const SUMMARY_CARD_CONFIG = [
  {
    id: 'invested',
    label: 'Total Invested',
    footerColor: colors.textSecondary,
    iconBg: '#EDE7FF',
    icon: 'wallet-outline' as const,
    iconLib: 'ion' as const,
    iconColor: colors.primarySoft,
  },
  {
    id: 'returns',
    label: 'Current Returns',
    footerColor: colors.success,
    iconBg: colors.successBg,
    icon: 'trending-up' as const,
    iconLib: 'feather' as const,
    iconColor: colors.success,
  },
  {
    id: 'maturity',
    label: 'Maturity Value',
    footerColor: colors.textSecondary,
    iconBg: '#E8F0FF',
    icon: 'flag-outline' as const,
    iconLib: 'ion' as const,
    iconColor: '#5B8DEF',
  },
  {
    id: 'withdrawn',
    label: 'Total Withdrawn',
    footerColor: colors.textSecondary,
    iconBg: '#EEF0F3',
    icon: 'arrow-up-circle-outline' as const,
    iconLib: 'ion' as const,
    iconColor: '#9AA3B2',
  },
] as const;

function CardIcon({
  iconLib,
  icon,
  iconColor,
}: {
  iconLib: 'ion' | 'feather';
  icon: string;
  iconColor: string;
}) {
  if (iconLib === 'feather') {
    return <Feather name={icon as 'trending-up'} size={18} color={iconColor} />;
  }
  return <Ionicons name={icon as 'wallet-outline'} size={18} color={iconColor} />;
}

function buildSummaryCards(summary: HomeSummary, isLoading: boolean) {
  const loadingValue = '—';

  return SUMMARY_CARD_CONFIG.map((card) => {
    switch (card.id) {
      case 'invested':
        return {
          ...card,
          value: isLoading ? loadingValue : formatInr(summary.totalInvested),
          footer: isLoading
            ? 'Loading...'
            : formatInvestmentCountFooter(summary.activeInvestmentCount),
        };
      case 'returns':
        return {
          ...card,
          value: isLoading ? loadingValue : formatInr(summary.currentTotalReturns),
          footer: isLoading
            ? 'Loading...'
            : formatGainFooter(summary.totalGainPercent),
        };
      case 'maturity':
        return {
          ...card,
          value: isLoading ? loadingValue : formatInr(summary.maturityValue),
          footer: 'projected yield',
        };
      case 'withdrawn':
        return {
          ...card,
          value: isLoading ? loadingValue : formatInr(summary.totalWithdrawals),
          footer: isLoading
            ? 'Loading...'
            : formatPaidWithdrawalFooter(summary.paidWithdrawalCount),
        };
    }
  });
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNav>();
  const { session } = useAuth();
  const [range, setRange] = useState<'1Y' | 'ALL'>('1Y');
  const [displayName, setDisplayName] = useState('there');
  const [summary, setSummary] = useState<HomeSummary>(EMPTY_HOME_SUMMARY);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const userId = session?.user?.id;

    if (!userId) {
      setDisplayName('there');
      return () => {
        mounted = false;
      };
    }

    getProfileFullName(userId)
      .then((name) => {
        if (mounted && name) {
          setDisplayName(name);
        }
      })
      .catch((error) => {
        console.warn('Failed to load profile name:', error.message);
      });

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  const loadHomeSummary = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setSummary(EMPTY_HOME_SUMMARY);
      setIsSummaryLoading(false);
      return;
    }

    setIsSummaryLoading(true);
    setSummaryError(null);

    try {
      const data = await getHomeSummary(userId);
      setSummary(data);
    } catch (error) {
      if (isMissingTableError(error)) {
        setSummary(EMPTY_HOME_SUMMARY);
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Failed to load home summary.';
      console.warn('Home summary load error:', message);
      setSummaryError(message);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadHomeSummary();
    }, [loadHomeSummary])
  );

  const summaryCards = useMemo(
    () => buildSummaryCards(summary, isSummaryLoading),
    [summary, isSummaryLoading]
  );

  const handleInvestNow = () => {
    navigation.navigate('AddFunds', { screen: 'NewFundRequest' });
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.greeting}>
              Hi, {displayName}! <Text style={styles.wave}>👋</Text>
            </Text>
            <Text style={styles.subtitle}>
              Here's what's happening with your investments
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.textPrimary}
              />
              <View style={styles.badge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileRow} activeOpacity={0.7}>
              <Image
                source={avatarSource}
                style={styles.avatar}
                resizeMode="contain"
              />
              <Ionicons name="chevron-down" size={16} color="#5A6577" />
            </TouchableOpacity>
          </View>
        </View>

        {summaryError ? (
          <Text style={styles.errorText}>{summaryError}</Text>
        ) : null}

        <View style={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <View key={card.id} style={styles.summaryCard}>
              <View style={styles.summaryCardTop}>
                <View
                  style={[styles.summaryIconWrap, { backgroundColor: card.iconBg }]}
                >
                  <CardIcon
                    iconLib={card.iconLib}
                    icon={card.icon}
                    iconColor={card.iconColor}
                  />
                </View>
                <Text style={styles.summaryLabel} numberOfLines={1}>
                  {card.label}
                </Text>
              </View>
              {isSummaryLoading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primarySoft}
                  style={styles.summaryLoader}
                />
              ) : (
                <Text style={styles.summaryValue}>{card.value}</Text>
              )}
              <Text style={[styles.summaryFooter, { color: card.footerColor }]}>
                {card.footer}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.performanceCard}>
          <View style={styles.performanceHeader}>
            <View style={styles.performanceTitles}>
              <Text style={styles.performanceTitle}>Investment Performance</Text>
              <Text style={styles.performanceSubtitle}>
                Portfolio growth over time
              </Text>
            </View>
            <View style={styles.rangeToggle}>
              <TouchableOpacity onPress={() => setRange('1Y')} activeOpacity={0.7}>
                <Text
                  style={[
                    styles.rangeText,
                    range === '1Y' && styles.rangeTextActive,
                  ]}
                >
                  1Y
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRange('ALL')} activeOpacity={0.7}>
                <Text
                  style={[
                    styles.rangeText,
                    range === 'ALL' && styles.rangeTextActive,
                  ]}
                >
                  ALL
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <PerformanceChart range={range} />

          <View style={styles.statRows}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Best Performer</Text>
              <Text style={styles.statValue}>Growth Plus (5% p.a.)</Text>
            </View>
            <View style={[styles.statRow, styles.statRowLast]}>
              <Text style={styles.statLabel}>Average Return</Text>
              <Text style={styles.statValue}>11.2% CAGR</Text>
            </View>
          </View>
        </View>

        <LinearGradient
          colors={[...colors.promo]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.promoBanner}
        >
          <View style={styles.promoTextWrap}>
            <Text style={styles.promoTitle}>
              Grow your wealth, secure your future
            </Text>
            <Text style={styles.promoSubtitle}>
              Discover bespoke investment solutions customized for your growth.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.investBtn}
            activeOpacity={0.85}
            onPress={handleInvestNow}
          >
            <Text style={styles.investBtnText}>Invest Now</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  wave: {
    fontSize: 20,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 2,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 9,
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
    gap: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    marginBottom: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: 16,
  },
  summaryCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  summaryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  summaryLoader: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  summaryFooter: {
    fontSize: 12,
    fontWeight: '500',
  },
  performanceCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    marginBottom: 16,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  performanceTitles: {
    flex: 1,
    paddingRight: 8,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  performanceSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  rangeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 2,
  },
  rangeText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  rangeTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  statRows: {
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  statRowLast: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  promoBanner: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  promoTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 21,
    marginBottom: 6,
  },
  promoSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 16,
  },
  investBtn: {
    backgroundColor: colors.investBtn,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  investBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
