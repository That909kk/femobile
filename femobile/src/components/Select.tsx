import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, UI } from '../constants';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Chọn một tùy chọn',
  error,
  disabled = false,
  searchable = false,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');

  const selectedOption = options.find(option => option.value === value);

  // Filter options based on search text
  const filteredOptions = React.useMemo(() => {
    if (!searchText.trim()) return options;
    const searchLower = searchText.toLowerCase().trim();
    return options.filter(option => 
      option.label.toLowerCase().includes(searchLower)
    );
  }, [options, searchText]);

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue);
    setIsVisible(false);
    setSearchText('');
  };

  const handleClose = () => {
    setIsVisible(false);
    setSearchText('');
  };

  const getSelectStyle = () => {
    const baseStyle: any[] = [styles.select];
    
    if (error) {
      baseStyle.push(styles.errorSelect);
    }
    
    if (disabled) {
      baseStyle.push(styles.disabledSelect);
    }
    
    return baseStyle;
  };

  // Auto enable search for large lists (provinces, communes)
  const shouldShowSearch = searchable || options.length > 10;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={getSelectStyle()}
        onPress={() => !disabled && setIsVisible(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.selectText,
          !selectedOption && styles.placeholderText
        ]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        
        <Ionicons
          name="chevron-down"
          size={20}
          color={COLORS.text.secondary}
        />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Chọn tùy chọn'}</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
            
            {/* Search input for large lists */}
            {shouldShowSearch && (
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.text.secondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm kiếm..."
                  placeholderTextColor={COLORS.text.disabled}
                  value={searchText}
                  onChangeText={setSearchText}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchText('')}>
                    <Ionicons name="close-circle" size={20} color={COLORS.text.secondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            <ScrollView 
              style={styles.optionsContainer}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {filteredOptions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
                </View>
              ) : (
                filteredOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.option,
                      option.value === value && styles.selectedOption
                    ]}
                    onPress={() => handleSelect(option.value)}
                  >
                    <Text style={[
                      styles.optionText,
                      option.value === value && styles.selectedOptionText
                    ]}>
                      {option.label}
                    </Text>
                    
                    {option.value === value && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: UI.BORDER_RADIUS.medium,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 48,
  },
  errorSelect: {
    borderColor: COLORS.error,
  },
  disabledSelect: {
    backgroundColor: COLORS.background,
    opacity: 0.6,
  },
  selectText: {
    fontSize: 16,
    color: COLORS.text.primary,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.text.disabled,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: UI.BORDER_RADIUS.large,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 8,
    paddingVertical: 4,
  },
  optionsContainer: {
    maxHeight: 400,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedOption: {
    backgroundColor: COLORS.background,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text.primary,
    flex: 1,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
});
