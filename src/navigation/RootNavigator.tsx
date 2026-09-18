import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import MainTabNavigator from './MainTabNavigator';
import SplashScreen from '../screens/auth/SplashScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import MpinLockScreen from '../screens/auth/MpinLockScreen';
import CreateAccountScreen from '../screens/auth/CreateAccountScreen';
import VerifyMobileNumberScreen from '../screens/auth/VerifyMobileNumberScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import { navigationRef } from './navigationRef';
import { RootStackParamList } from './types';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();
export { navigationRef };

const OTP_RECOVERY_MODES = new Set([
  'forgotMpin',
  'changeMpin',
  'forgotPassword',
  'changePassword',
]);

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function AuthNavigationHandler() {
  const {
    session,
    isLoading,
    mobileVerified,
    isVerificationLoading,
    otpFlow,
    bypassMobileVerification,
    unlockWindowValid,
    isUnlockLoading,
    appUnlocked,
  } = useAuth();

  useEffect(() => {
    if (isLoading || !navigationRef.isReady()) {
      return;
    }

    const currentRoute = navigationRef.getCurrentRoute()?.name;
    const currentParams = navigationRef.getCurrentRoute()?.params as
      | RootStackParamList['VerifyMobileNumber']
      | undefined;

    const authRoutes = new Set([
      'Splash',
      'SignIn',
      'MpinLock',
      'CreateAccount',
      'VerifyMobileNumber',
    ]);

    if (currentRoute === 'Splash') {
      return;
    }

    const onRecoveryOtp =
      currentRoute === 'VerifyMobileNumber' &&
      currentParams?.mode != null &&
      OTP_RECOVERY_MODES.has(currentParams.mode);

    if (!session) {
      if (onRecoveryOtp) {
        return;
      }

      if (!currentRoute || !authRoutes.has(currentRoute) || currentRoute === 'MpinLock') {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'SignIn' }],
        });
      }
      return;
    }

    if (onRecoveryOtp) {
      return;
    }

    if (bypassMobileVerification) {
      if (currentRoute && authRoutes.has(currentRoute) && appUnlocked) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
      return;
    }

    const needsMobileVerification =
      otpFlow === 'registration' || mobileVerified === false;

    if (needsMobileVerification) {
      if (
        currentRoute !== 'VerifyMobileNumber' ||
        currentParams?.mode !== 'registration'
      ) {
        navigationRef.reset({
          index: 0,
          routes: [
            {
              name: 'VerifyMobileNumber',
              params: { mode: 'registration', sendOtp: true },
            },
          ],
        });
      }
      return;
    }

    if (isVerificationLoading || mobileVerified === null || isUnlockLoading) {
      return;
    }

    if (unlockWindowValid === null) {
      return;
    }

    // Unlock window expired → full credential login (keep session until they sign in again).
    if (unlockWindowValid === false) {
      if (currentRoute !== 'SignIn' && currentRoute !== 'CreateAccount') {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'SignIn' }],
        });
      }
      return;
    }

    // Valid session + unlock window → MPIN every cold start until unlocked.
    if (unlockWindowValid === true && !appUnlocked) {
      if (currentRoute !== 'MpinLock') {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'MpinLock' }],
        });
      }
      return;
    }

    if (currentRoute && authRoutes.has(currentRoute) && appUnlocked) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  }, [
    session,
    isLoading,
    mobileVerified,
    isVerificationLoading,
    otpFlow,
    bypassMobileVerification,
    unlockWindowValid,
    isUnlockLoading,
    appUnlocked,
  ]);

  return null;
}

export default function RootNavigator() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <AuthNavigationHandler />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="MpinLock" component={MpinLockScreen} />
        <Stack.Screen
          name="CreateAccount"
          component={CreateAccountScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="VerifyMobileNumber"
          component={VerifyMobileNumberScreen}
          options={{
            animation: 'slide_from_right',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
