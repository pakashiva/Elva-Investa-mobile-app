import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export type SelectOption = {
  id: string;
  label: string;
};

type Props = {
  label: string;
  required?: boolean;
  labelIcon?: React.ReactNode;
  placeholder: string;
  value: string | null;
  options: SelectOption[];
  onChange: (id: string) => void;
  /** When false, field shows value but is not tappable (e.g. auto paydate) */
  editable?: boolean;
  /** Softer grey label used on some forms */
  mutedLabel?: boolean;
};

export default function FormSelectField({
  label,
  required,
  labelIcon,
  placeholder,
  value,
  options,
  onChange,
  editable = true,
  mutedLabel = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);
  const display = selected?.label ?? (value && !options.length ? value : null);

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        {labelIcon}
        <Text style={[styles.label, mutedLabel && styles.labelMuted]}>
          {label}
          {required ? <Text style={styles.asterisk}> *</Text> : null}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.field, !editable && styles.fieldReadonly]}
        activeOpacity={editable ? 0.75 : 1}
        onPress={() => {
          if (editable) setOpen(true);
        }}
        disabled={!editable}
      >
        <Text
          style={[styles.fieldText, !display && styles.placeholder]}
          numberOfLines={1}
        >
          {display ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label.replace(/\s*\*$/, '')}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  activeOpacity={0.7}
                  onPress={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  {value === item.id ? (
                    <Ionicons name="checkmark" size={18} color={colors.primarySoft} />
                  ) : null}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  labelMuted: {
    fontWeight: '500',
    color: colors.textSecondary,
  },
  asterisk: {
    color: colors.danger,
    fontWeight: '700',
  },
  field: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldReadonly: {
    backgroundColor: '#FAFBFC',
  },
  fieldText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingRight: 8,
  },
  placeholder: {
    color: colors.textMuted,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '50%',
    paddingBottom: 24,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  optionText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
});
