import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BrandLogo from '../../components/auth/BrandLogo';
import { BRAND_NAME, BRAND_TAGLINE } from '../../constants/brandAssets';
import { RootStackScreenProps } from '../../navigation/types';
import { authColors } from '../../theme/authColors';

type Props = RootStackScreenProps<'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('SignIn');
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <BrandLogo size={112} />
        <Text style={styles.title}>{BRAND_NAME}</Text>
        <Text style={styles.tagline}>{BRAND_TAGLINE}</Text>
        <ActivityIndicator
          size="small"
          color={authColors.gold}
          style={styles.loader}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: authColors.header,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: authColors.gold,
    fontWeight: '500',
    marginBottom: 28,
  },
  loader: {
    marginTop: 8,
  },
});
