import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { getHomeSummary } from '../../services/homeService';
import { getUserProfileDetails } from '../../services/profileService';
import { UserProfileDetails } from '../../types/profile';
import { formatInr } from '../../utils/currency';
import { formatPercent } from '../../utils/homeFormat';
import {
  formatDisplayValue,
  formatLastSignIn,
  getProfileInitials,
} from '../../utils/profileFormat';
import { isMissingTableError } from '../../utils/supabaseErrors';
import { MoreStackScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme/colors';

import { BRAND_LOGO_MARK } from '../../constants/brandAssets';

const avatarSource = BRAND_LOGO_MARK;

const SECURITY_CAPTION = 'Verify log-in requests via OTP SMS';
const RECENT_LOGIN_DEVICE = 'Mobile App';

type Props = MoreStackScreenProps<'MyProfile'>;

type PortfolioDisplay = {
  totalInvested: string;
  currentReturns: string;
  cagrYield: string;
};

const EMPTY_PORTFOLIO: PortfolioDisplay = {
  totalInvested: formatInr(0),
  currentReturns: formatInr(0),
  cagrYield: formatPercent(0),
};

export default function MyProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfileDetails | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioDisplay>(EMPTY_PORTFOLIO);
  const [recentLoginAt, setRecentLoginAt] = useState('—');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [twoFactorOn, setTwoFactorOn] = useState(false);

  const loadProfile = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setProfile(null);
      setPortfolio(EMPTY_PORTFOLIO);
      setRecentLoginAt('—');
      setIsLoading(false);
      setLoadError('Please sign in to view your profile.');
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    setRecentLoginAt(formatLastSignIn(session.user.last_sign_in_at));

    try {
      const [profileData, summary] = await Promise.all([
        getUserProfileDetails(userId, session.user.email),
        getHomeSummary(userId),
      ]);

      if (!profileData) {
        setProfile(null);
        setPortfolio(EMPTY_PORTFOLIO);
        setLoadError('Profile not found. Please complete registration.');
        return;
      }

      setProfile(profileData);
      setPortfolio({
        totalInvested: formatInr(summary.totalInvested),
        currentReturns: formatInr(summary.currentTotalReturns),
        cagrYield: formatPercent(summary.totalGainPercent),
      });
    } catch (error) {
      if (isMissingTableError(error)) {
        setProfile(null);
        setPortfolio(EMPTY_PORTFOLIO);
        setLoadError('Profile is unavailable right now.');
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Failed to load profile.';
      console.error('MyProfile load error:', message);
      setProfile(null);
      setPortfolio(EMPTY_PORTFOLIO);
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.email, session?.user?.id, session?.user?.last_sign_in_at]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const initials = profile ? getProfileInitials(profile.fullName) : '—';
  const displayName = profile?.fullName ?? '—';

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
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Manage security and portfolio summaries
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.textPrimary}
            />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileRow} activeOpacity={0.7}>
            <Image
              source={avatarSource}
              style={styles.avatar}
              resizeMode="contain"
            />
            <Ionicons name="chevron-down" size={14} color="#5A6577" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : null}

      {!isLoading && loadError ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      ) : null}

      {!isLoading && profile ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile summary */}
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <View style={styles.initialsCircle}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
              <View style={styles.summaryInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{displayName}</Text>
                  {profile.verified ? (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.customerId}>—</Text>
              </View>
            </View>
          </View>

          {/* Portfolio Performance */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Portfolio Performance</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Total Invested</Text>
              <Text style={[styles.metricValue, styles.valuePrimary]}>
                {portfolio.totalInvested}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Current Returns</Text>
              <Text style={[styles.metricValue, styles.valueSuccess]}>
                {portfolio.currentReturns}
              </Text>
            </View>
            <View style={[styles.metricRow, styles.metricRowLast]}>
              <Text style={styles.metricLabel}>CAGR Yield</Text>
              <Text style={[styles.metricValue, styles.valueYield]}>
                {portfolio.cagrYield}
              </Text>
            </View>
          </View>

          {/* Personal Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>FULL NAME</Text>
              <Text style={styles.infoValue}>{profile.fullName}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>PAN NUMBER</Text>
              <Text style={styles.infoValue}>
                {formatDisplayValue(profile.panNumber)}
              </Text>
            </View>
            <View style={[styles.infoBlock, styles.infoBlockLast]}>
              <Text style={styles.infoLabel}>DATE OF BIRTH</Text>
              <Text style={styles.infoValue}>{profile.dateOfBirth}</Text>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Contact Information</Text>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>EMAIL ADDRESS</Text>
              <Text style={styles.infoValue}>
                {formatDisplayValue(profile.emailAddress)}
              </Text>
            </View>
            <View style={[styles.infoBlock, styles.infoBlockLast]}>
              <Text style={styles.infoLabel}>PHONE NUMBER</Text>
              <Text style={styles.infoValue}>
                {formatDisplayValue(profile.mobileNumber)}
              </Text>
            </View>
          </View>

          {/* Security Settings */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Security Settings</Text>

            <View style={styles.securityRow}>
              <View style={styles.securityTextWrap}>
                <Text style={styles.securityTitle}>Two-Factor Authentication</Text>
                <Text style={styles.securityCaption}>{SECURITY_CAPTION}</Text>
              </View>
              <Switch
                value={twoFactorOn}
                onValueChange={setTwoFactorOn}
                trackColor={{ false: '#D0D5DD', true: colors.primarySoft }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D0D5DD"
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.securityTitle}>Recent Login History</Text>
            <View style={styles.loginRow}>
              <Text style={styles.loginDevice}>{RECENT_LOGIN_DEVICE}</Text>
              <Text style={styles.loginAt}>{recentLoginAt}</Text>
            </View>
          </View>
        </ScrollView>
      ) : null}
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
    lineHeight: 20,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  initialsCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  verifiedBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.successText,
  },
  customerId: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricRowLast: {
    marginBottom: 0,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  valuePrimary: {
    color: colors.primary,
  },
  valueSuccess: {
    color: colors.success,
  },
  valueYield: {
    color: colors.yield,
  },
  infoBlock: {
    marginBottom: 14,
  },
  infoBlockLast: {
    marginBottom: 0,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  securityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  securityCaption: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
    marginVertical: 14,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  loginDevice: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  loginAt: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
