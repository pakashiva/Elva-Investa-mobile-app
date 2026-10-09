import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BrandLogo from '../../components/auth/BrandLogo';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    session,
    unlockWindowValid,
    isUnlockLoading,
    isVerificationLoading,
    mobileVerified,
    otpFlow,
  } = useAuth();

  useEffect(() => {
    if (isUnlockLoading || isVerificationLoading) {
      return;
    }

    const timer = setTimeout(() => {
      if (!session) {
        navigation.replace('SignIn');
        return;
      }

      const needsRegistrationOtp =
        (otpFlow === 'registration' || mobileVerified === false) &&
        session.customer?.mobileVerified !== true;

      if (needsRegistrationOtp) {
        navigation.replace('VerifyMobileNumber', {
          mode: 'registration',
          sendOtp: true,
        });
        return;
      }

      if (unlockWindowValid === true) {
        navigation.replace('MpinLock');
        return;
      }

      navigation.replace('SignIn');
    }, 1800);

    return () => clearTimeout(timer);
  }, [
    navigation,
    session,
    unlockWindowValid,
    isUnlockLoading,
    isVerificationLoading,
    mobileVerified,
    otpFlow,
  ]);

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <BrandLogo size={220} />
        <ActivityIndicator
          size="small"
          color="#22C55E"
          style={styles.loader}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loader: {
    marginTop: 8,
  },
});
