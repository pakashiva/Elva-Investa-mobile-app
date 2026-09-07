import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  totalDisplay: string;
  detail: string;
};

export default function PayableInfoBanner({ totalDisplay, detail }: Props) {
  return (
    <View style={styles.box}>
      <View style={styles.iconCircle}>
        <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
      </View>
      <Text style={styles.text}>
        Total payable including agreement charges (payment gateway coming soon):{' '}
        <Text style={styles.amount}>{totalDisplay}</Text> {detail}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF6E8',
    borderWidth: 1,
    borderColor: '#F0D4A8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D4892A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#A66B1F',
  },
  amount: {
    fontWeight: '700',
    color: '#8A5515',
  },
});
