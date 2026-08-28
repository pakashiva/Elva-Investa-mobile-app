import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DetailMetricCard from '../../components/DetailMetricCard';
import { getInvestmentById } from '../../data/investments';
import { AddFundsStackScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme/colors';

const avatarSource = require('../../../assets/avatar.png');

type Props = AddFundsStackScreenProps<'InvestmentDetails'>;

export default function InvestmentDetailsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const investment = useMemo(
    () => getInvestmentById(route.params.investmentId),
    [route.params.investmentId]
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
        <View style={styles.grid}>
          <DetailMetricCard
            label="PRINCIPAL"
            value={investment?.invested ?? '—'}
          />
          <DetailMetricCard
            label="INTEREST RATE"
            value={investment?.yieldRate ?? '—'}
          />
          <DetailMetricCard
            label="TDS DEDUCTED"
            value={investment?.tdsDeducted ?? '—'}
          />
          <DetailMetricCard
            label="NET EARNED"
            value={investment?.netEarned ?? '—'}
            valueColor={colors.success}
          />
        </View>
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
    backgroundColor: '#D0D5DD',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: 16,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
