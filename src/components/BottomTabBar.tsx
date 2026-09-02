import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const TABS = [
  { key: 'Home', label: 'Home' },
  { key: 'AddFunds', label: 'Add Funds' },
  { key: 'Withdrawals', label: 'Withdrawals' },
  { key: 'More', label: 'More' },
] as const;

export default function BottomTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBar,
        { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 10) },
      ]}
    >
      {TABS.map((tab, index) => {
        const isFocused = state.index === index;
        const color = isFocused ? colors.primarySoft : colors.tabInactive;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            activeOpacity={0.7}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: state.routes[index].key,
                canPreventDefault: true,
              });
              if (event.defaultPrevented) {
                return;
              }

              if (tab.key === 'AddFunds') {
                navigation.navigate('AddFunds', { screen: 'MyInvestments' });
                return;
              }

              if (!isFocused) {
                navigation.navigate(tab.key);
              }
            }}
          >
            {tab.key === 'Home' && (
              <Ionicons
                name={isFocused ? 'home' : 'home-outline'}
                size={22}
                color={color}
              />
            )}
            {tab.key === 'AddFunds' && (
              <View
                style={[
                  styles.tabIconCircle,
                  isFocused && styles.tabIconCircleActive,
                  { borderColor: color },
                ]}
              >
                <Ionicons name="add" size={16} color={isFocused ? '#FFF' : color} />
              </View>
            )}
            {tab.key === 'Withdrawals' && (
              <View
                style={[
                  styles.tabIconCircle,
                  isFocused && styles.tabIconCircleActive,
                  { borderColor: color },
                ]}
              >
                <Feather
                  name="arrow-up"
                  size={14}
                  color={isFocused ? '#FFF' : color}
                />
              </View>
            )}
            {tab.key === 'More' && (
              <Ionicons name="menu" size={22} color={color} />
            )}
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E8EAEE',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconCircleActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.tabInactive,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.primarySoft,
    fontWeight: '600',
  },
});
