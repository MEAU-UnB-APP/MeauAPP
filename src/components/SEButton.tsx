import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../config/colors';


type RootStackParamList = {
  [key: string]: undefined;
};

interface CustomButtonProps {
  screen?: string;
  color?: string;
  backgroundColor?: string; 
  variant?: 'primary' | 'outlined';
  children?: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}

const SEButton: React.FC<CustomButtonProps> = ({
  screen,
  color,
  backgroundColor,
  variant = 'primary',
  children = 'Próximo', 
  onPress,
  disabled = false,
}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const buttonColor = color || backgroundColor || Colors.rosaescuro;

  const handlePress = (event: GestureResponderEvent) => {
    if (onPress) {
      onPress(event);
    }
    
    if (screen) {
      navigation.navigate(screen);
    }
  };

  const isOutlined = variant === 'outlined';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutlined ? styles.outlinedButton : styles.primaryButton,
        {
          backgroundColor: isOutlined ? 'transparent' : buttonColor,
          borderColor: isOutlined ? buttonColor : 'transparent',
          borderWidth: isOutlined ? 2 : 0,
        },
        disabled && styles.disabled
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text style={[
        styles.text,
        { color: isOutlined ? buttonColor : Colors.branco }
      ]}>
        {children}
      </Text>
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
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  outlinedButton: {
    backgroundColor: 'transparent',
  },
  text: {
    textAlign: 'center',
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
});