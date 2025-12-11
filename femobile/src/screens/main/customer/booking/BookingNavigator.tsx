import React, { useState, useEffect } from 'react';
import { View, Alert, BackHandler, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
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
  paymentService,
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
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingMode, setBookingMode] = useState<'single' | 'multiple' | 'recurring'>('single');
  const [recurringConfig, setRecurringConfig] = useState<any>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState<boolean>(false);
  const [postData, setPostData] = useState<any>(null);
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
    setSelectedDates([]);
    setSelectedTime('');
    setBookingMode('single');
    setRecurringConfig(null);
    setSelectedEmployeeId(null);
    setSelectedEmployee(null);
    setIsCreatingPost(false);
    setPostData(null);
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
          addressId: response.addressId, // Keep as string - don't convert to number
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

  // Handle VNPay deep link redirect
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('🔗 Deep link received:', url);

      // Check if this is VNPay result callback
      if (url.includes('housekeeping://payment/vnpay-result')) {
        // Dismiss any open browser
        await WebBrowser.dismissBrowser();
        
        try {
          // Parse URL params
          const urlObj = new URL(url.replace('housekeeping://', 'https://'));
          const params = new URLSearchParams(urlObj.search);
          
          const status = params.get('status');
          const responseCode = params.get('responseCode');
          const transactionNo = params.get('transactionNo');
          const amount = params.get('amount');
          
          console.log('💳 VNPay payment result:', { status, responseCode, transactionNo, amount });
          
          if (status === 'success' && responseCode === '00') {
            // Payment successful - navigate to success screen
            setCurrentStep(BookingStep.SUCCESS);
            Alert.alert(
              'Thanh toán thành công',
              `Mã giao dịch: ${transactionNo}\nSố tiền: ${amount ? Number(amount).toLocaleString() : 'N/A'} VND`,
              [{ text: 'OK' }]
            );
          } else {
            // Payment failed
            Alert.alert(
              'Thanh toán thất bại',
              'Vui lòng thử lại hoặc chọn phương thức thanh toán khác',
              [
                { text: 'Thử lại', onPress: () => setCurrentStep(BookingStep.CONFIRMATION) },
                { text: 'Đóng' }
              ]
            );
          }
        } catch (error) {
          console.error('❌ Error parsing VNPay deep link:', error);
        }
      }
    };

    // Listen for deep links when app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

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

  const handleBookingConfirmation = async (
    bookingData: BookingRequest, 
    images?: Array<{ uri: string; name: string; type: string }>
  ) => {
    setLoading(true);
    try {
      console.log('🚀 Sending validated booking request:', bookingData);
      if (images) {
        console.log('📎 With images:', images.length);
      }
      
      let response: any;
      
      // Route to correct API based on booking mode
      if (bookingMode === 'recurring') {
        const customerId = userInfo?.id || (authUser as any)?.customerId || (authUser as any)?.id;
        if (!customerId) {
          throw new Error('Không tìm thấy thông tin khách hàng');
        }
        console.log('📅 Creating recurring booking for customer:', customerId);
        const recurringResponse: any = await bookingService.createRecurringBooking(customerId, bookingData);
        console.log('📅 Recurring response:', recurringResponse);
        
        // Transform recurring response to match single booking format for success screen
        // Recurring API returns: { recurringBooking, generatedBookingIds, totalBookingsToBeCreated }
        const recurringBooking = recurringResponse.recurringBooking || recurringResponse;
        
        // Map recurringBookingDetails to bookingDetails/serviceDetails format
        const serviceDetails = (recurringBooking.recurringBookingDetails || []).map((detail: any) => ({
          service: detail.service,
          quantity: detail.quantity,
          pricePerUnit: detail.pricePerUnit,
          formattedPricePerUnit: detail.formattedPricePerUnit,
          subTotal: detail.subTotal,
          formattedSubTotal: detail.formattedSubTotal,
          selectedChoices: detail.selectedChoices || [],
          formattedDuration: detail.formattedDuration || detail.duration || `${detail.service?.estimatedDurationHours || 2}h`,
        }));
        
        response = {
          bookingId: recurringBooking.recurringBookingId,
          customerId: recurringBooking.customerId,
          customerName: recurringBooking.customerName,
          address: recurringBooking.address,
          bookingDetails: serviceDetails,
          serviceDetails: serviceDetails,
          totalPrice: recurringBooking.recurringBookingDetails?.reduce(
            (sum: number, detail: any) => sum + (detail.subTotal || 0), 0
          ) || 0,
          status: recurringBooking.status,
          statusDisplay: recurringBooking.statusDisplay,
          createdAt: recurringBooking.createdAt,
          note: recurringBooking.note,
          title: recurringBooking.title,
          // Add recurring-specific info
          isRecurring: true,
          recurringInfo: {
            recurrenceType: recurringBooking.recurrenceType,
            recurrenceTypeDisplay: recurringBooking.recurrenceTypeDisplay,
            recurrenceDays: recurringBooking.recurrenceDays,
            recurrenceDaysDisplay: recurringBooking.recurrenceDaysDisplay,
            bookingTime: recurringBooking.bookingTime, // Add booking time
            startDate: recurringBooking.startDate,
            endDate: recurringBooking.endDate,
            totalGeneratedBookings: recurringResponse.totalGeneratedBookings || recurringBooking.totalGeneratedBookings,
            totalBookingsToBeCreated: recurringResponse.totalBookingsToBeCreated,
            generatedBookingIds: recurringResponse.generatedBookingIds,
            upcomingBookings: recurringBooking.upcomingBookings,
          }
        };
      } else if (bookingMode === 'multiple') {
        console.log('📅 Creating multiple bookings for dates:', selectedDates.length);
        const multipleResponse: any = await bookingService.createMultipleBookings(bookingData, images);
        console.log('📅 Multiple response:', JSON.stringify(multipleResponse, null, 2));
        
        // Transform multiple response to match single booking format for success screen
        // Multiple API returns: { totalBookingsCreated, successfulBookings, failedBookings, bookings[], errors[], totalAmount, formattedTotalAmount }
        const firstBooking = multipleResponse.bookings?.[0] || {};
        console.log('📅 First booking:', JSON.stringify(firstBooking, null, 2));
        
        response = {
          bookingId: firstBooking.bookingId,
          bookingCode: firstBooking.bookingCode,
          customerId: firstBooking.customerId,
          customerName: firstBooking.customerName,
          // API returns customerInfo, not address
          address: firstBooking.customerInfo || firstBooking.address,
          customerInfo: firstBooking.customerInfo,
          bookingDetails: firstBooking.bookingDetails || firstBooking.serviceDetails || [],
          serviceDetails: firstBooking.serviceDetails,
          totalPrice: multipleResponse.totalAmount || multipleResponse.bookings?.reduce(
            (sum: number, booking: any) => sum + (booking.totalAmount || booking.totalPrice || 0), 0
          ) || 0,
          totalAmount: multipleResponse.totalAmount,
          formattedTotalAmount: multipleResponse.formattedTotalAmount,
          status: firstBooking.status,
          statusDisplay: firstBooking.statusDisplay,
          bookingTime: firstBooking.bookingTime,
          createdAt: firstBooking.createdAt,
          title: firstBooking.title,
          note: firstBooking.note,
          paymentInfo: firstBooking.paymentInfo,
          assignedEmployees: firstBooking.assignedEmployees || [],
          // Add multiple-specific info
          isMultiple: true,
          multipleInfo: {
            totalBookingsCreated: multipleResponse.totalBookingsCreated,
            successfulBookings: multipleResponse.successfulBookings,
            failedBookings: multipleResponse.failedBookings,
            bookings: multipleResponse.bookings,
            errors: multipleResponse.errors,
            totalAmount: multipleResponse.totalAmount,
            formattedTotalAmount: multipleResponse.formattedTotalAmount,
          }
        };
        console.log('📅 Transformed response for success screen:', JSON.stringify(response, null, 2));
      } else {
        response = await bookingService.createBooking(bookingData, images);
      }
      
      console.log('🚀 Booking created successfully:', response);
      
      // Set booking result
      setBookingResult(response);
      
      // Clear serviceId from route params immediately after successful booking
      if (navigation) {
        navigation.setParams({ serviceId: undefined });
      }

      // TODO: VNPay integration - temporarily disabled
      // Will implement proper deep linking flow later
      /*
      const selectedMethod = availablePaymentMethods.find(m => m.methodId === selectedPaymentMethodId);
      
      if (selectedMethod?.methodCode === 'VNPAY') {
        console.log('💳 Processing VNPay payment for booking:', response.bookingId);
        // ... VNPay payment flow ...
      }
      */
      
      // For all payment methods, go directly to success screen
      goToNextStep();
      
    } catch (error: any) {
      console.error('❌ Booking creation error:', error);
      // Re-throw error to be handled by BookingConfirmation
      throw error;
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
    setSelectedDates([]);
    setSelectedTime('');
    setBookingMode('single');
    setRecurringConfig(null);
    setSelectedEmployeeId(null);
    setSelectedEmployee(null);
    setIsCreatingPost(false);
    setPostData(null);
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
    setSelectedDates([]);
    setSelectedTime('');
    setBookingMode('single');
    setRecurringConfig(null);
    setSelectedEmployeeId(null);
    setSelectedEmployee(null);
    setIsCreatingPost(false);
    setPostData(null);
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
    setSelectedDates([]);
    setSelectedTime('');
    setBookingMode('single');
    setRecurringConfig(null);
    setSelectedEmployeeId(null);
    setSelectedEmployee(null);
    setIsCreatingPost(false);
    setPostData(null);
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
            selectedDates={selectedDates}
            selectedTime={selectedTime}
            bookingMode={bookingMode}
            recurringConfig={recurringConfig}
            totalPrice={totalPrice}
            onDatesSelect={setSelectedDates}
            onTimeSelect={setSelectedTime}
            onBookingModeChange={setBookingMode}
            onRecurringConfigChange={setRecurringConfig}
            onNext={handleTimeSelection}
            onBack={goToPreviousStep}
          />
        );

      case BookingStep.EMPLOYEE_SELECTION:
        return (
          <EmployeeSelection
            selectedService={selectedService}
            selectedLocation={selectedLocation}
            selectedDates={selectedDates}
            selectedTime={selectedTime}
            bookingMode={bookingMode}
            selectedEmployeeId={selectedEmployeeId}
            isCreatingPost={isCreatingPost}
            postData={postData}
            onEmployeeSelect={handleEmployeeSelect}
            onPostDataChange={setPostData}
            onCreatePostToggle={setIsCreatingPost}
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
            selectedDates={selectedDates}
            selectedTime={selectedTime}
            bookingMode={bookingMode}
            recurringConfig={recurringConfig}
            selectedEmployeeId={selectedEmployeeId}
            selectedEmployee={selectedEmployee}
            isCreatingPost={isCreatingPost}
            postData={postData}
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
            navigation={navigation}
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
