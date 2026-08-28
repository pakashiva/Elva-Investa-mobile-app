import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { InvestmentFilter } from '../types/investment';
import { colors } from '../theme/colors';

type Props = {
  filters: InvestmentFilter[];
  active: InvestmentFilter;
  onChange: (filter: InvestmentFilter) => void;
};

export default function FilterChips({ filters, active, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {filters.map((filter) => {
        const selected = filter === active;
        return (
          <TouchableOpacity
            key={filter}
            style={[styles.chip, selected && styles.chipActive]}
            activeOpacity={0.8}
            onPress={() => onChange(filter)}
          >
            <Text style={[styles.chipText, selected && styles.chipTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6577',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
