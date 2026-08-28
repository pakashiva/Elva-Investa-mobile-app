import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WithdrawalCard from '../../components/WithdrawalCard';
import { DUMMY_WITHDRAWALS } from '../../data/withdrawals';
import { WithdrawalsStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme/colors';

const avatarSource = require('../../../assets/avatar.png');

type Nav = NativeStackNavigationProp<
  WithdrawalsStackParamList,
  'WithdrawalsList'
>;

export default function WithdrawalsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <FlatList
        data={DUMMY_WITHDRAWALS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.headerTextWrap}>
                <Text style={styles.title}>Withdrawals</Text>
                <Text style={styles.subtitle}>
                  View and manage your payout requests
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

            <TouchableOpacity
              style={styles.newBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CreateWithdrawalRequest')}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.newBtnText}>New Request</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => <WithdrawalCard withdrawal={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 14,
    gap: 8,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
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
    gap: 8,
    paddingTop: 2,
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
  newBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    marginBottom: 16,
  },
  newBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
