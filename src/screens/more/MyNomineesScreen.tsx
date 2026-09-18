import React, { useCallback, useState } from 'react';
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
import NomineeCard from '../../components/NomineeCard';
import ProfileAvatar from '../../components/ProfileAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationBell } from '../../hooks/useNotificationBell';
import { getUserNomineesList } from '../../services/nomineeService';
import { NomineeListItem } from '../../types/nominee';
import { isMissingTableError } from '../../utils/supabaseErrors';
import { MoreStackScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme/colors';
import { DEFAULT_PROFILE_AVATAR } from '../../constants/brandAssets';

const avatarSource = DEFAULT_PROFILE_AVATAR;

type Props = MoreStackScreenProps<'MyNominees'>;

export default function MyNomineesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { hasUnread, openNotifications } = useNotificationBell();
  const [nominees, setNominees] = useState<NomineeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadNominees = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setNominees([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await getUserNomineesList(userId);
      setNominees(data);
    } catch (error) {
      if (isMissingTableError(error)) {
        setNominees([]);
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Failed to load nominees.';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadNominees();
    }, [loadNominees])
  );

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
          <Text style={styles.title}>Nominees</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Manage nominees for your investments.
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
          <ProfileAvatar source={avatarSource} size={36} />
        </View>
      </View>

      <FlatList
        data={nominees}
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
                Nominee details are encrypted and used only for succession
                servicing on your investments.
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Nominees</Text>
              <TouchableOpacity
                style={styles.addBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('AddNominee')}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add Nominee</Text>
              </TouchableOpacity>
            </View>

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
        renderItem={({ item }) => <NomineeCard nominee={item} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No nominees found</Text>
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
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
