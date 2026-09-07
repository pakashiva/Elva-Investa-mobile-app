import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileAvatar from './ProfileAvatar';
import { DEFAULT_PROFILE_AVATAR } from '../constants/brandAssets';
import { colors } from '../theme/colors';

type Props = {
  avatarSource?: ImageSourcePropType;
  onBellPress?: () => void;
  onProfilePress?: () => void;
  showBadge?: boolean;
};

export default function HeaderActions({
  avatarSource = DEFAULT_PROFILE_AVATAR,
  onBellPress,
  onProfilePress,
  showBadge = false,
}: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.bellBtn}
        activeOpacity={0.7}
        onPress={onBellPress}
      >
        <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
        {showBadge ? <View style={styles.badge} /> : null}
      </TouchableOpacity>
      <ProfileAvatar
        source={avatarSource}
        size={40}
        showChevron
        onPress={onProfilePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
});
