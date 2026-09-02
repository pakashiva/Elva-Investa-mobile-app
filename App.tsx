import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { InvestmentEarningsProvider } from './src/contexts/InvestmentEarningsContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <InvestmentEarningsProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </InvestmentEarningsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}