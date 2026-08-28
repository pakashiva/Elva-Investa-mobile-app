import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TransactionCard from '../../components/TransactionCard';
import { DUMMY_TRANSACTIONS } from '../../data/transactions';
import { MoreStackScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme/colors';

const avatarSource = require('../../../assets/avatar.png');

type Props = MoreStackScreenProps<'Transactions'>;

export default function TransactionsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

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
          <Text style={styles.title}>Transactions</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Real-time payout records & logs
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

      <FlatList
        data={DUMMY_TRANSACTIONS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.searchRow}>
            <View style={styles.searchField}>
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.textMuted}
              />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search TXN ID..."
                placeholderTextColor={colors.textMuted}
                // Search filtering will be connected to backend later
                autoCorrect={false}
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity
              style={styles.filterBtn}
              activeOpacity={0.75}
              // Filter functionality will be implemented later
              onPress={() => {}}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => <TransactionCard transaction={item} />}
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
  listContent: {
    paddingHorizontal: spacing.screen,
    paddingTop: 14,
    paddingBottom: 24,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchField: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
