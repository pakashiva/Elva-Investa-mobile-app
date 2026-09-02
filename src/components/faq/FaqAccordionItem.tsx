import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

type Props = {
  question: string;
  answer: string;
  expanded: boolean;
  onToggle: () => void;
  showDivider?: boolean;
};

export default function FaqAccordionItem({
  question,
  answer,
  expanded,
  onToggle,
  showDivider = true,
}: Props) {
  return (
    <View style={[styles.wrap, showDivider && styles.wrapDivider]}>
      <TouchableOpacity
        style={styles.header}
        activeOpacity={0.75}
        onPress={onToggle}
      >
        <Text style={styles.question}>{question}</Text>
        <View style={[styles.toggleBtn, expanded && styles.toggleBtnActive]}>
          <Ionicons
            name={expanded ? 'remove' : 'add'}
            size={18}
            color={expanded ? colors.primarySoft : colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.answerWrap}>
          <Text style={styles.answer}>{answer}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 14,
  },
  wrapDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  question: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  toggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  toggleBtnActive: {
    borderColor: '#E8DEFF',
    backgroundColor: '#F3F0FF',
  },
  answerWrap: {
    marginTop: 10,
    paddingLeft: 2,
    paddingRight: 40,
  },
  answer: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
