import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import MainTabNavigator from './MainTabNavigator';
import SplashScreen from '../screens/auth/SplashScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import CreateAccountScreen from '../screens/auth/CreateAccountScreen';
import VerifyMobileNumberScreen from '../screens/auth/VerifyMobileNumberScreen';
import { RootStackParamList } from './types';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

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
      'CreateAccount',
      'VerifyMobileNumber',
    ]);

    if (currentRoute === 'Splash') {
      return;
    }

    if (!session) {
      if (
        currentRoute === 'VerifyMobileNumber' &&
        currentParams?.mode === 'forgotPassword'
      ) {
        return;
      }

      if (!currentRoute || !authRoutes.has(currentRoute)) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'SignIn' }],
        });
      }
      return;
    }

    if (
      currentRoute === 'VerifyMobileNumber' &&
      currentParams?.mode === 'forgotPassword'
    ) {
      return;
    }

    if (bypassMobileVerification) {
      if (currentRoute && authRoutes.has(currentRoute)) {
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

    // Profile status still loading — stay on the current screen.
    if (isVerificationLoading || mobileVerified === null) {
      return;
    }

    if (currentRoute && authRoutes.has(currentRoute)) {
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
  ]);

  return null;
}

export default function RootNavigator() {
  const { isLoading } = useAuth();

  // Only block the tree while restoring the auth session.
  // Never unmount NavigationContainer during registration OTP —
  // that was leaving users stuck on a blank spinner.
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
