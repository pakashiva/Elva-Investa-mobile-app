import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { InvestmentEarningsProvider } from './src/contexts/InvestmentEarningsContext';
import { NotificationRealtimeProvider } from './src/contexts/NotificationRealtimeContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <InvestmentEarningsProvider>
          <NotificationRealtimeProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </NotificationRealtimeProvider>
        </InvestmentEarningsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}