import React from 'react';
import { Dialog, Portal } from 'react-native-paper';
import { Text, View, StyleSheet } from 'react-native';
import { Colors } from '../config/colors';
import SEButton from './SEButton';

interface AdoptionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  type: 'approve' | 'reject';
}

export default function AdoptionDialog({ 
  visible, 
  onDismiss, 
  onConfirm, 
  type 
}: AdoptionDialogProps) {
  const isApprove = type === 'approve';
  const title = isApprove ? 'Confirmar Adoção' : 'Recusar Adoção';
  const message = isApprove
    ? 'Tem certeza que deseja confirmar a adoção deste animal?\n\nEsta ação não pode ser desfeita.'
    : 'Tem certeza que deseja recusar a adoção deste animal?\n\nEsta ação não pode ser desfeita.';
  const confirmButtonColor = isApprove ? Colors.verde : Colors.rosaescuro;
  const confirmButtonText = isApprove ? 'Confirmar Adoção' : 'Recusar Adoção';

  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss}
        style={styles.dialog}
      >
        <Dialog.Title style={styles.dialogTitle}>{title}</Dialog.Title>
        <Dialog.Content style={styles.dialogContent}>
          <Text style={styles.dialogText}>
            {message}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.dialogActions}>
          <View style={styles.buttonContainer}>
            <View>
              <SEButton
                color={Colors.branco}
                variant="outlined"
                onPress={onDismiss}
              >
                Cancelar
              </SEButton>
            </View>
            <View style={{ width: 12 }} />
            <View>
              <SEButton
                color={confirmButtonColor}
                onPress={onConfirm}
              >
                {confirmButtonText}
              </SEButton>
            </View>
          </View>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: Colors.roxoclaro,
  },
  dialogTitle: {
    color: Colors.preto,
    fontFamily: 'Roboto-Medium',
    fontSize: 18,
  },
  dialogContent: {
    backgroundColor: Colors.roxoclaro,
  },
  dialogText: {
    fontSize: 16,
    color: Colors.preto,
    fontFamily: 'Roboto-Regular',
  },
  dialogActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.roxoclaro,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
  },
});

