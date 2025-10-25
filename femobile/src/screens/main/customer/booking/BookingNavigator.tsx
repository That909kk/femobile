import React, { useState, useEffect } from 'react';
import { View, Alert, BackHandler } from 'react-native';
import { ServiceSelection } from './ServiceSelection';
import { LocationSelection } from './LocationSelection';
import { TimeSelection } from './TimeSelection';
import { EmployeeSelection } from './EmployeeSelection';
import { BookingConfirmation } from './BookingConfirmation';
import { BookingSuccess } from './BookingSuccess';
import { ProgressIndicator } from './ProgressIndicator';
import { type LocationData, type SelectedOption } from './types';
import { 
  bookingService, 
  serviceService,
  type Service, 
  type Address, 
  type Employee
} from '../../../../services';
import { type BookingRequest, type BookingResponse } from '../../../../types/booking';
import { useUserInfo } from '../../../../hooks';
import { useAuthStore } from '../../../../store/authStore';
import { commonStyles } from './styles';

export enum BookingStep {
  SERVICE_SELECTION = 1,
  LOCATION_SELECTION = 2,
  TIME_SELECTION = 3,
  EMPLOYEE_SELECTION = 4,
  CONFIRMATION = 5,
  SUCCESS = 6,
}

interface BookingNavigatorProps {
  onClose?: () => void;
  navigation?: any;
}

export const BookingNavigator: React.FC<BookingNavigatorProps> = ({
  onClose,
  navigation
}) => {
  const { userInfo } = useUserInfo();
  const { isAuthenticated, user: authUser } = useAuthStore();
  
  // State management
  const [currentStep, setCurrentStep] = useState<BookingStep>(BookingStep.SERVICE_SELECTION);
  const [loading, setLoading] = useState(false);
  
  // Booking data
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [preloadedDefaultAddress, setPreloadedDefaultAddress] = useState<LocationData | null>(null);
  
  // New states for API integration
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>([]);
  const [bookingNote, setBookingNote] = useState<string>('');
  const [promoCode, setPromoCode] = useState<string>('');

  // Preload default address when component mounts
  useEffect(() => {
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
        if (response.length > 0 && response[0].isActive) {
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

  const handleServiceSelection = (service: Service, options: SelectedOption[], calculatedPrice?: number) => {
    setSelectedService(service);
    setSelectedOptions(options);
    if (calculatedPrice !== undefined) {
      setTotalPrice(calculatedPrice);
    } else {
      // Fallback to base price if no calculated price
      setTotalPrice(service.basePrice);
    }
    console.log('🎯 Service selected:', service.name, 'with options:', options, 'price:', calculatedPrice);
    goToNextStep();
  };

  const handleLocationSelection = (location: LocationData) => {
    setSelectedLocation(location);
    goToNextStep();
  };

  const handleTimeSelection = () => {
    goToNextStep();
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
      goToNextStep(); // Navigate to SUCCESS step which shows BookingSuccess component
      
    } catch (error: any) {
      console.error('❌ Booking creation error:', error);
      
      let errorMessage = 'Có lỗi xảy ra khi tạo đặt lịch. Vui lòng thử lại.';
      
      // Handle specific API errors
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.join('\n');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Lỗi đặt lịch', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBookings = () => {
    if (onClose) {
      onClose();
    } else {
      navigation?.navigate('CustomerOrders');
    }
  };

  const handleBookMore = () => {
    // Reset all state to start over
    setCurrentStep(BookingStep.SERVICE_SELECTION);
    setSelectedService(null);
    setSelectedOptions([]);
    setSelectedLocation(preloadedDefaultAddress); // Keep default address
    setSelectedDate('');
    setSelectedTime('');
    setSelectedEmployeeId(null);
    setTotalPrice(0);
    setBookingResult(null);
    setBookingNote('');
    setPromoCode('');
    // Keep payment method selection
  };

  const handleGoHome = () => {
    if (onClose) {
      onClose();
    } else {
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
            onEmployeeSelect={setSelectedEmployeeId}
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
            // availableEmployees={[]} // Temporarily remove
            totalPrice={totalPrice}
            // availablePaymentMethods={availablePaymentMethods} // Now loaded in component
            selectedPaymentMethodId={selectedPaymentMethodId}
            bookingNote={bookingNote}
            promoCode={promoCode}
            onPaymentMethodSelect={setSelectedPaymentMethodId}
            onNoteChange={setBookingNote}
            onPromoCodeChange={setPromoCode}
            onConfirm={handleBookingConfirmation}
            onBack={goToPreviousStep}
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
      {currentStep !== BookingStep.SUCCESS && (
        <ProgressIndicator currentStep={currentStep} />
      )}
      {renderCurrentStep()}
    </View>
  );
};
