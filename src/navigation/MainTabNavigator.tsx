import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import AddFundsStackNavigator from './AddFundsStackNavigator';
import WithdrawalsStackNavigator from './WithdrawalsStackNavigator';
import MoreStackNavigator from './MoreStackNavigator';
import BottomTabBar from '../components/BottomTabBar';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="AddFunds" component={AddFundsStackNavigator} />
      <Tab.Screen name="Withdrawals" component={WithdrawalsStackNavigator} />
      <Tab.Screen name="More" component={MoreStackNavigator} />
    </Tab.Navigator>
  );
}
