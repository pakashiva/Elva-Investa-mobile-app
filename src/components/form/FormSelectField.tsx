import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const selected = options.find((o) => o.id === value);
  const display = selected?.label ?? (value && !options.length ? value : null);

  const sheetMaxHeight = useMemo(
    () => Math.min(windowHeight * 0.6, 420),
    [windowHeight]
  );

  const close = () => setOpen(false);

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
          numberOfLines={2}
        >
          {display ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.overlayDismiss} onPress={close} />
          <View
            style={[
              styles.sheet,
              {
                maxHeight: sheetMaxHeight,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{label.replace(/\s*\*$/, '')}</Text>

            {options.length === 0 ? (
              <Text style={styles.emptyText}>No options available</Text>
            ) : (
              <ScrollView
                bounces={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                style={{ maxHeight: sheetMaxHeight - 72 }}
                contentContainerStyle={styles.optionsContent}
              >
                {options.map((item) => {
                  const isSelected = value === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.option,
                        isSelected && styles.optionSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        onChange(item.id);
                        close();
                      }}
                    >
                      <Text style={styles.optionText}>{item.label}</Text>
                      {isSelected ? (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={colors.primarySoft}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
    zIndex: 1,
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
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    lineHeight: 20,
    color: colors.textPrimary,
    paddingRight: 8,
  },
  placeholder: {
    color: colors.textMuted,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    width: '100%',
    ...Platform.select({
      android: { elevation: 16 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      },
    }),
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginTop: 10,
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  optionsContent: {
    paddingBottom: 8,
  },
  emptyText: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    fontSize: 14,
    color: colors.textSecondary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 12,
  },
  optionSelected: {
    backgroundColor: '#F7F5FF',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
  },
});
