import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authColors } from '../../theme/authColors';

export default function OtpVisual() {
  return (
    <View style={styles.wrap}>
      <View style={styles.ringOuter} />
      <View style={styles.ringMiddle} />
      <View style={styles.core}>
        <Ionicons name="shield-checkmark" size={22} color={authColors.gold} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  ringOuter: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: '#D6E4F5',
    backgroundColor: '#F4F8FC',
  },
  ringMiddle: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: '#C5D9F0',
    backgroundColor: '#EAF2FB',
  },
  core: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: authColors.header,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
