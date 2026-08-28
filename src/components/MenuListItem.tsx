import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuItem } from '../data/menu';
import { colors } from '../theme/colors';

type Props = {
  item: MenuItem;
  showDivider?: boolean;
  onPress?: () => void;
};

export default function MenuListItem({
  item,
  showDivider = true,
  onPress,
}: Props) {
  return (
    <View>
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={onPress}
        disabled={!onPress}
      >
        <Ionicons name={item.icon} size={22} color={colors.primarySoft} />
        <Text style={styles.label}>{item.label}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 14,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
    marginLeft: 52,
  },
});
