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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BankAccountCard from '../../components/BankAccountCard';
import { DUMMY_BANK_ACCOUNTS_LIST } from '../../data/bankAccounts';
import { MoreStackScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme/colors';

const avatarSource = require('../../../assets/avatar.png');

type Props = MoreStackScreenProps<'MyBankAccounts'>;

export default function MyBankAccountsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

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
          <Text style={styles.title}>My Bank Accounts</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Manage your verified destination accounts.
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
          <Image source={avatarSource} style={styles.avatar} />
        </View>
      </View>

      <FlatList
        data={DUMMY_BANK_ACCOUNTS_LIST}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.securityBanner}>
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={colors.successText}
              />
              <Text style={styles.securityText}>
                Your bank details are fully encrypted and protected using
                multi-party security layers.
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Verified Accounts</Text>
              <TouchableOpacity
                style={styles.addBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('AddBankAccount')}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => <BankAccountCard account={item} />}
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
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D0D5DD',
  },
  listContent: {
    paddingHorizontal: spacing.screen,
    paddingTop: 14,
    paddingBottom: 24,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: '#B7E4C7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 18,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.successText,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
