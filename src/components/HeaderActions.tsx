import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = {
  avatarSource: ImageSourcePropType;
  onBellPress?: () => void;
  onProfilePress?: () => void;
};

export default function HeaderActions({
  avatarSource,
  onBellPress,
  onProfilePress,
}: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.bellBtn}
        activeOpacity={0.7}
        onPress={onBellPress}
      >
        <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
        <View style={styles.badge} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.profileRow}
        activeOpacity={0.7}
        onPress={onProfilePress}
      >
        <Image source={avatarSource} style={styles.avatar} resizeMode="contain" />
        <Ionicons name="chevron-down" size={16} color="#5A6577" />
      </TouchableOpacity>
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
});
