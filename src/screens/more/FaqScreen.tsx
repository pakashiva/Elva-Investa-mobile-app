import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FaqAccordionItem from '../../components/faq/FaqAccordionItem';
import { FAQ_CATEGORIES } from '../../data/faq';
import { MoreStackScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme/colors';

type Props = MoreStackScreenProps<'FAQ'>;

export default function FaqScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleItem = (itemId: string) => {
    setExpandedId((current) => (current === itemId ? null : itemId));
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>FAQ</Text>
          <Text style={styles.subtitle}>
            Answers to common questions about investing, withdrawals, and your
            account.
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {FAQ_CATEGORIES.map((category) => (
          <View key={category.id} style={styles.section}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIcon}>
                <Ionicons
                  name={category.icon}
                  size={18}
                  color={colors.primarySoft}
                />
              </View>
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </View>

            <View style={styles.categoryCard}>
              {category.items.map((item, index) => (
                <FaqAccordionItem
                  key={item.id}
                  question={item.question}
                  answer={item.answer}
                  expanded={expandedId === item.id}
                  onToggle={() => toggleItem(item.id)}
                  showDivider={index < category.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.screen,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerSpacer: {
    width: 36,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: 18,
    paddingBottom: 28,
  },
  section: {
    marginBottom: 18,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0EBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.textPrimary,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
});
