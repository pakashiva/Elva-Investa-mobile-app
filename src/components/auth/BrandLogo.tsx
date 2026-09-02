import React from 'react';
import { View, StyleSheet, Image, ImageStyle, StyleProp } from 'react-native';
import { BRAND_LOGO } from '../../constants/brandAssets';

type Props = {
  size?: number;
  imageStyle?: StyleProp<ImageStyle>;
};

export default function BrandLogo({ size = 96, imageStyle }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.pill, { width: size + 24, height: size * 0.62 }]}>
        <Image
          source={BRAND_LOGO}
          style={[styles.logo, { width: size, height: size * 0.72 }, imageStyle]}
          resizeMode="contain"
          accessibilityLabel="Venkatesh Traders logo"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: 18,
  },
  pill: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  logo: {
    backgroundColor: 'transparent',
  },
});
