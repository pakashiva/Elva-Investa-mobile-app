import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DocumentUploadValue } from '../../types/registrationForm';
import { authColors } from '../../theme/authColors';

type Props = {
  label: string;
  value: DocumentUploadValue;
  onPress: () => void;
  loading?: boolean;
  error?: string;
  compact?: boolean;
};

export default function DocumentUploadField({
  label,
  value,
  onPress,
  loading,
  error,
  compact,
}: Props) {
  const hasImage = Boolean(value.uri);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.uploadBox,
          compact && styles.uploadBoxCompact,
          hasImage && styles.uploadBoxSelected,
          error ? styles.uploadBoxError : null,
        ]}
        activeOpacity={0.8}
        onPress={onPress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={authColors.header} />
        ) : hasImage ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: value.uri! }} style={styles.preview} />
            <View style={styles.previewMeta}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={authColors.header}
              />
              <Text style={styles.fileName} numberOfLines={2}>
                {value.fileName}
              </Text>
              <Text style={styles.replaceText}>Tap to replace</Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderWrap}>
            <Ionicons
              name="cloud-upload-outline"
              size={compact ? 18 : 20}
              color={authColors.header}
            />
            <Text style={styles.fileName} numberOfLines={2}>
              {value.fileName}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  wrapCompact: {
    flex: 1,
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: authColors.textDark,
    marginBottom: 8,
  },
  labelCompact: {
    fontSize: 13,
  },
  uploadBox: {
    minHeight: 72,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C5CAD3',
    borderRadius: 10,
    backgroundColor: '#FAFBFC',
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  uploadBoxCompact: {
    minHeight: 88,
  },
  uploadBoxSelected: {
    borderStyle: 'solid',
    borderColor: authColors.header,
    backgroundColor: '#FFFFFF',
  },
  uploadBoxError: {
    borderColor: '#FF3B30',
  },
  placeholderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  preview: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#EEF0F4',
  },
  previewMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: authColors.textDark,
  },
  replaceText: {
    fontSize: 11,
    color: authColors.textMuted,
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    color: '#FF3B30',
  },
});
