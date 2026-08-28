import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

export default function BrandLogo() {
  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <Svg width={56} height={28} viewBox="0 0 56 28">
          <Rect x={10} y={6} width={5} height={16} rx={2} fill="#D4D8DE" />
          <Rect x={18} y={4} width={5} height={20} rx={2} fill="#B8BEC8" />
          <Rect x={26} y={6} width={5} height={16} rx={2} fill="#C5A059" />
          <Rect x={34} y={8} width={5} height={12} rx={2} fill="#E8C97A" />
        </Svg>
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
    width: 88,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
