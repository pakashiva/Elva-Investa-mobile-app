import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WithdrawalsScreen from '../screens/withdrawals/WithdrawalsScreen';
import CreateWithdrawalRequestScreen from '../screens/withdrawals/CreateWithdrawalRequestScreen';
import WithdrawalDetailsScreen from '../screens/withdrawals/WithdrawalDetailsScreen';
import { WithdrawalsStackParamList } from './types';

const Stack = createNativeStackNavigator<WithdrawalsStackParamList>();

export default function WithdrawalsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WithdrawalsList" component={WithdrawalsScreen} />
      <Stack.Screen
        name="CreateWithdrawalRequest"
        component={CreateWithdrawalRequestScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="WithdrawalDetails"
        component={WithdrawalDetailsScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
