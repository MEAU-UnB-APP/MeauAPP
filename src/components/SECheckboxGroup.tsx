import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface SECheckboxGroupProps {
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  style?: ViewStyle;
  disabled?: boolean;
  layout?: 'horizontal' | 'vertical';
}

const SECheckboxGroup: React.FC<SECheckboxGroupProps> = ({
  options,
  selectedValues,
  onSelectionChange,
  style,
  disabled = false,
  layout = 'horizontal',
}) => {

  const handlePress = (option: string) => {

    if (disabled) {
      return;
    }

    const newSelectedValues = [...selectedValues];
    const index = newSelectedValues.indexOf(option);

    if (index > -1) {
      newSelectedValues.splice(index, 1);
    } else {
      newSelectedValues.push(option);
    }

    onSelectionChange(newSelectedValues);
  };

  const isVertical = layout === 'vertical';

  return (
    <View style={[
      styles.container, 
      isVertical && styles.verticalContainer,
      style
    ]}>
      {options.map((option) => {

        const isSelected = selectedValues.includes(option);

        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionContainer,
              isVertical && styles.verticalOptionContainer
            ]}
            onPress={() => handlePress(option)}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <Icon
              name={isSelected ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={disabled ? '#bdbdbd' : '#757575'}
            />
            <Text
              style={[
                styles.optionText,
                isSelected && styles.selectedOptionText,
                disabled && styles.disabledText,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  verticalContainer: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
  optionContainer: {
    width: '32%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  verticalOptionContainer: {
    width: '100%',
  },
  optionText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#757575',
    marginLeft: 8,
  },
  selectedOptionText: {
    color: '#434343',
  },
  disabledText: {
    color: '#bdbdbd',
  }
});

export default SECheckboxGroup;