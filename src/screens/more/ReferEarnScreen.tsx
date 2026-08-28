import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  REFERRAL_LINK,
  REFERRAL_STATS,
  REFERRAL_STEPS,
  RECENT_REFERRALS,
} from '../../data/referrals';
import { MoreStackScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme/colors';

const avatarSource = require('../../../assets/avatar.png');
const STAT_GAP = 8;
const STAT_WIDTH =
  (Dimensions.get('window').width - spacing.screen * 2 - STAT_GAP * 2) / 3;

type Props = MoreStackScreenProps<'ReferEarn'>;

export default function ReferEarnScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(REFERRAL_LINK);
    setCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 2000);
  };

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
          <Text style={styles.title}>Refer & Earn</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Invite partners and earn premium commissions
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
            <Image source={avatarSource} style={styles.avatar} />
            <Ionicons name="chevron-down" size={14} color="#5A6577" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#7C5CFC', '#5B7CFF', '#6B4CFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <Text style={styles.bannerTitle}>
            Get 1% flat cash bonus on initial investments
          </Text>
          <Text style={styles.bannerSubtitle}>
            Share the trust. Payout directly loaded onto your active ledger.
          </Text>

          <View style={styles.linkRow}>
            <Text style={styles.linkText} numberOfLines={1}>
              {REFERRAL_LINK}
            </Text>
            <TouchableOpacity
              style={[styles.copyBtn, copied && styles.copyBtnDone]}
              activeOpacity={0.85}
              onPress={handleCopy}
            >
              <Text style={styles.copyBtnText}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          {REFERRAL_STATS.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statFooter}>{stat.footer}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsCard}>
          {REFERRAL_STEPS.map((step, index) => (
            <View
              key={step.step}
              style={[
                styles.stepRow,
                index < REFERRAL_STEPS.length - 1 && styles.stepRowSpaced,
              ]}
            >
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>{step.step}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Referrals</Text>
        {RECENT_REFERRALS.map((item) => (
          <View key={item.id} style={styles.recentCard}>
            <View style={styles.recentLeft}>
              <Text style={styles.recentName}>{item.name}</Text>
              <Text style={styles.recentMeta}>{item.meta}</Text>
            </View>
            <Text style={styles.recentAmount}>{item.amount}</Text>
          </View>
        ))}
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
    backgroundColor: '#D0D5DD',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: 14,
    paddingBottom: 28,
  },
  banner: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 14,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
    marginBottom: 16,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 20, 80, 0.45)',
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  copyBtn: {
    backgroundColor: colors.investBtn,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyBtnDone: {
    backgroundColor: '#B8F0D0',
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: STAT_GAP,
    marginBottom: 20,
  },
  statCard: {
    width: STAT_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statFooter: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepRowSpaced: {
    marginBottom: 16,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF3CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B8860B',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  recentLeft: {
    flex: 1,
    paddingRight: 12,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  recentMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  recentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.success,
  },
});
