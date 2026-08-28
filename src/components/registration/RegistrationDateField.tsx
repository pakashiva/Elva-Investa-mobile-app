import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { authColors } from '../../theme/authColors';
import { formatDateOfBirth, parseDateOfBirth } from '../../utils/formatDate';

type Props = {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export default function RegistrationDateField({
  label,
  required,
  value,
  onChange,
  error,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const dateValue = parseDateOfBirth(value);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'dismissed' || !selected) {
      return;
    }
    onChange(formatDateOfBirth(selected));
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.asterisk}> *</Text> : null}
      </Text>
      <TouchableOpacity
        style={[styles.field, error ? styles.fieldError : null]}
        activeOpacity={0.75}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.value}>{value}</Text>
        <Ionicons name="calendar-outline" size={20} color={authColors.textMuted} />
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {showPicker ? (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: authColors.textDark,
    marginBottom: 8,
  },
  asterisk: {
    color: '#FF3B30',
    fontWeight: '700',
  },
  field: {
    height: 50,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldError: {
    borderColor: '#FF3B30',
  },
  value: {
    fontSize: 15,
    color: authColors.textDark,
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    color: '#FF3B30',
  },
});
