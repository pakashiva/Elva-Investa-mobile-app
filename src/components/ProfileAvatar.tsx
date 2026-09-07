import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  StyleProp,
  ImageStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_PROFILE_AVATAR } from '../constants/brandAssets';
import { colors } from '../theme/colors';

type Props = {
  size?: number;
  source?: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  /** Show chevron next to avatar (header pattern) */
  showChevron?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

export default function ProfileAvatar({
  size = 40,
  source = DEFAULT_PROFILE_AVATAR,
  style,
  showChevron = false,
  disabled = false,
  onPress,
}: Props) {
  const content = (
    <>
      <Image
        source={source}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#E8EAED',
            borderWidth: 1,
            borderColor: colors.borderStrong,
          },
          style,
        ]}
        resizeMode="cover"
      />
      {showChevron ? (
        <Ionicons name="chevron-down" size={16} color="#5A6577" />
      ) : null}
    </>
  );

  if (!onPress || disabled) {
    return <View style={styles.triggerRow}>{content}</View>;
  }

  return (
    <TouchableOpacity
      style={styles.triggerRow}
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
