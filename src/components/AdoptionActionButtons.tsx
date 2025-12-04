import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../config/colors';

interface AdoptionActionButtonsProps {
  onApprove: () => void;
  onReject: () => void;
}

export default function AdoptionActionButtons({ onApprove, onReject }: AdoptionActionButtonsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onReject}
        style={[styles.button, styles.rejectButton]}
      >
        <Text style={styles.buttonText}>Recusar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onApprove}
        style={[styles.button, styles.approveButton]}
      >
        <Text style={styles.buttonText}>Aprovar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginRight: 8,
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 6,
  },
  rejectButton: {
    backgroundColor: Colors.rosaescuro,
  },
  approveButton: {
    backgroundColor: Colors.verde,
  },
  buttonText: {
    color: Colors.preto,
    fontSize: 12,
    fontWeight: '600',
  },
});

