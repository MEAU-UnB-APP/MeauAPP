// src/components/CustomButton.tsx

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';


type RootStackParamList = {
  [key: string]: undefined;
};

interface CustomButtonProps {
  screen?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}

const SEButton: React.FC<CustomButtonProps> = ({
  screen,
  backgroundColor = '#ffd358', 
  children = 'Próximo', 
  onPress,
  disabled = false,
}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handlePress = (event: GestureResponderEvent) => {
    if (onPress) {
      onPress(event);
    }
    
    if (screen) {
      navigation.navigate(screen);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }, disabled && styles.disabled]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text style={styles.text}>{children}</Text>
    </TouchableOpacity>
  );
};

export default SEButton;

const styles = StyleSheet.create({
  button: {
    height: 40,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  text: {
    textAlign: 'center',
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#434343',
  },
  disabled: {
    opacity: 0.6,
  },
});