import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  checkedColor?: string;
  labelColor?: string;
};

export default function FormCheckbox({
  checked,
  onChange,
  label,
  checkedColor = colors.primarySoft,
  labelColor = colors.textPrimary,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.75}
      onPress={() => onChange(!checked)}
    >
      <View
        style={[
          styles.box,
          checked && { backgroundColor: checkedColor, borderColor: checkedColor },
        ]}
      >
        {checked ? (
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        ) : null}
      </View>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  label: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
