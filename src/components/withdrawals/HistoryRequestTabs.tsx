import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';

type Tab = 'history' | 'request';

type Props = {
  active: Tab;
  onHistory: () => void;
  onRequest: () => void;
};

export default function HistoryRequestTabs({
  active,
  onHistory,
  onRequest,
}: Props) {
  return (
    <View style={styles.track}>
      <TouchableOpacity
        style={[styles.tab, active === 'history' && styles.tabActive]}
        activeOpacity={0.8}
        onPress={onHistory}
      >
        <Text
          style={[styles.tabText, active === 'history' && styles.tabTextActive]}
        >
          History
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, active === 'request' && styles.tabActive]}
        activeOpacity={0.8}
        onPress={onRequest}
      >
        <Text
          style={[styles.tabText, active === 'request' && styles.tabTextActive]}
        >
          Request
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: '#EEF0F4',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primarySoft,
    fontWeight: '700',
  },
});
