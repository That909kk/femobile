import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../../components';
import { COLORS, UI } from '../../../../constants';
import { commonStyles } from './styles';
import { 
  serviceService,
  type Service as FullService, 
  type ServiceOption as OldServiceOption,
  type ServiceChoice as OldServiceChoice,
  type Category,
  type CategoryService
} from '../../../../services';
import {
  ServiceOptionsResponse,
  ServiceOption,
  ServiceChoice,
  CalculatePriceRequest,
  CalculatePriceResponse
} from '../../../../types/booking';

interface SelectedOption {
  optionId: number;
  choiceId: number;
  optionName: string;
  choiceName: string;
  priceAdjustment: number;
}

interface ServiceSelectionProps {
  selectedService: FullService | null;
  selectedOptions: SelectedOption[];
  onNext: (service: FullService, options: SelectedOption[], totalPrice?: number) => void;
  onClose: () => void;
}

export const ServiceSelection: React.FC<ServiceSelectionProps> = ({
  selectedService,
  selectedOptions,
  onNext,
  onClose
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<FullService[]>([]);
  const [allServices, setAllServices] = useState<FullService[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentSelectedService, setCurrentSelectedService] = useState<FullService | null>(selectedService);
  const [currentSelectedOptions, setCurrentSelectedOptions] = useState<SelectedOption[]>(selectedOptions);
  const [selectedChoices, setSelectedChoices] = useState<{ [optionId: number]: number[] }>({});
  const [calculatedPrice, setCalculatedPrice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // New states for quantity and custom inputs
  const [quantity, setQuantity] = useState<number>(1);
  const [customInputs, setCustomInputs] = useState<{ [key: string]: string | number }>({
    'rooms': '',
    'bathrooms': '',
    'area': '',
    'floors': '',
    'note': ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentSelectedService) {
      loadServiceOptions(currentSelectedService.serviceId);
      calculatePrice();
    }
  }, [currentSelectedService, selectedChoices, quantity, customInputs]);

  useEffect(() => {
    filterServices();
  }, [selectedCategory, allServices, searchText]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCategories(),
        loadAllServices()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await serviceService.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        Alert.alert('Thông báo', response.message || 'Không thể tải danh mục');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách danh mục');
    }
  };

  const loadAllServices = async () => {
    try {
      // Load all categories first
      const categoriesResponse = await serviceService.getCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        const allServicesData: FullService[] = [];
        
        // Load services for each category
        for (const category of categoriesResponse.data) {
          try {
            const categoryResponse = await serviceService.getCategoryServices(category.categoryId);
            if (categoryResponse.success && categoryResponse.data) {
              const categoryServices = categoryResponse.data.services.map(convertToFullService);
              allServicesData.push(...categoryServices);
            }
          } catch (error) {
            console.error(`Error loading services for category ${category.categoryId}:`, error);
          }
        }
        
        setAllServices(allServicesData);
        setServices(allServicesData);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách dịch vụ. Vui lòng thử lại.');
    }
  };

  const convertToFullService = (serviceData: any): FullService => {
    // Handle both CategoryService format and direct service format
    return {
      serviceId: serviceData.serviceId,
      name: serviceData.name || serviceData.serviceName,
      description: serviceData.description || '',
      basePrice: serviceData.basePrice || 0,
      formattedPrice: serviceData.formattedPrice || `${(serviceData.basePrice || 0).toLocaleString('vi-VN')}đ`,
      unit: serviceData.unit || 'Gói',
      estimatedDurationHours: serviceData.estimatedDurationHours || 2,
      iconUrl: serviceData.iconUrl || '',
      categoryName: serviceData.categoryName || '',
      isActive: serviceData.isActive !== false,
      recommendedStaff: serviceData.recommendedStaff || 1,
    };
  };

  const loadServicesByCategory = async (categoryId: number) => {
    setLoadingServices(true);
    try {
      const response = await serviceService.getCategoryServices(categoryId);
      if (response.success && response.data) {
        const fullServices = response.data.services.map(convertToFullService);
        setServices(fullServices);
      }
    } catch (error) {
      console.error('Error loading services by category:', error);
      filterServices();
    } finally {
      setLoadingServices(false);
    }
  };

  const loadServiceOptions = async (serviceId: number) => {
    try {
      const response = await serviceService.getServiceOptions(serviceId);
      if (response.success && response.data) {
        setServiceOptions(response.data.options);
      } else {
        setServiceOptions([]);
      }
    } catch (error) {
      console.error('Error loading service options:', error);
      setServiceOptions([]);
    }
  };

  const calculatePrice = async () => {
    if (!currentSelectedService) return;

    try {
      const selectedChoiceIds = Object.values(selectedChoices).flat();
      
      const request: CalculatePriceRequest = {
        serviceId: currentSelectedService.serviceId,
        selectedChoiceIds: selectedChoiceIds,
        quantity: quantity
      };

      const response = await serviceService.calculateServicePrice(request);
      if (response.success && response.data) {
        setCalculatedPrice({
          unitPrice: response.data.finalPrice / quantity,
          totalPrice: response.data.finalPrice,
          formattedUnitPrice: response.data.formattedPrice,
          formattedTotalPrice: response.data.formattedPrice,
          totalDurationHours: response.data.estimatedDurationHours || response.data.estimatedDuration || 0,
          formattedDuration: response.data.formattedDuration,
          recommendedStaff: response.data.suggestedStaff
        });
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      // Fallback to basic calculation (API should handle complex pricing)
      const totalPrice = currentSelectedService.basePrice * quantity;

      setCalculatedPrice({
        unitPrice: currentSelectedService.basePrice,
        totalPrice: totalPrice,
        formattedTotalPrice: `${totalPrice.toLocaleString('vi-VN')}đ`
      });
    }
  };

  const filterServices = () => {
    let filtered = allServices;

    if (selectedCategory) {
      filtered = filtered.filter(service => 
        service.categoryName === selectedCategory.categoryName
      );
    }

    if (searchText.trim()) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchText.toLowerCase()) ||
        service.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setServices(filtered);
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    loadServicesByCategory(category.categoryId);
  };

  const handleServiceSelect = (service: FullService) => {
    setCurrentSelectedService(service);
    setShowOptionsModal(true);
    
    // Reset inputs when selecting new service
    setQuantity(1);
    setCustomInputs({
      'rooms': '',
      'bathrooms': '',
      'area': '',
      'floors': '',
      'note': ''
    });
    setSelectedChoices({});
  };

  const handleChoiceChange = (optionId: number, choiceId: number, isMultiple: boolean) => {
    setSelectedChoices(prev => {
      const current = prev[optionId] || [];
      
      if (isMultiple) {
        // For CHECKBOX type
        if (current.includes(choiceId)) {
          return { ...prev, [optionId]: current.filter(id => id !== choiceId) };
        } else {
          return { ...prev, [optionId]: [...current, choiceId] };
        }
      } else {
        // For RADIO type
        return { ...prev, [optionId]: [choiceId] };
      }
    });
  };

  const updateSelectedOptions = () => {
    const options: SelectedOption[] = [];
    
    Object.entries(selectedChoices).forEach(([optionId, choiceIds]) => {
      const option = serviceOptions.find(opt => opt.optionId === parseInt(optionId));
      if (option) {
        choiceIds.forEach(choiceId => {
          const choice = option.choices.find((ch: any) => ch.choiceId === choiceId);
          if (choice) {
            options.push({
              optionId: option.optionId,
              choiceId: choice.choiceId,
              optionName: option.optionName,
              choiceName: choice.choiceName,
              priceAdjustment: 0, // API will calculate total price
            });
          }
        });
      }
    });

    setCurrentSelectedOptions(options);
  };

  const handleConfirm = () => {
    if (!currentSelectedService) {
      Alert.alert('Thông báo', 'Vui lòng chọn dịch vụ');
      return;
    }

    // Validate required options (exclude QUANTITY_INPUT and MULTIPLE_CHOICE_CHECKBOX from being required)
    const requiredOptions = serviceOptions.filter(option => 
      option.isRequired && 
      option.optionType !== 'QUANTITY_INPUT' && 
      option.optionType !== 'MULTIPLE_CHOICE_CHECKBOX'
    );
    const missingOptions = requiredOptions.filter(option => {
      // Only check for choice selections, not quantity inputs or checkbox options
      return !selectedChoices[option.optionId] || selectedChoices[option.optionId].length === 0;
    });

    if (missingOptions.length > 0) {
      Alert.alert('Thông báo', `Vui lòng chọn: ${missingOptions.map(opt => opt.optionName).join(', ')}`);
      return;
    }

    // Validate quantity inputs are numbers (only if provided)
    const quantityInputOptions = serviceOptions.filter(option => option.optionType === 'QUANTITY_INPUT');
    for (const option of quantityInputOptions) {
      const inputValue = customInputs[`option_${option.optionId}`];
      if (inputValue && inputValue !== '') {
        const numValue = parseInt(inputValue.toString());
        if (isNaN(numValue) || numValue < 1) {
          Alert.alert('Thông báo', `${option.optionName}: Phải là số nguyên dương`);
          return;
        }
      }
    }

    // Validate custom inputs for cleaning services (completely optional - only validate format if provided)
    // Users can skip all custom inputs and proceed to next step
    if (currentSelectedService.name.toLowerCase().includes('dọn')) {
      // Only validate format if user entered values - all are optional
      if (customInputs.rooms && customInputs.rooms !== '') {
        const rooms = parseInt(customInputs.rooms.toString());
        if (isNaN(rooms) || rooms < 1) {
          Alert.alert('Thông báo', 'Số phòng ngủ phải là số nguyên dương (hoặc để trống)');
          return;
        }
      }
      
      if (customInputs.bathrooms && customInputs.bathrooms !== '') {
        const bathrooms = parseInt(customInputs.bathrooms.toString());
        if (isNaN(bathrooms) || bathrooms < 1) {
          Alert.alert('Thông báo', 'Số phòng tắm phải là số nguyên dương (hoặc để trống)');
          return;
        }
      }

      if (customInputs.area && customInputs.area !== '') {
        const area = parseInt(customInputs.area.toString());
        if (isNaN(area) || area < 1) {
          Alert.alert('Thông báo', 'Diện tích phải là số nguyên dương (hoặc để trống)');
          return;
        }
      }

      if (customInputs.floors && customInputs.floors !== '') {
        const floors = parseInt(customInputs.floors.toString());
        if (isNaN(floors) || floors < 1) {
          Alert.alert('Thông báo', 'Số tầng phải là số nguyên dương (hoặc để trống)');
          return;
        }
      }
    }

    // Validate quantity
    if (quantity < 1) {
      Alert.alert('Thông báo', 'Số lượng phải lớn hơn 0');
      return;
    }

    // Update selected options
    updateSelectedOptions();

    onNext(currentSelectedService, currentSelectedOptions, calculatedPrice?.totalPrice);
  };

  const formatPrice = (price: number) => {
    return `${(price || 0).toLocaleString('vi-VN')}đ`;
  };

  const renderCustomInputs = () => {
    // Only show custom inputs if a service is selected and modal is visible
    if (!currentSelectedService || !showOptionsModal) {
      return null;
    }

    const isCleaningService = currentSelectedService?.name.toLowerCase().includes('dọn');

    return (
      <View style={styles.customInputsContainer}>
        <Text style={styles.sectionTitle}>
          {isCleaningService ? 'Thông tin nhà cần dọn (tùy chọn)' : 'Thông tin đặt dịch vụ (tùy chọn)'}
        </Text>
        <Text style={styles.sectionSubtitle}>
          Bạn có thể bỏ qua phần này và chuyển sang bước tiếp theo
        </Text>
        
        {/* Quantity Input */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Số lượng (mặc định: {quantity}):</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityBtn}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Ionicons name="remove" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity 
              style={styles.quantityBtn}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Service-specific inputs based on service type */}
        {currentSelectedService?.name.toLowerCase().includes('dọn') && (
          <>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Số phòng ngủ (tùy chọn):</Text>
              <TextInput
                style={styles.textInput}
                value={customInputs.rooms?.toString() || ''}
                onChangeText={(text) => setCustomInputs(prev => ({...prev, rooms: text}))}
                placeholder="Ví dụ: 2 (không bắt buộc)"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Số phòng tắm (tùy chọn):</Text>
              <TextInput
                style={styles.textInput}
                value={customInputs.bathrooms?.toString() || ''}
                onChangeText={(text) => setCustomInputs(prev => ({...prev, bathrooms: text}))}
                placeholder="Ví dụ: 1 (không bắt buộc)"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Diện tích (m²) - tùy chọn:</Text>
              <TextInput
                style={styles.textInput}
                value={customInputs.area?.toString() || ''}
                onChangeText={(text) => setCustomInputs(prev => ({...prev, area: text}))}
                placeholder="Ví dụ: 50 (không bắt buộc)"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Số tầng (tùy chọn):</Text>
              <TextInput
                style={styles.textInput}
                value={customInputs.floors?.toString() || ''}
                onChangeText={(text) => setCustomInputs(prev => ({...prev, floors: text}))}
                placeholder="Ví dụ: 1 (không bắt buộc)"
                keyboardType="numeric"
              />
            </View>
          </>
        )}

        {/* General note input */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Ghi chú (tùy chọn):</Text>
          <TextInput
            style={[styles.textInput, styles.noteInput]}
            value={customInputs.note?.toString() || ''}
            onChangeText={(text) => setCustomInputs(prev => ({...prev, note: text}))}
            placeholder="Ghi chú thêm về dịch vụ (không bắt buộc)..."
            multiline
            numberOfLines={3}
          />
        </View>
      </View>
    );
  };

  const renderCategoryTabs = () => (
    <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
        <TouchableOpacity
          style={[
            commonStyles.secondaryButton,
            { marginRight: 8, paddingVertical: 8, paddingHorizontal: 16 },
            !selectedCategory && { backgroundColor: COLORS.primary }
          ]}
          onPress={() => {
            setSelectedCategory(null);
            setServices(allServices);
          }}
        >
          <Text style={[
            commonStyles.secondaryButtonText,
            { fontSize: 14 },
            !selectedCategory && { color: COLORS.text.inverse }
          ]}>
            Tất cả
          </Text>
        </TouchableOpacity>
        
        {categories.map((category) => (
          <TouchableOpacity
            key={category.categoryId}
            style={[
              commonStyles.secondaryButton,
              { marginRight: 8, paddingVertical: 8, paddingHorizontal: 16 },
              selectedCategory?.categoryId === category.categoryId && { backgroundColor: COLORS.primary }
            ]}
            onPress={() => handleCategorySelect(category)}
          >
            <Text style={[
              commonStyles.secondaryButtonText,
              { fontSize: 14 },
              selectedCategory?.categoryId === category.categoryId && { color: COLORS.text.inverse }
            ]}>
              {category.categoryName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderServiceOptions = () => (
    <Modal
      visible={showOptionsModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={commonStyles.container}>
        <View style={commonStyles.header}>
          <TouchableOpacity onPress={() => setShowOptionsModal(false)} style={commonStyles.backButton}>
            <Ionicons name="close" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <View style={commonStyles.headerContent}>
            <Text style={commonStyles.headerTitle}>
              {currentSelectedService?.name}
            </Text>
            <Text style={commonStyles.headerSubtitle}>Tùy chỉnh dịch vụ</Text>
          </View>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Service Info */}
          <View style={styles.serviceInfoContainer}>
            <Text style={styles.serviceDescription}>
              {currentSelectedService?.description}
            </Text>
            <Text style={styles.servicePrice}>
              Giá cơ bản: {currentSelectedService?.formattedPrice}
            </Text>
          </View>

          {/* Service Options - Show first if available */}
          {serviceOptions.length > 0 && (
            <View style={styles.optionsContainer}>
              <Text style={styles.sectionTitle}>Lựa chọn dịch vụ</Text>
              <Text style={styles.sectionSubtitle}>Chọn các tùy chọn phù hợp với nhu cầu của bạn</Text>
              {serviceOptions.map((option) => (
                <View key={option.optionId} style={styles.optionGroup}>
                  <Text style={styles.optionTitle}>
                    {option.optionName}
                    {option.isRequired && 
                     option.optionType !== 'QUANTITY_INPUT' && 
                     option.optionType !== 'MULTIPLE_CHOICE_CHECKBOX' && 
                     <Text style={styles.required}> *</Text>}
                    {(option.optionType === 'QUANTITY_INPUT' || option.optionType === 'MULTIPLE_CHOICE_CHECKBOX') && 
                     <Text style={styles.optional}> (tùy chọn)</Text>}
                  </Text>
                  
                  {option.optionType === 'QUANTITY_INPUT' ? (
                    // Render input for quantity type
                    <TextInput
                      style={styles.textInput}
                      value={customInputs[`option_${option.optionId}`]?.toString() || ''}
                      onChangeText={(text) => setCustomInputs(prev => ({
                        ...prev, 
                        [`option_${option.optionId}`]: text
                      }))}
                      placeholder={option.isRequired ? "Nhập số lượng..." : "Nhập số lượng (tùy chọn)..."}
                      keyboardType="numeric"
                    />
                  ) : (
                    // Render choices for other types
                    option.choices.map((choice: any) => {
                      const isSelected = selectedChoices[option.optionId]?.includes(choice.choiceId) || false;
                      const isMultiple = option.optionType === 'MULTIPLE_CHOICE_CHECKBOX';
                      
                      return (
                        <TouchableOpacity
                          key={choice.choiceId}
                          style={[styles.choiceItem, isSelected && styles.choiceItemSelected]}
                          onPress={() => handleChoiceChange(option.optionId, choice.choiceId, isMultiple)}
                        >
                          <View style={styles.choiceContent}>
                            <View style={styles.choiceInfo}>
                              <Text style={[styles.choiceText, isSelected && styles.choiceTextSelected]}>
                                {choice.choiceName}
                              </Text>
                              {/* Remove individual choice pricing - API will calculate total price */}
                            </View>
                            <View style={[
                              isMultiple ? styles.checkbox : styles.radio,
                              isSelected && (isMultiple ? styles.checkboxSelected : styles.radioSelected)
                            ]}>
                              {isSelected && (
                                <Ionicons 
                                  name={isMultiple ? "checkmark" : "radio-button-on"} 
                                  size={16} 
                                  color="white" 
                                />
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Custom Inputs - Show after service options */}
          {renderCustomInputs()}

          {/* Price Summary */}
          {calculatedPrice && (
            <View style={styles.priceSummaryContainer}>
              <Text style={styles.sectionTitle}>Tổng cộng</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Số lượng:</Text>
                <Text style={styles.priceValue}>{quantity}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Giá đơn vị:</Text>
                <Text style={styles.priceValue}>{formatPrice(calculatedPrice.unitPrice)}</Text>
              </View>
              {calculatedPrice.totalPrice > calculatedPrice.unitPrice * quantity && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Phụ thu:</Text>
                  <Text style={styles.priceValue}>
                    {formatPrice(calculatedPrice.totalPrice - (calculatedPrice.unitPrice * quantity))}
                  </Text>
                </View>
              )}
              <View style={[styles.priceRow, styles.totalPriceRow]}>
                <Text style={styles.totalPriceLabel}>Tổng cộng:</Text>
                <Text style={styles.totalPriceValue}>
                  {calculatedPrice 
                    ? formatPrice(calculatedPrice.totalPrice)
                    : currentSelectedService?.formattedPrice}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={commonStyles.buttonContainer}>
          <TouchableOpacity
            style={commonStyles.primaryButton}
            onPress={handleConfirm}
          >
            <Text style={commonStyles.primaryButtonText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderServices = () => (
    <ScrollView style={commonStyles.scrollContainer}>
      {loadingServices ? (
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={commonStyles.loadingText}>Đang tải dịch vụ...</Text>
        </View>
      ) : (
        services.map((service) => (
          <TouchableOpacity
            key={service.serviceId}
            style={[
              commonStyles.card,
              currentSelectedService?.serviceId === service.serviceId && commonStyles.cardSelected
            ]}
            onPress={() => handleServiceSelect(service)}
          >
            <View style={commonStyles.cardHeader}>
              <Image
                source={{ uri: service.iconUrl || 'https://picsum.photos/60' }}
                style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={commonStyles.cardTitle}>{service.name}</Text>
                <Text style={commonStyles.cardDescription} numberOfLines={2}>
                  {service.description}
                </Text>
                <View style={[commonStyles.flexRowBetween, { marginTop: 8 }]}>
                  <Text style={commonStyles.cardPrice}>
                    {service.formattedPrice}/{service.unit}
                  </Text>
                  <Text style={commonStyles.cardSubtitle}>
                    ~{service.estimatedDurationHours}h
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải dịch vụ...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={onClose} style={commonStyles.backButton}>
          <Ionicons name="close" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={commonStyles.headerContent}>
          <Text style={commonStyles.headerTitle}>Chọn dịch vụ</Text>
          <Text style={commonStyles.headerSubtitle}>Lựa chọn dịch vụ phù hợp</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[commonStyles.section, { marginHorizontal: 20, marginVertical: 8 }]}>
        <View style={[commonStyles.flexRow, { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.backgroundDark, borderRadius: 8 }]}>
          <Ionicons name="search" size={20} color={COLORS.text.secondary} style={{ marginRight: 12 }} />
          <TextInput
            style={[commonStyles.input, { flex: 1, borderWidth: 0, padding: 0, backgroundColor: 'transparent' }]}
            placeholder="Tìm kiếm dịch vụ..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={COLORS.text.secondary}
          />
        </View>
      </View>

      {/* Categories */}
      {renderCategoryTabs()}

      {/* Services */}
      {renderServices()}

      {/* Service Options Modal */}
      {renderServiceOptions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  categoryContainer: {
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  categoryTabActive: {
    backgroundColor: COLORS.primary,
  },
  categoryTabText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  categoryTabTextActive: {
    color: COLORS.text.inverse,
    fontWeight: '500',
  },
  servicesContainer: {
    flex: 1,
    padding: 16,
  },
  loader: {
    marginTop: 50,
  },
  serviceCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  serviceIcon: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  serviceDuration: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  serviceInfoContainer: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 16,
  },
  customInputsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  inputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 4,
  },
  quantityBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background,
  },
  noteInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  optionGroup: {
    marginBottom: 20,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  required: {
    color: COLORS.error,
  },
  optional: {
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    fontSize: 14,
  },
  choiceItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
    backgroundColor: COLORS.background,
  },
  choiceItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  choiceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  choiceInfo: {
    flex: 1,
  },
  choiceText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  choiceTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  choicePrice: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  priceSummaryContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  priceValue: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  totalPriceRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  totalPriceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalFooter: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});