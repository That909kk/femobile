import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  style?: any;
  textStyle?: any;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onPress,
  label,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity style={[styles.container, style]} onPress={onPress}>
      <View style={[styles.checkbox, checked && styles.checkedCheckbox]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      {label && <Text style={[styles.label, textStyle]}>{label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkedCheckbox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  label: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});
