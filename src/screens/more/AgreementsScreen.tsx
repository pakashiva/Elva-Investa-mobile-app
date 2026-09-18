import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AgreementCard from '../../components/AgreementCard';
import RenewalRequestModal, {
  RenewalSubmitPayload,
} from '../../components/RenewalRequestModal';
import ProfileAvatar from '../../components/ProfileAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationBell } from '../../hooks/useNotificationBell';
import {
  getUserAgreements,
  submitAgreementRenewalRequest,
} from '../../services/agreementService';
import {
  AgreementFilter,
  AgreementListItem,
} from '../../types/agreement';
import { isMissingTableError } from '../../utils/supabaseErrors';
import { MoreStackScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme/colors';
import { DEFAULT_PROFILE_AVATAR } from '../../constants/brandAssets';

const avatarSource = DEFAULT_PROFILE_AVATAR;

const FILTERS: { id: AgreementFilter; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'expired', label: 'Expired' },
  { id: 'all', label: 'All' },
];

type Props = MoreStackScreenProps<'Agreements'>;

export default function AgreementsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { hasUnread, openNotifications } = useNotificationBell();
  const [agreements, setAgreements] = useState<AgreementListItem[]>([]);
  const [filter, setFilter] = useState<AgreementFilter>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AgreementListItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAgreements = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setAgreements([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await getUserAgreements(userId);
      setAgreements(data);
    } catch (error) {
      if (isMissingTableError(error)) {
        setAgreements([]);
        setLoadError(
          'Could not load agreements. Check that your investments are available.'
        );
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Failed to load agreements.';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadAgreements();
    }, [loadAgreements])
  );

  const filtered = useMemo(() => {
    if (filter === 'active') {
      return agreements.filter((item) => item.isActive);
    }
    if (filter === 'expired') {
      return agreements.filter((item) => item.isExpired);
    }
    return agreements;
  }, [agreements, filter]);

  const openRenewal = (agreement: AgreementListItem) => {
    setSelected(agreement);
    setModalVisible(true);
  };

  const closeRenewal = () => {
    if (isSubmitting) return;
    setModalVisible(false);
    setSelected(null);
  };

  const handleSubmitRenewal = async (payload: RenewalSubmitPayload) => {
    const userId = session?.user?.id;
    if (!userId || !selected) {
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAgreementRenewalRequest(userId, {
        investmentId: selected.id,
        mode: payload.mode,
        incrementAmount: payload.incrementAmount,
      });
      setModalVisible(false);
      setSelected(null);
      Alert.alert(
        'Request submitted',
        'Your renewal request has been sent for review.'
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to submit renewal request.';
      Alert.alert('Unable to submit', message);
    } finally {
      setIsSubmitting(false);
    }
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
          <Text style={styles.title}>Agreements</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Manage and renew your fund agreements.
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
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.filterRow}>
              {FILTERS.map((item) => {
                const selectedFilter = filter === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.filterChip,
                      selectedFilter && styles.filterChipActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setFilter(item.id)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        selectedFilter && styles.filterTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
        renderItem={({ item }) => (
          <AgreementCard agreement={item} onRequestRenewal={openRenewal} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {filter === 'active'
                  ? 'No active agreements'
                  : filter === 'expired'
                    ? 'No expired agreements'
                    : 'No agreements found'}
              </Text>
              <Text style={styles.emptyHint}>
                Agreements appear after your fund request is approved.
              </Text>
            </View>
          ) : null
        }
      />

      <RenewalRequestModal
        visible={modalVisible}
        agreement={selected}
        isSubmitting={isSubmitting}
        onClose={closeRenewal}
        onSubmit={handleSubmitRenewal}
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  filterChip: {
    flex: 1,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#EEF0FF',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.primary,
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
    lineHeight: 18,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
