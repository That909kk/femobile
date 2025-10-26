import React, { useState, useEffect } from 'react';
import { View, Alert, BackHandler } from 'react-native';
import { ServiceSelection } from './ServiceSelection';
import { LocationSelection } from './LocationSelection';
import { TimeSelection } from './TimeSelection';
import { EmployeeSelection } from './EmployeeSelection';
import { BookingConfirmation } from './BookingConfirmation';
import { BookingSuccess } from './BookingSuccess';
import { ProgressIndicator } from './ProgressIndicator';
import { type LocationData, type SelectedOption, BookingStep } from './types';
import {
  bookingService,
  type Service,
  type PaymentMethod,
  type Employee
} from '../../../../services';
import { type BookingRequest, type BookingResponse } from '../../../../types/booking';
import { useUserInfo } from '../../../../hooks';
import { useAuthStore } from '../../../../store/authStore';
import { commonStyles } from './styles';

interface BookingNavigatorProps {
  onClose?: () => void;
  navigation?: any;
  initialServiceId?: string;
}

export const BookingNavigator: React.FC<BookingNavigatorProps> = ({
  onClose,
  navigation,
  initialServiceId
}) => {
  const { userInfo } = useUserInfo();
  const { isAuthenticated, user: authUser } = useAuthStore();
  
  // State management
  const [currentStep, setCurrentStep] = useState<BookingStep>(BookingStep.SERVICE_SELECTION);
  const [loading, setLoading] = useState(false);
  
  // Booking data
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);
  const [preloadedDefaultAddress, setPreloadedDefaultAddress] = useState<LocationData | null>(null);
  
  // New states for API integration
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethod[]>([]);
  const [bookingNote, setBookingNote] = useState<string>('');
  const [promoCode, setPromoCode] = useState<string>('');

  // Preload default address when component mounts and reset booking state
  useEffect(() => {
    // Reset to initial state when component mounts
    // This ensures fresh start when user navigates back to booking
    setCurrentStep(BookingStep.SERVICE_SELECTION);
    setSelectedService(null);
    setSelectedOptions([]);
    setSelectedQuantity(1);
    setSelectedDate('');
    setSelectedTime('');
    setSelectedEmployeeId(null);
    setSelectedEmployee(null);
    setTotalPrice(0);
    setBookingResult(null);
    setBookingNote('');
    setPromoCode('');
    
    if (isAuthenticated && userInfo?.id) {
      preloadDefaultAddress();
      loadPaymentMethods();
    }
  }, [isAuthenticated, userInfo, authUser]);

  const preloadDefaultAddress = async () => {
    try {
      const customerId = userInfo?.id;
      if (!customerId) return;

      console.log('🔄 Preloading default address for:', customerId);
      const response = await bookingService.getDefaultAddress(customerId);

      if (response && response.addressId) {
        const addressData: LocationData = {
          addressId: Number(response.addressId) || undefined,
          fullAddress: response.fullAddress,
          ward: response.ward,
          district: '', // DefaultAddressResponse doesn't have district
          city: response.city,
          latitude: response.latitude,
          longitude: response.longitude,
          isDefault: response.isDefault
        };
        setPreloadedDefaultAddress(addressData);
        setSelectedLocation(addressData); // Auto-select as default
        console.log('✅ Default address preloaded:', addressData);
      } else {
        console.log('ℹ️ No default address available');
        setPreloadedDefaultAddress(null);
      }
    } catch (error) {
      console.error('❌ Failed to preload default address:', error);
      setPreloadedDefaultAddress(null);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      console.log('🔄 Loading payment methods...');
      const response = await bookingService.getPaymentMethods();

      if (response && Array.isArray(response)) {
        setAvailablePaymentMethods(response);
        // Auto-select first available payment method
        if (response.length > 0) {
          setSelectedPaymentMethodId(response[0].methodId);
        }
        console.log('✅ Payment methods loaded:', response);
      } else {
        console.log('ℹ️ No payment methods available');
        setAvailablePaymentMethods([]);
      }
    } catch (error) {
      console.error('❌ Failed to load payment methods:', error);
      setAvailablePaymentMethods([]);
    }
  };

  // Handle back button on Android
  useEffect(() => {
    const backAction = () => {
      if (currentStep > BookingStep.SERVICE_SELECTION) {
        goToPreviousStep();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentStep]);

  const goToNextStep = () => {
    if (currentStep < BookingStep.SUCCESS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > BookingStep.SERVICE_SELECTION) {
      setCurrentStep(currentStep - 1);
    } else if (onClose) {
      onClose();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  const handleServiceSelection = (
    service: Service,
    options: SelectedOption[],
    calculatedPrice?: number,
    quantity?: number,
  ) => {
    const normalizedQuantity = Math.max(1, quantity ?? 1);
    const derivedPrice =
      calculatedPrice !== undefined ? calculatedPrice : service.basePrice * normalizedQuantity;

    setSelectedService(service);
    setSelectedOptions(options);
    setSelectedQuantity(normalizedQuantity);
    setTotalPrice(derivedPrice);

    console.log(
      '🎯 Service selected:',
      service.name,
      'with options:',
      options,
      'quantity:',
      normalizedQuantity,
      'price:',
      derivedPrice,
    );

    goToNextStep();
  };

  const handleLocationSelection = (location: LocationData) => {
    setSelectedLocation(location);
    goToNextStep();
  };

  const handleTimeSelection = () => {
    goToNextStep();
  };

  const handleEmployeeSelect = (employeeId: string | null, employee: Employee | null = null) => {
    setSelectedEmployeeId(employeeId);
    setSelectedEmployee(employee);
  };

  const handleEmployeeSelection = () => {
    goToNextStep();
  };

  const handleBookingConfirmation = async (bookingData: BookingRequest) => {
    setLoading(true);
    try {
      console.log('🚀 Sending validated booking request:', bookingData);
      
      const response = await bookingService.createBooking(bookingData);
      console.log('🚀 Booking created successfully:', response);
      
      // Set booking result and navigate to success screen
      setBookingResult(response);
      
      // Clear serviceId from route params immediately after successful booking
      // This ensures if user navigates via bottom tab, no service will be pre-selected
      if (navigation) {
        navigation.setParams({ serviceId: undefined });
      }
      
      goToNextStep(); // Navigate to SUCCESS step which shows BookingSuccess component
      
    } catch (error: any) {
      console.error('❌ Booking creation error:', error);
      
      let errorMessage = 'Có lỗi xảy ra khi tạo đặt lịch. Vui lòng thử lại.';
      let errorTitle = 'Lỗi đặt lịch';
      
      // Handle specific API errors
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check for specific error codes
        if (errorData.errorCode === 'BOOKING_CREATION_FAILED') {
          errorTitle = 'Không thể tạo đặt lịch';
          
          // Check if it's a rule/option validation error
          if (errorData.message && errorData.message.includes('RuleCondition')) {
            errorMessage = 'Có lỗi với các tùy chọn dịch vụ đã chọn. Vui lòng:\n\n' +
                          '1. Kiểm tra lại các tùy chọn dịch vụ\n' +
                          '2. Thử chọn lại dịch vụ từ đầu\n' +
                          '3. Liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn';
          } else {
            // Generic BOOKING_CREATION_FAILED error
            errorMessage = 'Hệ thống không thể xử lý yêu cầu đặt lịch của bạn.\n\n' +
                          'Vui lòng thử lại hoặc liên hệ hỗ trợ khách hàng.';
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.validationErrors && Array.isArray(errorData.validationErrors) && errorData.validationErrors.length > 0) {
          errorMessage = errorData.validationErrors.join('\n');
        } else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          errorMessage = errorData.errors.join('\n');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBookings = () => {
    // Reset all state before navigating
    setCurrentStep(BookingStep.SERVICE_SELECTION);
    setSelectedService(null);
    setSelectedOptions([]);
    setSelectedQuantity(1);
    setSelectedLocation(null);
    setSelectedDate('');
    setSelectedTime('');
    setSelectedEmployeeId(null);
    setSelectedEmployee(null);
    setTotalPrice(0);
    setBookingResult(null);
    setBookingNote('');
    setPromoCode('');
    
    if (onClose) {
      onClose();
    } else if (navigation) {
      // Reset the Booking screen params before navigating away
      navigation.setParams({ serviceId: undefined });
      navigation.navigate('CustomerOrders');
    }
  };

  const handleBookMore = () => {
    // Reset all state to start over
    setCurrentStep(BookingStep.SERVICE_SELECTION);
    setSelectedService(null);
    setSelectedOptions([]);
    setSelectedQuantity(1);
    setSelectedLocation(preloadedDefaultAddress); // Keep default address
    setSelectedDate('');
    setSelectedTime('');
    setSelectedEmployeeId(null);
    setSelectedEmployee(null);
    setTotalPrice(0);
    setBookingResult(null);
    setBookingNote('');
    setPromoCode('');
    
    // Clear the initial serviceId param if exists
    if (navigation) {
      navigation.setParams({ serviceId: undefined });
    }
    // Keep payment method selection
    // No need to navigate - just reset state to SERVICE_SELECTION step
  };

  const handleGoHome = () => {
    // Reset all state before going home
    setCurrentStep(BookingStep.SERVICE_SELECTION);
    setSelectedService(null);
    setSelectedOptions([]);
    setSelectedQuantity(1);
    setSelectedLocation(null);
    setSelectedDate('');
    setSelectedTime('');
    setSelectedEmployeeId(null);
    setSelectedEmployee(null);
    setTotalPrice(0);
    setBookingResult(null);
    setBookingNote('');
    setPromoCode('');
    
    if (onClose) {
      onClose();
    } else if (navigation) {
      // Reset the Booking screen params before navigating away
      navigation.setParams({ serviceId: undefined });
      navigation.navigate('CustomerHome');
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case BookingStep.SERVICE_SELECTION:
        return (
          <ServiceSelection
            selectedService={selectedService}
            selectedOptions={selectedOptions}
            onNext={handleServiceSelection}
            onClose={onClose || (() => navigation.goBack())}
            initialServiceId={initialServiceId}
          />
        );

      case BookingStep.LOCATION_SELECTION:
        return (
          <LocationSelection
            selectedLocation={selectedLocation || preloadedDefaultAddress}
            preloadedDefaultAddress={preloadedDefaultAddress}
            onNext={handleLocationSelection}
            onBack={goToPreviousStep}
          />
        );

      case BookingStep.TIME_SELECTION:
        return (
          <TimeSelection
            selectedService={selectedService}
            selectedLocation={selectedLocation}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedEmployeeId={selectedEmployeeId}
            totalPrice={totalPrice}
            onDateSelect={setSelectedDate}
            onTimeSelect={setSelectedTime}
            onEmployeeSelect={setSelectedEmployeeId}
            onNext={handleTimeSelection}
            onBack={goToPreviousStep}
          />
        );

      case BookingStep.EMPLOYEE_SELECTION:
        return (
          <EmployeeSelection
            selectedService={selectedService}
            selectedLocation={selectedLocation}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedEmployeeId={selectedEmployeeId}
            onEmployeeSelect={handleEmployeeSelect}
            onNext={handleEmployeeSelection}
            onBack={goToPreviousStep}
          />
        );

      case BookingStep.CONFIRMATION:
        return (
          <BookingConfirmation
            selectedService={selectedService}
            selectedOptions={selectedOptions}
            selectedLocation={selectedLocation}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedEmployeeId={selectedEmployeeId}
            selectedEmployee={selectedEmployee}
            totalPrice={totalPrice}
            quantity={selectedQuantity}
            availablePaymentMethods={availablePaymentMethods}
            selectedPaymentMethodId={selectedPaymentMethodId}
            bookingNote={bookingNote}
            promoCode={promoCode}
            onPaymentMethodSelect={setSelectedPaymentMethodId}
            onNoteChange={setBookingNote}
            onPromoCodeChange={setPromoCode}
            onConfirm={handleBookingConfirmation}
            onBack={goToPreviousStep}
            isSubmitting={loading}
          />
        );

      case BookingStep.SUCCESS:
        return bookingResult ? (
          <BookingSuccess
            bookingData={bookingResult}
            onViewBookings={handleViewBookings}
            onBookMore={handleBookMore}
            onGoHome={handleGoHome}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <View style={commonStyles.container}>
      {renderCurrentStep()}
    </View>
  );
};
