import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../../components';
import { colors, responsive, responsiveSpacing, responsiveFontSize, screenDimensions } from '../../../../styles';
import { 
  serviceService,
  type Service as FullService, 
  type Category,
} from '../../../../services';
import {
  ServiceOption,
  CalculatePriceRequest,
} from '../../../../types/booking';
import { ProgressIndicator } from './ProgressIndicator';
import { BookingStep } from './BookingNavigator';

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
  onNext: (
    service: FullService,
    options: SelectedOption[],
    totalPrice?: number,
    quantity?: number
  ) => void;
  onClose: () => void;
}

// Memoized Service Card Component to prevent unnecessary re-renders
interface ServiceCardItemProps {
  service: FullService;
  isSelected: boolean;
  shouldAnimate: boolean;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  onPress: () => void;
}

const ServiceCardItem = React.memo<ServiceCardItemProps>(({ 
  service, 
  isSelected, 
  shouldAnimate, 
  fadeAnim, 
  scaleAnim, 
  onPress 
}) => {
  return (
    <Animated.View
      style={shouldAnimate ? {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      } : {}}
    >
      <TouchableOpacity
        style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.serviceCardHeader}>
          <View style={styles.serviceIconWrapper}>
            <Image
              source={{ uri: service.iconUrl || 'https://picsum.photos/60' }}
              style={styles.serviceIcon}
            />
            {service.recommendedStaff > 1 && (
              <View style={styles.staffBadge}>
                <Ionicons name="people" size={10} color={colors.neutral.white} />
                <Text style={styles.staffBadgeText}>{service.recommendedStaff}</Text>
              </View>
            )}
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName} numberOfLines={1}>
              {service.name}
            </Text>
            <Text style={styles.serviceCategory}>{service.categoryName}</Text>
            <Text style={styles.serviceDescription} numberOfLines={2}>
              {service.description}
            </Text>
          </View>
        </View>
        
        <View style={styles.serviceFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Từ</Text>
            <Text style={styles.servicePrice}>{service.formattedPrice}</Text>
          </View>
          <View style={styles.durationContainer}>
            <Ionicons name="time-outline" size={14} color={colors.neutral.textSecondary} />
            <Text style={styles.serviceDuration}>~{service.estimatedDurationHours}h</Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={28} color={colors.neutral.white} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-render unless these props change
  return (
    prevProps.service.serviceId === nextProps.service.serviceId &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.shouldAnimate === nextProps.shouldAnimate
  );
});

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
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  
  const [quantity, setQuantity] = useState<number>(1);
  // State for QUANTITY_INPUT options: optionId -> { enabled: boolean, value: number }
  const [quantityInputs, setQuantityInputs] = useState<{ [optionId: number]: { enabled: boolean; value: number } }>({});
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const calculatePriceTimer = useRef<NodeJS.Timeout | null>(null);
  const previousCategoryRef = useRef<number | null>(null);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Debounce search text
  useEffect(() => {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    searchTimer.current = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);

    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, [searchText]);

  useEffect(() => {
    // Only animate when category actually changes (not on search)
    const categoryChanged = selectedCategory?.categoryId !== previousCategoryRef.current;
    const isSearching = debouncedSearchText.trim().length > 0;
    
    if (services.length > 0 && categoryChanged && !isSearching) {
      previousCategoryRef.current = selectedCategory?.categoryId ?? null;
      
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 9,
          tension: 45,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
    }
  }, [services, selectedCategory, debouncedSearchText]);

  useEffect(() => {
    if (currentSelectedService) {
      loadServiceOptions(currentSelectedService.serviceId);
    }
  }, [currentSelectedService]);

  // Debounced price calculation
  useEffect(() => {
    if (!currentSelectedService) return;

    if (calculatePriceTimer.current) {
      clearTimeout(calculatePriceTimer.current);
    }

    calculatePriceTimer.current = setTimeout(() => {
      calculatePrice();
    }, 300); // 300ms debounce

    return () => {
      if (calculatePriceTimer.current) {
        clearTimeout(calculatePriceTimer.current);
      }
    };
  }, [selectedChoices, quantity, quantityInputs]);

  const filterServices = useCallback(() => {
    let filtered = allServices;

    if (selectedCategory) {
      filtered = filtered.filter(service => 
        service.categoryName === selectedCategory.categoryName
      );
    }

    if (debouncedSearchText.trim()) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
        service.description.toLowerCase().includes(debouncedSearchText.toLowerCase())
      );
    }

    setServices(filtered);
  }, [selectedCategory, allServices, debouncedSearchText]);

  useEffect(() => {
    filterServices();
  }, [filterServices]);

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
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAllServices = async () => {
    try {
      const response = await serviceService.getCustomerServices();

      if (!response.success) {
        setAllServices([]);
        setServices([]);
        Alert.alert('Thông báo', response.message || 'Không thể tải danh sách dịch vụ');
        return;
      }

      const rawData = response.data as any;
      const serviceList: any[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.services)
          ? rawData.services
          : [];

      if (serviceList.length === 0) {
        setAllServices([]);
        setServices([]);
        return;
      }

      const normalizedServices = serviceList.map(convertToFullService);
      setAllServices(normalizedServices);
      setServices(normalizedServices);
    } catch (error: any) {
      console.error('Error loading services:', error);
      setAllServices([]);
      setServices([]);
      Alert.alert('Lỗi', 'Không thể tải danh sách dịch vụ. Vui lòng thử lại.');
    }
  };

  const convertToFullService = (serviceData: any): FullService => {
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
      
      if (response.success && response.data && response.data.services) {
        const fullServices = response.data.services.map(convertToFullService);
        setServices(fullServices);
      } else {
        // Fallback: filter from allServices
        const fallbackCategory = categories.find((cat) => cat.categoryId === categoryId);
        const fallbackServices = allServices.filter(
          (service) =>
            fallbackCategory?.categoryName && service.categoryName === fallbackCategory.categoryName,
        );
        setServices(fallbackServices);
      }
    } catch (error) {
      console.error('Error loading services by category:', error);
      // Fallback on error
      const fallbackCategory = categories.find((cat) => cat.categoryId === categoryId);
      const fallbackServices = allServices.filter(
        (service) =>
          fallbackCategory?.categoryName && service.categoryName === fallbackCategory.categoryName,
      );
      setServices(fallbackServices);
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
      
      // Add choices from QUANTITY_INPUT options
      Object.entries(quantityInputs).forEach(([optionId, inputData]) => {
        if (inputData.enabled && inputData.value > 0) {
          const option = serviceOptions.find((opt) => opt.optionId === Number(optionId));
          if (option && option.optionType === 'QUANTITY_INPUT' && option.choices[0]) {
            selectedChoiceIds.push(option.choices[0].choiceId);
          }
        }
      });
      
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
      } else {
        // API failed but service exists, use base price
        const totalPrice = currentSelectedService.basePrice * quantity;
        setCalculatedPrice({
          unitPrice: currentSelectedService.basePrice,
          totalPrice: totalPrice,
          formattedTotalPrice: `${totalPrice.toLocaleString('vi-VN')}đ`,
          totalDurationHours: currentSelectedService.estimatedDurationHours,
          formattedDuration: `${currentSelectedService.estimatedDurationHours}h`,
          recommendedStaff: currentSelectedService.recommendedStaff
        });
      }
    } catch (error: any) {
      console.error('Error calculating price:', error);
      // On timeout or error, use base price as fallback
      const totalPrice = currentSelectedService.basePrice * quantity;
      setCalculatedPrice({
        unitPrice: currentSelectedService.basePrice,
        totalPrice: totalPrice,
        formattedTotalPrice: `${totalPrice.toLocaleString('vi-VN')}đ`,
        totalDurationHours: currentSelectedService.estimatedDurationHours,
        formattedDuration: `${currentSelectedService.estimatedDurationHours}h`,
        recommendedStaff: currentSelectedService.recommendedStaff
      });
      
      // Only show error if it's not a timeout and there are selected choices
      const selectedChoiceIds = Object.values(selectedChoices).flat();
      if (error?.message !== 'timeout of 20000ms exceeded' && selectedChoiceIds.length > 0) {
        console.warn('Failed to calculate accurate price, using base price');
      }
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    loadServicesByCategory(category.categoryId);
  };

  const handleServiceSelect = (service: FullService) => {
    setCurrentSelectedService(service);
    setShowOptionsModal(true);
    setQuantity(1);
    setSelectedChoices({});
    setQuantityInputs({}); // Reset quantity inputs when selecting a new service
  };

  const handleChoiceChange = useCallback((optionId: number, choiceId: number, isMultiple: boolean) => {
    setSelectedChoices(prev => {
      const current = prev[optionId] || [];
      
      if (isMultiple) {
        if (current.includes(choiceId)) {
          return { ...prev, [optionId]: current.filter(id => id !== choiceId) };
        } else {
          return { ...prev, [optionId]: [...current, choiceId] };
        }
      } else {
        return { ...prev, [optionId]: [choiceId] };
      }
    });
  }, []);

  const buildSelectedOptions = () => {
    const options: SelectedOption[] = [];

    Object.entries(selectedChoices).forEach(([optionId, choiceIds]) => {
      const option = serviceOptions.find((opt) => opt.optionId === Number(optionId));
      if (!option) {
        return;
      }

      choiceIds.forEach((choiceId) => {
        const choice = option.choices.find((ch: any) => ch.choiceId === choiceId);
        if (!choice) {
          return;
        }

        const rawAdjustment = (choice as any).priceAdjustment;
        const priceAdjustment =
          typeof rawAdjustment === 'number'
            ? rawAdjustment
            : Number(rawAdjustment) || 0;

        options.push({
          optionId: option.optionId,
          choiceId: choice.choiceId,
          optionName: option.optionName,
          choiceName: choice.choiceName,
          priceAdjustment,
        });
      });
    });

    // Handle QUANTITY_INPUT options
    Object.entries(quantityInputs).forEach(([optionId, inputData]) => {
      if (!inputData.enabled || inputData.value <= 0) {
        return;
      }

      const option = serviceOptions.find((opt) => opt.optionId === Number(optionId));
      if (!option || option.optionType !== 'QUANTITY_INPUT') {
        return;
      }

      // For QUANTITY_INPUT, we need to find the choice with the quantity value
      const choice = option.choices[0]; // Typically QUANTITY_INPUT has one choice
      if (choice) {
        const rawAdjustment = (choice as any).priceAdjustment;
        const priceAdjustment =
          typeof rawAdjustment === 'number'
            ? rawAdjustment
            : Number(rawAdjustment) || 0;

        options.push({
          optionId: option.optionId,
          choiceId: choice.choiceId,
          optionName: option.optionName,
          choiceName: `${choice.choiceName}: ${inputData.value}`,
          priceAdjustment: priceAdjustment * inputData.value, // Multiply by quantity
        });
      }
    });

  setCurrentSelectedOptions(options);
  return options;
  };

  const handleConfirm = () => {
    if (!currentSelectedService) {
      Alert.alert('Thông báo', 'Vui lòng chọn dịch vụ');
      return;
    }

    // Removed required options validation - users can continue without selecting options

    if (quantity < 1) {
      Alert.alert('Thông báo', 'Số lượng phải lớn hơn 0');
      return;
    }

  const updatedOptions = buildSelectedOptions();
    const normalizedQuantity = Math.max(1, quantity);
    const derivedTotalPrice =
      calculatedPrice?.totalPrice ?? currentSelectedService.basePrice * normalizedQuantity;

    onNext(currentSelectedService, updatedOptions, derivedTotalPrice, normalizedQuantity);
  };

  const formatPrice = (price: number) => {
    return `${(price || 0).toLocaleString('vi-VN')}đ`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.highlight.teal} />
        <Text style={styles.loadingText}>Đang tải dịch vụ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.primary.navy} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Chọn dịch vụ</Text>
          <Text style={styles.headerSubtitle}>Khám phá dịch vụ hoàn hảo cho bạn</Text>
        </View>
      </View>

      {/* Progress Indicator */}
      <ProgressIndicator currentStep={BookingStep.SERVICE_SELECTION} />

      {/* Smart Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.neutral.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm dịch vụ..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={colors.neutral.textSecondary}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color={colors.neutral.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modern Category Tabs */}
      <View style={styles.categorySection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContent}>
          <TouchableOpacity
            style={[styles.categoryTab, !selectedCategory && styles.categoryTabActive]}
            onPress={() => {
              setSelectedCategory(null);
              setServices(allServices);
            }}
          >
            <Ionicons name="apps" size={18} color={!selectedCategory ? colors.neutral.white : colors.neutral.textSecondary} />
            <Text style={[styles.categoryTabText, !selectedCategory && styles.categoryTabTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          
          {categories.map((category) => (
            <TouchableOpacity
              key={category.categoryId}
              style={[styles.categoryTab, selectedCategory?.categoryId === category.categoryId && styles.categoryTabActive]}
              onPress={() => handleCategorySelect(category)}
            >
              <Text style={[styles.categoryTabText, selectedCategory?.categoryId === category.categoryId && styles.categoryTabTextActive]}>
                {category.categoryName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Modern Service Grid */}
      <Animated.ScrollView 
        style={styles.servicesContainer}
        contentContainerStyle={styles.servicesContent}
        showsVerticalScrollIndicator={false}
      >
        {loadingServices ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.highlight.teal} />
            <Text style={styles.loadingText}>Đang tải dịch vụ...</Text>
          </View>
        ) : services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color={colors.neutral.border} />
            <Text style={styles.emptyTitle}>Hiện chưa có dịch vụ nào</Text>
            <Text style={styles.emptySubtitle}>
              {searchText ? 'Thử tìm kiếm với từ khóa khác' : 'Vui lòng quay lại sau'}
            </Text>
          </View>
        ) : (
          services.map((service) => {
            const isSelected = currentSelectedService?.serviceId === service.serviceId;
            const shouldAnimate = !debouncedSearchText.trim();
            
            return (
              <ServiceCardItem
                key={service.serviceId}
                service={service}
                isSelected={isSelected}
                shouldAnimate={shouldAnimate}
                fadeAnim={fadeAnim}
                scaleAnim={scaleAnim}
                onPress={() => handleServiceSelect(service)}
              />
            );
          })
        )}
      </Animated.ScrollView>

      {/* Service Options Modal - Will be designed next */}
      {showOptionsModal && currentSelectedService && (
        <Modal
          visible={showOptionsModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowOptionsModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={colors.primary.navy} />
              </TouchableOpacity>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {currentSelectedService.name}
                </Text>
                <Text style={styles.modalSubtitle}>Tùy chỉnh dịch vụ của bạn</Text>
              </View>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Service Info Card */}
              <View style={styles.serviceInfoCard}>
                <Image
                  source={{ uri: currentSelectedService.iconUrl || 'https://picsum.photos/120' }}
                  style={styles.modalServiceIcon}
                />
                <Text style={styles.modalServiceDescription}>
                  {currentSelectedService.description}
                </Text>
                <View style={styles.serviceMetrics}>
                  <View style={styles.metricItem}>
                    <Ionicons name="cash-outline" size={20} color={colors.highlight.teal} />
                    <Text style={styles.metricLabel}>Giá cơ bản</Text>
                    <Text style={styles.metricValue}>{currentSelectedService.formattedPrice}</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Ionicons name="time-outline" size={20} color={colors.highlight.teal} />
                    <Text style={styles.metricLabel}>Thời gian</Text>
                    <Text style={styles.metricValue}>~{currentSelectedService.estimatedDurationHours}h</Text>
                  </View>
                </View>
              </View>

              {/* Service Options */}
              {serviceOptions.length > 0 && (
                <View style={styles.optionsSection}>
                  <Text style={styles.sectionTitle}>Tùy chọn dịch vụ</Text>
                  {serviceOptions.map((option) => (
                    <View key={option.optionId} style={styles.optionGroup}>
                      <Text style={styles.optionTitle}>
                        {option.optionName}
                        {option.isRequired && option.optionType !== 'QUANTITY_INPUT' && option.optionType !== 'MULTIPLE_CHOICE_CHECKBOX' && (
                          <Text style={styles.required}> *</Text>
                        )}
                      </Text>
                      
                      {option.optionType === 'QUANTITY_INPUT' ? (
                        // Render QUANTITY_INPUT with checkbox and input field
                        <View style={styles.quantityInputContainer}>
                          <TouchableOpacity
                            style={styles.quantityInputCheckboxRow}
                            onPress={() => {
                              setQuantityInputs(prev => ({
                                ...prev,
                                [option.optionId]: {
                                  enabled: !prev[option.optionId]?.enabled,
                                  value: prev[option.optionId]?.value || 1
                                }
                              }));
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={[
                              styles.checkbox,
                              quantityInputs[option.optionId]?.enabled && styles.checkboxSelected
                            ]}>
                              {quantityInputs[option.optionId]?.enabled && (
                                <Ionicons name="checkmark" size={16} color={colors.neutral.white} />
                              )}
                            </View>
                            <Text style={styles.quantityInputLabel}>
                              {option.choices[0]?.choiceName || 'Nhập số lượng'}
                            </Text>
                          </TouchableOpacity>
                          
                          {quantityInputs[option.optionId]?.enabled && (
                            <View style={styles.quantityInputField}>
                              <TextInput
                                style={styles.quantityInputText}
                                keyboardType="numeric"
                                placeholder="Nhập số lượng"
                                placeholderTextColor={colors.neutral.textSecondary}
                                value={quantityInputs[option.optionId]?.value?.toString() || ''}
                                onChangeText={(text) => {
                                  const value = parseInt(text) || 0;
                                  setQuantityInputs(prev => ({
                                    ...prev,
                                    [option.optionId]: {
                                      enabled: true,
                                      value: Math.max(0, value)
                                    }
                                  }));
                                }}
                                onEndEditing={(e) => {
                                  // Ensure minimum value of 0 when user finishes editing
                                  const text = e.nativeEvent.text;
                                  const value = parseInt(text) || 0;
                                  if (value < 0) {
                                    setQuantityInputs(prev => ({
                                      ...prev,
                                      [option.optionId]: {
                                        enabled: true,
                                        value: 0
                                      }
                                    }));
                                  }
                                }}
                              />
                              <View style={styles.quantityInputButtons}>
                                <TouchableOpacity
                                  style={styles.quantityInputButton}
                                  onPress={() => {
                                    setQuantityInputs(prev => ({
                                      ...prev,
                                      [option.optionId]: {
                                        enabled: true,
                                        value: Math.max(0, (prev[option.optionId]?.value || 1) - 1)
                                      }
                                    }));
                                  }}
                                >
                                  <Ionicons name="remove" size={20} color={colors.highlight.teal} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.quantityInputButton}
                                  onPress={() => {
                                    setQuantityInputs(prev => ({
                                      ...prev,
                                      [option.optionId]: {
                                        enabled: true,
                                        value: (prev[option.optionId]?.value || 0) + 1
                                      }
                                    }));
                                  }}
                                >
                                  <Ionicons name="add" size={20} color={colors.highlight.teal} />
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </View>
                      ) : (
                        // Render regular choices (radio/checkbox)
                        option.choices.map((choice: any) => {
                          const isSelected = selectedChoices[option.optionId]?.includes(choice.choiceId) || false;
                          const isMultiple = option.optionType === 'MULTIPLE_CHOICE_CHECKBOX';
                          
                          return (
                            <TouchableOpacity
                              key={choice.choiceId}
                              style={[styles.choiceCard, isSelected && styles.choiceCardSelected]}
                              onPress={() => handleChoiceChange(option.optionId, choice.choiceId, isMultiple)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.choiceContent}>
                                <Text style={[styles.choiceText, isSelected && styles.choiceTextSelected]}>
                                  {choice.choiceName}
                                </Text>
                                <View style={[isMultiple ? styles.checkbox : styles.radio, isSelected && styles.checkboxSelected]}>
                                  {isSelected && (
                                    <Ionicons 
                                      name={isMultiple ? "checkmark" : "ellipse"} 
                                      size={isMultiple ? 16 : 12} 
                                      color={colors.neutral.white} 
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

              {/* Quantity Section */}
              <View style={styles.quantitySection}>
                <Text style={styles.sectionTitle}>Số lượng</Text>
                <View style={styles.quantityControl}>
                  <TouchableOpacity 
                    style={[styles.quantityButton, quantity === 1 && styles.quantityButtonDisabled]}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity === 1}
                  >
                    <Ionicons name="remove" size={24} color={quantity === 1 ? colors.neutral.textSecondary : colors.neutral.white} />
                  </TouchableOpacity>
                  <View style={styles.quantityDisplay}>
                    <Text style={styles.quantityText}>{quantity}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => setQuantity(quantity + 1)}
                  >
                    <Ionicons name="add" size={24} color={colors.neutral.white} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Price Summary */}
              {calculatedPrice && (
                <View style={styles.priceSummary}>
                  <Text style={styles.sectionTitle}>Tổng cộng</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Giá đơn vị</Text>
                    <Text style={styles.summaryValue}>{formatPrice(calculatedPrice.unitPrice)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Số lượng</Text>
                    <Text style={styles.summaryValue}>x{quantity}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tổng cộng</Text>
                    <Text style={styles.totalValue}>{formatPrice(calculatedPrice.totalPrice)}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>Tiếp tục</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.neutral.white} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.background,
  },
  loadingText: {
    marginTop: responsiveSpacing.md,
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    fontWeight: '500',
  },
  
  // Header - matching CustomerHomeScreen
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.lg,
    paddingTop: responsiveSpacing.xl,
    paddingBottom: responsiveSpacing.md,
    backgroundColor: colors.warm.beige,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSpacing.md,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '600',
    color: colors.primary.navy,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginTop: 4,
    fontWeight: '400',
  },

  // Search - matching CustomerHomeScreen card style
  searchSection: {
    paddingHorizontal: responsiveSpacing.lg,
    paddingTop: responsiveSpacing.md,
    paddingBottom: responsiveSpacing.sm,
    backgroundColor: colors.warm.beige,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.md + 2,
    paddingVertical: responsiveSpacing.md - 2,
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: responsiveSpacing.sm,
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textPrimary,
    fontWeight: '400',
  },

  // Categories - matching CustomerHomeScreen style
  categorySection: {
    paddingVertical: responsiveSpacing.md,
    backgroundColor: colors.neutral.white,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  categoryScrollContent: {
    paddingHorizontal: responsiveSpacing.lg,
    gap: responsiveSpacing.sm,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.md + 4,
    paddingVertical: responsiveSpacing.sm + 2,
    marginRight: responsiveSpacing.xs,
    borderRadius: 20,
    backgroundColor: colors.neutral.background,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  categoryTabActive: {
    backgroundColor: colors.highlight.teal,
    borderColor: colors.highlight.teal,
    shadowColor: colors.highlight.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryTabText: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    fontWeight: '500',
    marginLeft: 6,
  },
  categoryTabTextActive: {
    color: colors.neutral.white,
    fontWeight: '600',
  },

  // Services - matching CustomerHomeScreen card style
  servicesContainer: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  servicesContent: {
    padding: responsiveSpacing.lg,
    paddingTop: responsiveSpacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveSpacing.xxl * 2,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.neutral.textSecondary,
    marginTop: responsiveSpacing.md,
  },
  emptySubtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    marginTop: responsiveSpacing.xs,
    opacity: 0.7,
  },
  serviceCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: responsiveSpacing.md + 4,
    marginBottom: responsiveSpacing.md,
    borderWidth: 0,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  serviceCardSelected: {
    borderWidth: 2,
    borderColor: colors.highlight.teal,
    backgroundColor: colors.neutral.white,
    shadowOpacity: 0.15,
    elevation: 6,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    marginBottom: responsiveSpacing.md,
  },
  serviceIconWrapper: {
    position: 'relative',
    marginRight: responsiveSpacing.md,
  },
  serviceIcon: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: colors.warm.beige,
  },
  staffBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.highlight.teal,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  staffBadgeText: {
    fontSize: 11,
    color: colors.neutral.white,
    fontWeight: '700',
    marginLeft: 2,
  },
  serviceInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: responsiveFontSize.caption,
    color: colors.highlight.teal,
    fontWeight: '500',
    marginBottom: 6,
  },
  serviceDescription: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    lineHeight: responsiveFontSize.caption * 1.5,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: responsiveSpacing.sm + 4,
    paddingTop: responsiveSpacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceLabel: {
    fontSize: responsiveFontSize.caption - 1,
    color: colors.neutral.textSecondary,
    marginRight: 6,
    fontWeight: '400',
  },
  servicePrice: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.highlight.teal,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.background,
    paddingHorizontal: responsiveSpacing.sm + 4,
    paddingVertical: 6,
    borderRadius: 12,
  },
  serviceDuration: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textPrimary,
    marginLeft: 4,
    fontWeight: '500',
  },
  selectedBadge: {
    position: 'absolute',
    top: responsiveSpacing.md,
    right: responsiveSpacing.md,
  },

  // Modal - matching CustomerHomeScreen style
  modalContainer: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.lg,
    paddingTop: responsiveSpacing.xl,
    paddingBottom: responsiveSpacing.md,
    backgroundColor: colors.warm.beige,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSpacing.md,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  modalSubtitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginTop: 4,
    fontWeight: '400',
  },
  modalContent: {
    flex: 1,
    padding: responsiveSpacing.lg,
  },
  serviceInfoCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: responsiveSpacing.lg + 4,
    marginBottom: responsiveSpacing.lg,
    alignItems: 'center',
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  modalServiceIcon: {
    width: 100,
    height: 100,
    borderRadius: 16,
    marginBottom: responsiveSpacing.md,
  },
  modalServiceDescription: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: responsiveSpacing.lg,
    lineHeight: responsiveFontSize.body * 1.5,
    fontWeight: '400',
  },
  serviceMetrics: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.neutral.background,
    borderRadius: 12,
    padding: responsiveSpacing.md,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: colors.neutral.border,
    marginHorizontal: responsiveSpacing.md,
  },
  metricLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginTop: 6,
    fontWeight: '400',
  },
  metricValue: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
    marginTop: 4,
  },

  // Options - matching CustomerHomeScreen card style
  optionsSection: {
    marginBottom: responsiveSpacing.md,
  },
  sectionTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.md,
  },
  optionGroup: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: responsiveSpacing.lg,
    marginBottom: responsiveSpacing.md,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  optionTitle: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.md,
  },
  required: {
    color: colors.feedback.error,
    fontWeight: '600',
  },
  choiceCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.background,
    marginBottom: responsiveSpacing.sm,
    overflow: 'hidden',
  },
  choiceCardSelected: {
    borderColor: colors.highlight.teal,
    backgroundColor: colors.warm.beige,
    borderWidth: 2,
  },
  choiceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: responsiveSpacing.md,
  },
  choiceText: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textPrimary,
    flex: 1,
    fontWeight: '400',
  },
  choiceTextSelected: {
    color: colors.highlight.teal,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: colors.highlight.teal,
    backgroundColor: colors.highlight.teal,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Quantity - matching CustomerHomeScreen style
  quantitySection: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: responsiveSpacing.lg,
    marginBottom: responsiveSpacing.md,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveSpacing.sm,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.highlight.teal,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  quantityButtonDisabled: {
    backgroundColor: colors.neutral.background,
    shadowOpacity: 0,
    elevation: 0,
  },
  quantityDisplay: {
    marginHorizontal: responsiveSpacing.xl,
    minWidth: 60,
    alignItems: 'center',
    backgroundColor: colors.neutral.background,
    paddingVertical: responsiveSpacing.sm,
    paddingHorizontal: responsiveSpacing.md,
    borderRadius: 12,
  },
  quantityText: {
    fontSize: responsiveFontSize.heading1,
    fontWeight: '600',
    color: colors.primary.navy,
  },

  // Price Summary - matching CustomerHomeScreen card style
  priceSummary: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: responsiveSpacing.lg,
    marginBottom: responsiveSpacing.md,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveSpacing.sm,
  },
  summaryLabel: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    fontWeight: '400',
  },
  summaryValue: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.neutral.textPrimary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.neutral.border,
    marginVertical: responsiveSpacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  totalValue: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '600',
    color: colors.highlight.teal,
  },

  // Modal Footer - matching CustomerHomeScreen button style
  modalFooter: {
    padding: responsiveSpacing.lg,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: colors.highlight.teal,
    paddingVertical: responsiveSpacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: colors.neutral.white,
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    marginRight: responsiveSpacing.sm,
  },

  // Quantity Input Styles
  quantityInputContainer: {
    marginTop: responsiveSpacing.sm,
  },
  quantityInputCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsiveSpacing.sm,
  },
  quantityInputLabel: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textPrimary,
    marginLeft: responsiveSpacing.sm,
    flex: 1,
    fontWeight: '400',
  },
  quantityInputField: {
    marginTop: responsiveSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.highlight.teal,
    paddingHorizontal: responsiveSpacing.md,
    paddingVertical: responsiveSpacing.sm,
  },
  quantityInputText: {
    flex: 1,
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textPrimary,
    fontWeight: '500',
    paddingVertical: responsiveSpacing.xs,
  },
  quantityInputButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.xs,
  },
  quantityInputButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.warm.beige,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.highlight.teal,
  },
});
