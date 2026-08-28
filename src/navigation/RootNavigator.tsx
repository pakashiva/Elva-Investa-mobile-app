import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import SignInScreen from '../screens/auth/SignInScreen';
import CreateAccountScreen from '../screens/auth/CreateAccountScreen';
import VerifyMobileNumberScreen from '../screens/auth/VerifyMobileNumberScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SignIn"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen
          name="CreateAccount"
          component={CreateAccountScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="VerifyMobileNumber"
          component={VerifyMobileNumberScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
