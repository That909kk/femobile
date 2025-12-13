import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Checkbox } from '../../../../components';
import { colors, responsiveSpacing, responsiveFontSize } from '../../../../styles';
import { useAuth } from '../../../../hooks';
import {
  bookingService,
  uploadService,
  type Service,
  type PaymentMethod,
  type BookingRequest,
  type Employee,
} from '../../../../services';
import type {
  BookingPreviewRequest,
  BookingPreviewResponse,
  MultipleBookingPreviewRequest,
  MultipleBookingPreviewResponse,
  RecurringBookingPreviewRequest,
  RecurringBookingPreviewResponse,
  FeeBreakdownItem,
  NewAddressRequest,
} from '../../../../types/bookingPreview';

// Helper to check if preview is RecurringBookingPreviewResponse
const isRecurringPreview = (preview: any): preview is RecurringBookingPreviewResponse => {
  // Check for various recurring-specific fields (API may return different field names)
  return preview && (
    ('totalOccurrences' in preview || 'occurrenceCount' in preview) && 
    ('pricePerOccurrence' in preview || 'formattedPricePerOccurrence' in preview || 'recurrenceType' in preview)
  );
};

// Helper to check if preview is MultipleBookingPreviewResponse
const isMultiplePreview = (preview: any): preview is MultipleBookingPreviewResponse => {
  return preview && 'bookingCount' in preview && 'pricePerBooking' in preview;
};

// Helper to check if preview is SingleBookingPreviewResponse
const isSinglePreview = (preview: any): preview is BookingPreviewResponse => {
  return preview && 'grandTotal' in preview && !('bookingCount' in preview) && !('totalOccurrences' in preview);
};
import { type LocationData, type SelectedOption, BookingStep } from './types';
import { commonStyles } from './styles';
import { ProgressIndicator } from './ProgressIndicator';

interface BookingConfirmationProps {
  selectedService: Service | null;
  selectedOptions: SelectedOption[];
  selectedLocation: LocationData | null;
  selectedDates: string[]; // Changed to support multiple dates
  selectedTime: string;
  bookingMode: 'single' | 'multiple' | 'recurring';
  recurringConfig: any;
  selectedEmployeeId: string | null;
  selectedEmployee: Employee | null;
  isCreatingPost: boolean;
  postData: any;
  totalPrice: number;
  quantity: number;
  availablePaymentMethods: PaymentMethod[];
  selectedPaymentMethodId: number | null;
  bookingNote: string;
  promoCode: string;
  onPaymentMethodSelect: (methodId: number) => void;
  onNoteChange: (note: string) => void;
  onPromoCodeChange: (code: string) => void;
  onConfirm: (bookingData: any, images?: Array<{ uri: string; name: string; type: string }>) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  selectedService,
  selectedOptions,
  selectedLocation,
  selectedDates,
  bookingMode,
  recurringConfig,
  isCreatingPost,
  postData,
  selectedTime,
  selectedEmployeeId,
  selectedEmployee,
  totalPrice,
  quantity,
  availablePaymentMethods,
  selectedPaymentMethodId,
  bookingNote,
  promoCode,
  onPaymentMethodSelect,
  onNoteChange,
  onPromoCodeChange,
  onConfirm,
  onBack,
  isSubmitting,
}) => {
  const applyPromoCode = () => {
    if (!promoCode.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã khuyến mãi');
      return;
    }
    Alert.alert('Thông báo', 'Mã khuyến mãi sẽ được kiểm tra khi xác nhận đơn.');
  };

  const accentColor = colors.highlight.teal;
  const warningColor = colors.feedback.warning;
  const successColor = colors.feedback.success;
  const dividerColor = colors.neutral.border;

  const selectedAddress = selectedLocation;
  const { user } = useAuth();

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptReschedule, setAcceptReschedule] = useState(false);
  const [finalPrice, setFinalPrice] = useState(totalPrice);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Preview state
  const [previewData, setPreviewData] = useState<BookingPreviewResponse | MultipleBookingPreviewResponse | RecurringBookingPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const bookingDateTime =
    selectedDates.length > 0 && selectedTime ? `${selectedDates[0]}T${selectedTime}:00` : '';
  const normalizedQuantity = Math.max(1, quantity || 1);

  useEffect(() => {
    setFinalPrice(totalPrice);
  }, [totalPrice]);

  // Fetch booking preview
  useEffect(() => {
    const fetchPreview = async () => {
      if (!selectedService || !selectedAddress) return;
      
      // Get customerId from user
      const customerId = (user as any)?.customerId || (user as any)?.id;
      
      // Get serviceId - handle both 'id' and 'serviceId' properties
      const serviceId = (selectedService as any).serviceId || (selectedService as any).id;
      if (!serviceId) {
        console.warn('[BookingConfirmation] No serviceId available:', selectedService);
        return;
      }
      
      // Check for addressId or build newAddress object
      const addressId = selectedAddress.addressId?.toString() || selectedAddress.id?.toString();
      
      // If no addressId, we need to use newAddress (for GPS or manual addresses)
      const hasExistingAddress = !!addressId;
      
      // For newAddress, we need customerId
      const newAddress = !hasExistingAddress ? {
        customerId: customerId, // Required for new address
        fullAddress: selectedAddress.fullAddress || selectedAddress.address || '',
        ward: selectedAddress.ward || '',
        city: selectedAddress.city || '',
        latitude: selectedAddress.latitude || null,
        longitude: selectedAddress.longitude || null,
      } : undefined;
      
      // Validate that we have either addressId or complete newAddress with customerId
      if (!hasExistingAddress) {
        if (!customerId) {
          console.warn('[BookingConfirmation] No customerId for new address');
          return;
        }
        if (!newAddress?.fullAddress || !newAddress?.ward || !newAddress?.city) {
          console.warn('[BookingConfirmation] Incomplete address data:', { addressId, newAddress });
          return;
        }
      }
      
      setPreviewLoading(true);
      setPreviewError(null);
      
      // Build bookingDetails array (required by API)
      const bookingDetails = [{
        serviceId: serviceId,
        quantity: normalizedQuantity,
        selectedChoiceIds: selectedOptions.map(opt => opt.choiceId),
      }];
      
      try {
        // Base address config - use addressId if available, otherwise newAddress
        const addressConfig = hasExistingAddress 
          ? { addressId: addressId }
          : { newAddress: newAddress };
          
        if (bookingMode === 'recurring' && recurringConfig) {
          // Recurring booking preview
          const request: RecurringBookingPreviewRequest = {
            ...addressConfig,
            recurrenceType: recurringConfig.recurrenceType || 'WEEKLY',
            recurrenceDays: recurringConfig.recurrenceDays || [],
            bookingTime: recurringConfig.bookingTime,
            startDate: recurringConfig.startDate,
            endDate: recurringConfig.endDate,
            bookingDetails: bookingDetails,
            note: bookingNote || '',
            promoCode: promoCode || undefined,
            paymentMethodId: selectedPaymentMethodId,
          };
          const response = await bookingService.getRecurringBookingPreview(request);
          setPreviewData(response);
        } else if (bookingMode === 'multiple' && selectedDates.length > 1) {
          // Multiple bookings preview
          const request: MultipleBookingPreviewRequest = {
            ...addressConfig,
            bookingTimes: selectedDates.map(date => `${date}T${selectedTime}:00`),
            bookingDetails: bookingDetails,
            note: bookingNote || '',
            promoCode: promoCode || undefined,
            paymentMethodId: selectedPaymentMethodId,
          };
          const response = await bookingService.getMultipleBookingPreview(request);
          setPreviewData(response);
        } else if (selectedDates.length > 0 && selectedTime) {
          // Single booking preview
          const request: BookingPreviewRequest = {
            ...addressConfig,
            bookingTime: `${selectedDates[0]}T${selectedTime}:00`,
            bookingDetails: bookingDetails,
            note: bookingNote || '',
            promoCode: promoCode || undefined,
            paymentMethodId: selectedPaymentMethodId,
          };
          const response = await bookingService.getBookingPreview(request);
          setPreviewData(response);
        }
      } catch (error: any) {
        console.error('Failed to fetch booking preview:', error);
        setPreviewError(error.message || 'Không thể tải thông tin chi phí');
      } finally {
        setPreviewLoading(false);
      }
    };

    fetchPreview();
  }, [selectedService, selectedOptions, normalizedQuantity, selectedAddress, selectedDates, selectedTime, bookingMode, recurringConfig, user, bookingNote, promoCode, selectedPaymentMethodId]);

  useEffect(() => {
    if (availablePaymentMethods.length > 0 && !selectedPaymentMethodId) {
      onPaymentMethodSelect(availablePaymentMethods[0].methodId);
    }
  }, [availablePaymentMethods, selectedPaymentMethodId, onPaymentMethodSelect]);

  const formatPrice = (price?: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price ?? 0);

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return 'Chưa chọn ngày';
    }

    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) {
      return dateString;
    }

    return parsedDate.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateShort = (dateString: string) => {
    if (!dateString) return '';
    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) return dateString;
    
    const day = parsedDate.getDate();
    const month = parsedDate.getMonth() + 1;
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const perUnitBasePrice = selectedService?.basePrice ?? 0;
  const perUnitOptionsTotal = selectedOptions.reduce(
    (sum, option) => sum + (option.priceAdjustment ?? 0),
    0,
  );
  const basePriceTotal = perUnitBasePrice * normalizedQuantity;
  const optionsTotal = perUnitOptionsTotal * normalizedQuantity;
  const calculatedSubtotal = basePriceTotal + optionsTotal;
  const selectionTotal = totalPrice || calculatedSubtotal;
  const effectiveFinalPrice = finalPrice ?? selectionTotal;
  const selectionAdjustment = selectionTotal - calculatedSubtotal;
  const finalAdjustment = effectiveFinalPrice - selectionTotal;

  const handleConfirmBooking = async () => {
    // Validate based on booking mode
    if (!selectedService || !selectedAddress) {
      Alert.alert('Thiếu thông tin', 'Vui lòng kiểm tra lại dịch vụ và địa chỉ.');
      return;
    }

    if (bookingMode === 'recurring') {
      // For recurring, validate recurringConfig instead of selectedDates
      if (!recurringConfig || !recurringConfig.startDate || !recurringConfig.bookingTime || !recurringConfig.recurrenceDays || recurringConfig.recurrenceDays.length === 0) {
        Alert.alert('Thiếu thông tin', 'Vui lòng kiểm tra lại cấu hình lịch định kỳ.');
        return;
      }
    } else {
      // For single and multiple, validate selectedDates and selectedTime
      if (selectedDates.length === 0 || !selectedTime) {
        Alert.alert('Thiếu thông tin', 'Vui lòng kiểm tra lại thời gian đặt lịch.');
        return;
      }
    }

    if (!acceptTerms) {
      Alert.alert('Thông báo', 'Vui lòng đồng ý với điều khoản sử dụng.');
      return;
    }

    if (!acceptReschedule) {
      Alert.alert('Thông báo', 'Vui lòng xác nhận chính sách hủy/đổi lịch.');
      return;
    }

    if (!selectedPaymentMethodId) {
      Alert.alert('Thông báo', 'Vui lòng chọn phương thức thanh toán.');
      return;
    }

    // Validate title for booking post (when creating post without employee)
    if (isCreatingPost && !postData?.title?.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề cho bài đăng.');
      return;
    }

    const customerId = (user as any)?.customerId || (user as any)?.id;
    if (!selectedAddress.addressId && !customerId) {
      Alert.alert('Thiếu thông tin', 'Không tìm thấy mã khách hàng để lưu địa chỉ mới.');
      return;
    }

    setIsProcessing(true);
    try {
      const trimmedNote = bookingNote.trim();
      const trimmedPromoCode = promoCode.trim();
      const promoValue = trimmedPromoCode.length > 0 ? trimmedPromoCode : null;
      const noteValue = trimmedNote.length > 0 ? trimmedNote : undefined;

      const choiceIds = Array.from(new Set(selectedOptions.map((option) => option.choiceId)))
        .filter((id) => id !== null && id !== undefined && !isNaN(id));
      
      // Validate that we have valid choice IDs
      if (selectedOptions.length > 0 && choiceIds.length === 0) {
        Alert.alert(
          'Lỗi dữ liệu',
          'Không tìm thấy tùy chọn dịch vụ hợp lệ. Vui lòng chọn lại dịch vụ.'
        );
        return;
      }
      
      const addressId = selectedAddress.addressId ? String(selectedAddress.addressId) : undefined;
      const newAddressPayload = selectedAddress.addressId
        ? null
        : {
            customerId,
            fullAddress: selectedAddress.fullAddress ?? '',
            ward: selectedAddress.ward ?? '',
            district: selectedAddress.district ?? '',
            city: selectedAddress.city ?? '',
            latitude: selectedAddress.latitude,
            longitude: selectedAddress.longitude,
          };
      const assignmentsPayload = selectedEmployeeId
        ? [
            {
              serviceId: selectedService.serviceId,
              employeeId: selectedEmployeeId,
            },
          ]
        : null;

      const baseExpectedPrice =
        (Number.isFinite(finalPrice) && (finalPrice ?? 0) > 0 ? finalPrice : undefined) ??
        (totalPrice > 0 ? totalPrice : undefined) ??
        calculatedSubtotal;
      const baseUnitPrice =
        normalizedQuantity > 0 ? baseExpectedPrice / normalizedQuantity : baseExpectedPrice;

      let bookingData: any;

      if (bookingMode === 'recurring') {
        if (!recurringConfig || !recurringConfig.recurrenceType || !recurringConfig.recurrenceDays || !recurringConfig.startDate) {
          Alert.alert('Thiếu thông tin', 'Vui lòng cấu hình đầy đủ thông tin đặt lịch định kỳ.');
          return;
        }

        // Recurring booking has different format - no payment, price, or assignments
        // Thêm selectedChoiceIds để giống web
        bookingData = {
          addressId,
          newAddress: newAddressPayload,
          recurrenceType: recurringConfig.recurrenceType,
          recurrenceDays: recurringConfig.recurrenceDays,
          bookingTime: recurringConfig.bookingTime,
          startDate: recurringConfig.startDate,
          endDate: recurringConfig.endDate || null,
          note: noteValue,
          title: isCreatingPost && postData?.title?.trim() ? postData.title.trim() : undefined,
          promoCode: promoValue,
          bookingDetails: [
            {
              serviceId: selectedService.serviceId,
              quantity: normalizedQuantity,
              selectedChoiceIds: choiceIds.length > 0 ? choiceIds : undefined,
            },
          ],
        };

      } else if (bookingMode === 'multiple') {
        if (selectedDates.length < 2) {
          Alert.alert('Thiếu thông tin', 'Vui lòng chọn ít nhất 2 ngày.');
          return;
        }

        const bookingTimes = selectedDates.map(date => `${date}T${selectedTime}:00`);

        // Multiple booking - thêm additionalFeeIds giống web
        bookingData = {
          addressId,
          newAddress: newAddressPayload,
          bookingTimes,
          note: noteValue,
          title: isCreatingPost && postData?.title?.trim() ? postData.title.trim() : undefined,
          promoCode: promoValue,
          bookingDetails: [
            {
              serviceId: selectedService.serviceId,
              quantity: normalizedQuantity,
              expectedPrice: baseExpectedPrice,
              expectedPricePerUnit: baseUnitPrice,
              selectedChoiceIds: choiceIds.length > 0 ? choiceIds : undefined,
            },
          ],
          assignments: assignmentsPayload,
          paymentMethodId: selectedPaymentMethodId,
          additionalFeeIds: [], // Thêm field này giống web
        };

      } else {
        bookingData = {
          addressId,
          newAddress: newAddressPayload,
          bookingTime: bookingDateTime,
          bookingDetails: [
            {
              serviceId: selectedService.serviceId,
              quantity: normalizedQuantity,
              expectedPrice: baseExpectedPrice,
              expectedPricePerUnit: baseUnitPrice,
              selectedChoiceIds: choiceIds,
            },
          ],
          assignments: assignmentsPayload,
          paymentMethodId: selectedPaymentMethodId,
          promoCode: promoValue,
        };

        if (noteValue) {
          bookingData.note = noteValue;
        }

        // Thêm thông tin post CHỈ KHI TẠO BÀI ĐĂNG (booking post)
        if (isCreatingPost && postData) {
          if (postData.title?.trim()) {
            bookingData.title = postData.title.trim();
          }
        }
      }

      // Gọi API tạo booking với ảnh (nếu có)
      const images = isCreatingPost && postData?.images ? postData.images : undefined;
      await onConfirm(bookingData, images);
    } catch (error: any) {
      console.error('❌ Booking confirmation error:', error);
      
      let errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';
      let errorTitle = 'Lỗi';
      
      // Handle 504 Gateway Timeout specially for recurring bookings
      if (error.response?.status === 504 && bookingMode === 'recurring') {
        errorTitle = 'Quá thời gian chờ';
        errorMessage = 'Yêu cầu tạo lịch định kỳ đang mất nhiều thời gian hơn dự kiến.\n\n' +
                      'Có thể do:\n' +
                      '• Số lượng lịch hẹn quá lớn\n' +
                      '• Server đang xử lý nhiều yêu cầu\n\n' +
                      'Vui lòng:\n' +
                      '1. Kiểm tra lại danh sách đặt lịch sau 2-3 phút\n' +
                      '2. Hoặc giảm thời gian lặp lại (chọn khoảng ngắn hơn)\n' +
                      '3. Liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn';
        Alert.alert(errorTitle, errorMessage);
        return;
      }
      
      // Xử lý lỗi từ backend response
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Xử lý validation errors
        if (errorData.validationErrors && Array.isArray(errorData.validationErrors) && errorData.validationErrors.length > 0) {
          errorTitle = 'Thông tin không hợp lệ';
          errorMessage = errorData.validationErrors.join('\n');
        }
        // Xử lý conflicts (employee conflicts, scheduling conflicts)
        else if (errorData.conflicts && Array.isArray(errorData.conflicts) && errorData.conflicts.length > 0) {
          errorTitle = 'Xung đột lịch hẹn';
          const conflictMessages = errorData.conflicts.map((conflict: any) => {
            if (conflict.reason) {
              return `Nhân viên ${conflict.employeeId}: ${conflict.reason}`;
            }
            return `Nhân viên ${conflict.employeeId}: Xung đột lịch làm việc`;
          });
          errorMessage = conflictMessages.join('\n');
        }
        // Xử lý errors array
        else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          errorTitle = 'Lỗi đặt lịch';
          errorMessage = errorData.errors.join('\n');
        }
        // Xử lý message từ backend
        else if (errorData.message) {
          errorMessage = errorData.message;
          
          // Tùy chỉnh title dựa trên error code
          if (errorData.errorCode === 'BOOKING_CREATION_FAILED') {
            errorTitle = 'Không thể tạo đặt lịch';
          } else if (errorData.errorCode === 'VALIDATION_ERROR') {
            errorTitle = 'Thông tin không hợp lệ';
          } else if (errorData.errorCode) {
            errorTitle = 'Lỗi đặt lịch';
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const isConfirmDisabled =
    !acceptTerms || !acceptReschedule || isProcessing || isSubmitting;

  return (
    <View style={commonStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.warm.beige} />

      <View style={commonStyles.header}>
        <TouchableOpacity style={commonStyles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.primary.navy} />
        </TouchableOpacity>
        <View style={commonStyles.headerContent}>
          <Text style={commonStyles.headerTitle}>Xác nhận đặt lịch</Text>
          <Text style={commonStyles.headerSubtitle}>
            Kiểm tra kỹ thông tin trước khi tiếp tục
          </Text>
        </View>
      </View>

      {/* Progress Indicator */}
      <ProgressIndicator currentStep={BookingStep.CONFIRMATION} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: responsiveSpacing.md, paddingTop: responsiveSpacing.md, paddingBottom: responsiveSpacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Recurring Booking Info */}
        {bookingMode === 'recurring' && recurringConfig && (
          <View style={{
            backgroundColor: accentColor + '10',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: accentColor,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons name="information-circle" size={24} color={accentColor} style={{ marginRight: 12, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.cardTitle, { color: accentColor, marginBottom: 6 }]}>
                  Đặt lịch định kỳ
                </Text>
                <Text style={[commonStyles.cardDescription, { fontSize: 13, lineHeight: 18 }]}>
                  Hệ thống sẽ tự động tạo các lịch hẹn theo chu kỳ đã chọn. Quá trình này có thể mất 2-3 phút tùy thuộc vào số lượng lịch hẹn. Vui lòng kiên nhẫn chờ đợi.
                </Text>
              </View>
            </View>
          </View>
        )}
        
        <View style={commonStyles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.highlight.teal + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="briefcase-outline" size={18} color={accentColor} />
            </View>
            <Text style={commonStyles.sectionTitle}>Dịch vụ</Text>
          </View>
          <View style={commonStyles.card}>
            <View style={commonStyles.flexRowBetween}>
              <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.heading3, flex: 1 }]}>
                {selectedService?.name ?? 'Chưa chọn dịch vụ'}
              </Text>
            </View>
            {selectedService?.description ? (
              <Text style={[commonStyles.cardDescription, { marginTop: 8, lineHeight: 20 }]}>
                {selectedService.description}
              </Text>
            ) : null}
            
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: dividerColor }}>
              <View style={[commonStyles.flexRowBetween, { marginBottom: 6 }]}>
                <View style={commonStyles.flexRow}>
                  <Ionicons name="layers-outline" size={16} color={colors.neutral.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={commonStyles.cardDescription}>Số lượng</Text>
                </View>
                <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                  {normalizedQuantity}
                </Text>
              </View>
              <View style={commonStyles.flexRowBetween}>
                <View style={commonStyles.flexRow}>
                  <Ionicons name="time-outline" size={16} color={colors.neutral.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={commonStyles.cardDescription}>Thời lượng dự kiến</Text>
                </View>
                <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                  {selectedService?.estimatedDurationHours ?? 0} giờ
                </Text>
              </View>
            </View>

            {selectedOptions.length > 0 ? (
              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: dividerColor }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="options-outline" size={16} color={accentColor} style={{ marginRight: 6 }} />
                  <Text style={[commonStyles.cardDescription, { fontWeight: '700', fontSize: responsiveFontSize.body, color: colors.primary.navy }]}>
                    Tùy chọn đã chọn
                  </Text>
                </View>
                {selectedOptions.map((option, index) => {
                  const optionLabel =
                    normalizedQuantity > 1
                      ? `${option.choiceName} x${normalizedQuantity}`
                      : option.choiceName;
                  const optionTotal = (option.priceAdjustment ?? 0) * normalizedQuantity;

                  return (
                    <View
                      key={option.choiceId}
                      style={[
                        commonStyles.flexRowBetween, 
                        { 
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          backgroundColor: colors.warm.beige,
                          borderRadius: 8,
                          marginBottom: index < selectedOptions.length - 1 ? 8 : 0,
                        }
                      ]}
                    >
                      <Text style={[commonStyles.cardDescription, { flex: 1 }]}>{optionLabel}</Text>
                      <Text
                        style={[
                          commonStyles.cardDescription,
                          { color: accentColor, fontWeight: '700', fontSize: responsiveFontSize.body },
                        ]}
                      >
                        +{formatPrice(optionTotal)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* Fee Breakdown Section */}
            {previewLoading ? (
              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: dividerColor }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}>
                  <ActivityIndicator size="small" color={accentColor} />
                  <Text style={[commonStyles.cardDescription, { marginLeft: 8 }]}>Đang tính phí...</Text>
                </View>
              </View>
            ) : previewData && 'feeBreakdowns' in previewData ? (
              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: dividerColor }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="receipt-outline" size={16} color={accentColor} style={{ marginRight: 6 }} />
                  <Text style={[commonStyles.cardDescription, { fontWeight: '700', fontSize: responsiveFontSize.body, color: colors.primary.navy }]}>
                    Chi tiết phí
                  </Text>
                </View>

                {/* Multiple Booking Info - Show booking count */}
                {'bookingCount' in previewData && (previewData as MultipleBookingPreviewResponse).bookingCount > 1 && (
                  <View style={{ 
                    marginBottom: 12, 
                    padding: 12, 
                    backgroundColor: colors.highlight.teal + '15', 
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <Ionicons name="calendar-outline" size={18} color={accentColor} style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[commonStyles.cardDescription, { fontWeight: '600', color: colors.primary.navy }]}>
                        {(previewData as MultipleBookingPreviewResponse).bookingCount} lịch đặt
                      </Text>
                      <Text style={[commonStyles.cardDescription, { fontSize: 12, color: colors.neutral.textSecondary }]}>
                        Tất cả sử dụng cùng dịch vụ và địa chỉ
                      </Text>
                    </View>
                  </View>
                )}

                {/* Recurring Booking Info */}
                {isRecurringPreview(previewData) && (
                  <View style={{ 
                    marginBottom: 12, 
                    padding: 12, 
                    backgroundColor: colors.highlight.purple + '15', 
                    borderRadius: 8,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Ionicons name="repeat-outline" size={18} color={colors.highlight.purple} style={{ marginRight: 8 }} />
                      <Text style={[commonStyles.cardDescription, { fontWeight: '600', color: colors.primary.navy }]}>
                        Đặt lịch định kỳ
                      </Text>
                    </View>
                    <Text style={[commonStyles.cardDescription, { fontSize: 12, color: colors.neutral.textSecondary }]}>
                      {previewData.recurrenceDaysDisplay || `${previewData.totalOccurrences} lần`}
                    </Text>
                    <Text style={[commonStyles.cardDescription, { fontSize: 12, color: colors.neutral.textSecondary, marginTop: 2 }]}>
                      {previewData.startDate} - {previewData.endDate || 'Không giới hạn'}
                    </Text>
                  </View>
                )}
                
                {/* Subtotal - different display for each booking type */}
                {isMultiplePreview(previewData) ? (
                  <>
                    <View style={[commonStyles.flexRowBetween, { marginBottom: 8 }]}>
                      <Text style={commonStyles.cardDescription}>Tạm tính mỗi lịch</Text>
                      <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                        {previewData.formattedSubtotalPerBooking || formatPrice(previewData.subtotalPerBooking)}
                      </Text>
                    </View>
                  </>
                ) : isRecurringPreview(previewData) ? (
                  <>
                    {/* Tạm tính mỗi lần - giống web */}
                    <View style={[commonStyles.flexRowBetween, { marginBottom: 8 }]}>
                      <Text style={commonStyles.cardDescription}>Tạm tính mỗi lần</Text>
                      <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                        {previewData.formattedSubtotalPerOccurrence || 
                         (previewData.serviceItems && previewData.serviceItems.length > 0 
                           ? previewData.serviceItems[0]?.formattedSubTotal || formatPrice(previewData.serviceItems.reduce((sum, item) => sum + (item.subTotal || 0), 0))
                           : formatPrice(0)
                         )}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={[commonStyles.flexRowBetween, { marginBottom: 8 }]}>
                    <Text style={commonStyles.cardDescription}>Tạm tính dịch vụ</Text>
                    <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                      {(previewData as BookingPreviewResponse).formattedSubtotal || formatPrice((previewData as BookingPreviewResponse).subtotal || 0)}
                    </Text>
                  </View>
                )}

                {/* Fee breakdowns */}
                {previewData.feeBreakdowns && previewData.feeBreakdowns.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={[commonStyles.cardDescription, { fontWeight: '500', marginBottom: 4, color: colors.neutral.textSecondary }]}>
                      {isRecurringPreview(previewData) ? 'Phí mỗi lần:' : 
                       isMultiplePreview(previewData) ? 'Phí mỗi lịch:' : 'Phí dịch vụ:'}
                    </Text>
                    {previewData.feeBreakdowns.map((fee, index) => (
                      <View key={index} style={[commonStyles.flexRowBetween, { marginBottom: 4 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <Ionicons 
                            name={fee.systemSurcharge ? 'business-outline' : 'add-circle-outline'} 
                            size={14} 
                            color={colors.neutral.textSecondary} 
                            style={{ marginRight: 6 }} 
                          />
                          <Text style={[commonStyles.cardDescription, { flex: 1 }]}>
                            {fee.name}
                            {fee.type === 'PERCENT' && ` (${(fee.value * 100).toFixed(0)}%)`}
                          </Text>
                        </View>
                        <Text style={[
                          commonStyles.cardDescription, 
                          { 
                            fontWeight: '600',
                            color: colors.neutral.textPrimary 
                          }
                        ]}>
                          +{fee.formattedAmount || formatPrice(fee.amount)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Giá mỗi lần cho recurring */}
                {isRecurringPreview(previewData) && (
                  <View style={[commonStyles.flexRowBetween, { marginBottom: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: dividerColor }]}>
                    <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>Giá mỗi lần</Text>
                    <Text style={[commonStyles.cardDescription, { fontWeight: '700', color: colors.highlight.purple }]}>
                      {previewData.formattedPricePerOccurrence}
                    </Text>
                  </View>
                )}

                {/* Discount if any */}
                {'discountPerBooking' in previewData && (previewData as MultipleBookingPreviewResponse).discountPerBooking > 0 ? (
                  <View style={[commonStyles.flexRowBetween, { marginBottom: 8 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="gift-outline" size={14} color={colors.feedback.success} style={{ marginRight: 6 }} />
                      <Text style={[commonStyles.cardDescription, { color: colors.feedback.success }]}>Giảm giá mỗi lịch</Text>
                    </View>
                    <Text style={[commonStyles.cardDescription, { fontWeight: '600', color: colors.feedback.success }]}>
                      -{(previewData as MultipleBookingPreviewResponse).formattedDiscountPerBooking || formatPrice((previewData as MultipleBookingPreviewResponse).discountPerBooking)}
                    </Text>
                  </View>
                ) : (previewData as any).discountAmount > 0 && (
                  <View style={[commonStyles.flexRowBetween, { marginBottom: 8 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="gift-outline" size={14} color={colors.feedback.success} style={{ marginRight: 6 }} />
                      <Text style={[commonStyles.cardDescription, { color: colors.feedback.success }]}>Giảm giá</Text>
                    </View>
                    <Text style={[commonStyles.cardDescription, { fontWeight: '600', color: colors.feedback.success }]}>
                      -{(previewData as any).formattedDiscountAmount || formatPrice((previewData as any).discountAmount)}
                    </Text>
                  </View>
                )}

                {/* Invalid bookings warning for multiple booking */}
                {'invalidBookingsCount' in previewData && (previewData as MultipleBookingPreviewResponse).invalidBookingsCount > 0 && (
                  <View style={{ marginTop: 8, padding: 8, backgroundColor: colors.feedback.warning + '20', borderRadius: 6 }}>
                    <Text style={[commonStyles.cardDescription, { color: colors.feedback.warning, fontSize: 12 }]}>
                      ⚠️ {(previewData as MultipleBookingPreviewResponse).invalidBookingsCount} lịch không hợp lệ sẽ không được tạo
                    </Text>
                  </View>
                )}

                {/* Booking Times List for Multiple Booking */}
                {'bookingPreviews' in previewData && (previewData as MultipleBookingPreviewResponse).bookingPreviews?.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={[commonStyles.cardDescription, { fontWeight: '600', marginBottom: 8, color: colors.primary.navy }]}>
                      Các lịch đặt
                    </Text>
                    {(previewData as MultipleBookingPreviewResponse).bookingPreviews.slice(0, 5).map((booking, index) => (
                      <View 
                        key={index} 
                        style={[
                          commonStyles.flexRowBetween, 
                          { 
                            padding: 8, 
                            backgroundColor: colors.warm.beige, 
                            borderRadius: 6,
                            marginBottom: index < Math.min(4, (previewData as MultipleBookingPreviewResponse).bookingPreviews.length - 1) ? 6 : 0
                          }
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="calendar-outline" size={14} color={colors.neutral.textSecondary} style={{ marginRight: 6 }} />
                          <Text style={[commonStyles.cardDescription, { fontSize: 13 }]}>
                            {booking.bookingTime ? (() => {
                              const d = new Date(booking.bookingTime);
                              const day = String(d.getDate()).padStart(2, '0');
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const year = d.getFullYear();
                              const hour = String(d.getHours()).padStart(2, '0');
                              const minute = String(d.getMinutes()).padStart(2, '0');
                              return `${day}/${month}/${year} ${hour}:${minute}`;
                            })() : ''}
                          </Text>
                        </View>
                        <Text style={[commonStyles.cardDescription, { fontWeight: '600', fontSize: 13 }]}>
                          {booking.formattedGrandTotal}
                        </Text>
                      </View>
                    ))}
                    {(previewData as MultipleBookingPreviewResponse).bookingPreviews.length > 5 && (
                      <Text style={[commonStyles.cardDescription, { textAlign: 'center', marginTop: 8, fontSize: 12, color: colors.neutral.textSecondary }]}>
                        +{(previewData as MultipleBookingPreviewResponse).bookingPreviews.length - 5} lịch khác
                      </Text>
                    )}
                  </View>
                )}

                {/* Promotion info if available */}
                {previewData.promotionInfo && (
                  <View style={{ 
                    marginTop: 12, 
                    padding: 12, 
                    backgroundColor: colors.feedback.success + '15', 
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <Ionicons name="pricetag-outline" size={18} color={colors.feedback.success} style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[commonStyles.cardDescription, { fontWeight: '600', color: colors.feedback.success }]}>
                        {previewData.promotionInfo.promoCode}
                      </Text>
                      <Text style={[commonStyles.cardDescription, { fontSize: 12, color: colors.feedback.success }]}>
                        {previewData.promotionInfo.description}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: dividerColor }}>
                <View style={commonStyles.flexRowBetween}>
                  <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.heading3 }]}>Tổng cộng</Text>
                  <Text style={[commonStyles.cardPrice, { fontSize: 22 }]}>
                    {formatPrice(effectiveFinalPrice)}
                  </Text>
                </View>
                {previewError && (
                  <Text style={[commonStyles.cardDescription, { color: colors.feedback.error, marginTop: 8, fontSize: 12 }]}>
                    {previewError}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={commonStyles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.highlight.teal + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="calendar-outline" size={18} color={accentColor} />
            </View>
            <Text style={commonStyles.sectionTitle}>Thời gian & Địa điểm</Text>
          </View>
          <View style={commonStyles.card}>
            <View style={commonStyles.flexRow}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: accentColor + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}>
                <Ionicons name="time" size={24} color={accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.cardDescription, { fontWeight: '600', marginBottom: 4 }]}>
                  Thời gian
                </Text>
                
                {bookingMode === 'single' && (
                  <>
                    <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.body }]}>
                      {formatDate(selectedDates[0])}
                    </Text>
                    <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.heading3, color: accentColor, marginTop: 2 }]}>
                      {selectedTime || '--:--'}
                    </Text>
                  </>
                )}

                {bookingMode === 'multiple' && (
                  <>
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center',
                      backgroundColor: accentColor + '10',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      alignSelf: 'flex-start',
                      marginBottom: 8,
                    }}>
                      <Ionicons name="calendar" size={16} color={accentColor} style={{ marginRight: 6 }} />
                      <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.body, color: accentColor }]}>
                        {selectedDates.length} ngày
                      </Text>
                    </View>
                    <Text style={[commonStyles.cardDescription, { fontSize: 13, lineHeight: 18 }]}>
                      {selectedDates.slice(0, 3).map(date => formatDate(date)).join(', ')}
                      {selectedDates.length > 3 && `, +${selectedDates.length - 3} ngày nữa`}
                    </Text>
                    <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.heading3, color: accentColor, marginTop: 6 }]}>
                      {selectedTime || '--:--'}
                    </Text>
                  </>
                )}

                {bookingMode === 'recurring' && recurringConfig && (
                  <>
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center',
                      backgroundColor: accentColor + '10',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      alignSelf: 'flex-start',
                      marginBottom: 8,
                    }}>
                      <Ionicons name="repeat" size={16} color={accentColor} style={{ marginRight: 6 }} />
                      <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.body, color: accentColor }]}>
                        Định kỳ {recurringConfig.recurrenceType === 'WEEKLY' ? 'hàng tuần' : 'hàng tháng'}
                      </Text>
                    </View>
                    
                    <Text style={[commonStyles.cardDescription, { fontSize: 13, marginBottom: 4 }]}>
                      {recurringConfig.recurrenceType === 'WEEKLY' 
                        ? `Các ngày: ${recurringConfig.recurrenceDays?.map((day: number) => {
                            const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                            return dayNames[day];
                          }).join(', ')}`
                        : `Ngày ${recurringConfig.recurrenceDays?.[0]} hàng tháng`
                      }
                    </Text>
                    
                    <Text style={[commonStyles.cardDescription, { fontSize: 13, marginBottom: 4 }]}>
                      Từ {formatDateShort(recurringConfig.startDate)} 
                      {recurringConfig.endDate ? ` đến ${formatDateShort(recurringConfig.endDate)}` : ' (không giới hạn)'}
                    </Text>

                    <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.heading3, color: accentColor, marginTop: 6 }]}>
                      {recurringConfig.bookingTime?.substring(0, 5) || selectedTime || '--:--'}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          <View style={commonStyles.card}>
            <View style={commonStyles.flexRow}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: accentColor + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}>
                <Ionicons name="location" size={24} color={accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.cardDescription, { fontWeight: '600', marginBottom: 4 }]}>
                  Địa chỉ
                </Text>
                <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.body, lineHeight: 20 }]}>
                  {selectedAddress?.fullAddress ?? 'Chưa có địa chỉ'}
                </Text>
                {selectedAddress?.ward ? (
                  <Text style={[commonStyles.cardDescription, { marginTop: 4 }]}>
                    {selectedAddress.ward}, {selectedAddress.district},{' '}
                    {selectedAddress.city}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        <View style={commonStyles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: isCreatingPost ? colors.highlight.purple + '20' : colors.highlight.teal + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons 
                name={isCreatingPost ? "megaphone-outline" : "people-outline"} 
                size={18} 
                color={isCreatingPost ? colors.highlight.purple : accentColor} 
              />
            </View>
            <Text style={commonStyles.sectionTitle}>
              {isCreatingPost ? 'Thông tin bài đăng' : 'Nhân viên thực hiện'}
            </Text>
          </View>
          
          {/* Show Post Information if creating post */}
          {isCreatingPost && postData ? (
            <View style={[commonStyles.card, { borderLeftWidth: 4, borderLeftColor: colors.highlight.purple }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.highlight.purple + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="document-text" size={20} color={colors.highlight.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.body }]}>
                    {postData.title || 'Tiêu đề bài đăng'}
                  </Text>
                  <View style={{
                    marginTop: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    backgroundColor: colors.highlight.purple + '10',
                    borderRadius: 6,
                    alignSelf: 'flex-start',
                  }}>
                    <Text style={[commonStyles.cardDescription, { color: colors.highlight.purple, fontWeight: '600', fontSize: 10 }]}>
                      Bài đăng của bạn sẽ được hiển thị công khai sau khi quản trị viên duyệt
                    </Text>
                  </View>
                </View>
              </View>

              {/* Display all images */}
              {postData.images && postData.images.length > 0 && (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="images" size={16} color={colors.neutral.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={[commonStyles.cardDescription, { fontSize: 13, fontWeight: '600' }]}>
                      Hình ảnh đính kèm ({postData.images.length})
                    </Text>
                  </View>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={{ marginHorizontal: -16, paddingHorizontal: 16 }}
                  >
                    {postData.images.map((image: any, index: number) => (
                      <View 
                        key={index}
                        style={{
                          marginRight: 12,
                          borderRadius: 12,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: colors.neutral.border,
                        }}
                      >
                        <Image
                          source={{ uri: image.uri }}
                          style={{
                            width: 120,
                            height: 120,
                            backgroundColor: colors.neutral.background,
                          }}
                          resizeMode="cover"
                        />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          ) : selectedEmployeeId && selectedEmployee ? (
            <View style={commonStyles.card}>
              <View style={commonStyles.flexRow}>
                {selectedEmployee.avatar ? (
                  <Image
                    source={{ uri: selectedEmployee.avatar }}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      marginRight: 16,
                      backgroundColor: colors.neutral.border,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: accentColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 16,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.neutral.white,
                        fontWeight: '700',
                        fontSize: 24,
                      }}
                    >
                      {selectedEmployee.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[commonStyles.cardTitle, { marginBottom: 4 }]}>
                    {selectedEmployee.fullName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="star" size={14} color={colors.feedback.warning} style={{ marginRight: 4 }} />
                    <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                      {selectedEmployee.rating}
                    </Text>
                    <Text style={[commonStyles.cardDescription, { marginLeft: 8 }]}>
                      • {selectedEmployee.completedJobs} công việc
                    </Text>
                  </View>
                  {selectedEmployee.skills && selectedEmployee.skills.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                      {selectedEmployee.skills.slice(0, 2).map((skill: string, index: number) => (
                        <View
                          key={index}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            backgroundColor: accentColor + '20',
                            borderRadius: 6,
                            marginRight: 6,
                            marginBottom: 4,
                          }}
                        >
                          <Text style={[commonStyles.cardDescription, { color: accentColor, fontWeight: '600', fontSize: 11 }]}>
                            {skill}
                          </Text>
                        </View>
                      ))}
                      {selectedEmployee.skills.length > 2 && (
                        <Text style={[commonStyles.cardDescription, { fontSize: 11, alignSelf: 'center' }]}>
                          +{selectedEmployee.skills.length - 2}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
          ) : selectedEmployeeId ? (
            <View style={commonStyles.card}>
              <View style={commonStyles.flexRow}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: accentColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}
                >
                  <Text
                    style={{
                      color: colors.neutral.white,
                      fontWeight: '700',
                      fontSize: 20,
                    }}
                  >
                    NV
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[commonStyles.cardTitle, { marginBottom: 4 }]}>Nhân viên đã chọn</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: accentColor + '20',
                      borderRadius: 6,
                    }}>
                      <Text style={[commonStyles.cardDescription, { color: accentColor, fontWeight: '600' }]}>
                        #{selectedEmployeeId}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={commonStyles.card}>
              <View style={commonStyles.flexRow}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: accentColor + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Ionicons name="sparkles" size={24} color={accentColor} />
                </View>
                <Text style={[commonStyles.cardDescription, { flex: 1, lineHeight: 20 }]}>
                  Hệ thống sẽ tự động phân công nhân viên phù hợp nhất dựa trên
                  khu vực và lịch trống.
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={commonStyles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.highlight.teal + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="receipt-outline" size={18} color={accentColor} />
            </View>
            <Text style={commonStyles.sectionTitle}>Chi tiết giá</Text>
          </View>
          <View style={commonStyles.card}>
            {/* Loading state */}
            {previewLoading && (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <ActivityIndicator size="small" color={accentColor} />
                <Text style={[commonStyles.cardDescription, { marginTop: 8 }]}>Đang tính toán chi phí...</Text>
              </View>
            )}

            {/* Error state */}
            {previewError && !previewLoading && (
              <View style={{ backgroundColor: colors.feedback.error + '10', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                <Text style={[commonStyles.cardDescription, { color: colors.feedback.error }]}>{previewError}</Text>
              </View>
            )}

            {/* Preview data available - show full breakdown like web */}
            {previewData && !previewLoading && (
              <>
                {/* === RECURRING BOOKING PREVIEW === */}
                {isRecurringPreview(previewData) ? (
                  <>
                    {/* Thông tin định kỳ */}
                    <View style={{ 
                      marginBottom: 12, 
                      padding: 12, 
                      backgroundColor: colors.highlight.purple + '10', 
                      borderRadius: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: colors.highlight.purple,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Ionicons name="repeat" size={18} color={colors.highlight.purple} style={{ marginRight: 8 }} />
                        <Text style={[commonStyles.cardDescription, { fontWeight: '700', color: colors.highlight.purple }]}>
                          Lịch định kỳ - {previewData.recurrenceDaysDisplay}
                        </Text>
                      </View>
                      <Text style={[commonStyles.cardDescription, { fontSize: 12, color: colors.neutral.textSecondary }]}>
                        Từ {previewData.startDate} {previewData.endDate ? `đến ${previewData.endDate}` : '(không giới hạn)'}
                      </Text>
                      <Text style={[commonStyles.cardDescription, { fontSize: 12, color: colors.neutral.textSecondary, marginTop: 2 }]}>
                        Giờ thực hiện: {previewData.bookingTime}
                      </Text>
                    </View>

                    {/* Chi tiết dịch vụ */}
                    {previewData.serviceItems && previewData.serviceItems.length > 0 && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={[commonStyles.cardDescription, { fontWeight: '700', marginBottom: 8, color: colors.primary.navy }]}>
                          Chi tiết dịch vụ
                        </Text>
                        {previewData.serviceItems.map((item, index) => (
                          <View key={index} style={{ 
                            padding: 10, 
                            backgroundColor: colors.warm.beige, 
                            borderRadius: 8,
                            marginBottom: index < previewData.serviceItems.length - 1 ? 8 : 0
                          }}>
                            <View style={commonStyles.flexRowBetween}>
                              <Text style={[commonStyles.cardDescription, { fontWeight: '600', flex: 1 }]}>
                                {item.serviceName}
                              </Text>
                              <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                                {item.formattedSubTotal}
                              </Text>
                            </View>
                            <Text style={[commonStyles.cardDescription, { fontSize: 12, color: colors.neutral.textSecondary, marginTop: 2 }]}>
                              {item.formattedUnitPrice} × {item.quantity} {item.unit}
                            </Text>
                            {item.selectedChoices && item.selectedChoices.length > 0 && (
                              <View style={{ marginTop: 6 }}>
                                {item.selectedChoices.map((choice, cIndex) => (
                                  <View key={cIndex} style={[commonStyles.flexRowBetween, { paddingVertical: 2 }]}>
                                    <Text style={[commonStyles.cardDescription, { fontSize: 12, color: colors.neutral.textSecondary }]}>
                                      + {choice.optionName}: {choice.choiceName}
                                    </Text>
                                    <Text style={[commonStyles.cardDescription, { fontSize: 12, color: colors.neutral.textSecondary }]}>
                                      {choice.formattedPrice}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                            {item.estimatedDuration && (
                              <Text style={[commonStyles.cardDescription, { fontSize: 11, color: colors.neutral.textSecondary, marginTop: 4 }]}>
                                ⏱ Thời gian: {item.estimatedDuration}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Số lần thực hiện */}
                    <View style={[commonStyles.flexRowBetween, { paddingVertical: 6 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="calendar-number-outline" size={16} color={colors.neutral.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={commonStyles.cardDescription}>Số lần thực hiện</Text>
                      </View>
                      <Text style={[commonStyles.cardDescription, { fontWeight: '700', color: colors.highlight.purple }]}>
                        {previewData.occurrenceCount || previewData.totalOccurrences} lần
                      </Text>
                    </View>

                    {/* Tạm tính mỗi lần (giống web) */}
                    <View style={[commonStyles.flexRowBetween, { paddingVertical: 6 }]}>
                      <Text style={commonStyles.cardDescription}>Tạm tính mỗi lần</Text>
                      <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                        {previewData.formattedSubtotalPerOccurrence || 
                         (previewData.serviceItems && previewData.serviceItems.length > 0 
                           ? previewData.serviceItems[0]?.formattedSubTotal || formatPrice(previewData.serviceItems.reduce((sum, item) => sum + (item.subTotal || 0), 0))
                           : formatPrice(0)
                         )}
                      </Text>
                    </View>

                    {/* Khuyến mãi mỗi lần */}
                    {previewData.promotionInfo && (
                      <View style={{ backgroundColor: successColor + '10', padding: 10, borderRadius: 8, marginVertical: 8, borderLeftWidth: 3, borderLeftColor: successColor }}>
                        <View style={commonStyles.flexRowBetween}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="pricetag" size={14} color={successColor} style={{ marginRight: 6 }} />
                              <Text style={[commonStyles.cardDescription, { fontWeight: '700', color: successColor }]}>
                                {previewData.promotionInfo.promoCode}
                              </Text>
                            </View>
                            <Text style={[commonStyles.cardDescription, { fontSize: 11, color: successColor, marginTop: 2 }]}>
                              {previewData.promotionInfo.description}
                            </Text>
                          </View>
                          {previewData.formattedDiscountPerOccurrence && (
                            <Text style={[commonStyles.cardDescription, { fontWeight: '700', color: successColor }]}>
                              -{previewData.formattedDiscountPerOccurrence}
                            </Text>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Phí mỗi lần */}
                    {previewData.feeBreakdowns && previewData.feeBreakdowns.length > 0 && (
                      <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: dividerColor }}>
                        <Text style={[commonStyles.cardDescription, { fontWeight: '700', marginBottom: 6, color: colors.primary.navy }]}>Phí mỗi lần</Text>
                        {previewData.feeBreakdowns.map((fee, index) => (
                          <View key={index} style={[commonStyles.flexRowBetween, { paddingVertical: 4 }]}>
                            <Text style={[commonStyles.cardDescription, { fontSize: 13, flex: 1 }]}>
                              {fee.name}{fee.type === 'PERCENT' ? ` (${fee.value < 1 ? (fee.value * 100).toFixed(0) : fee.value}%)` : ''}
                            </Text>
                            <Text style={[commonStyles.cardDescription, { fontSize: 13, flexShrink: 0 }]}>
                              {`+${fee.formattedAmount ?? (fee.amount != null ? formatPrice(fee.amount) : '0 ₫')}`}
                            </Text>
                          </View>
                        ))}
                        {/* Tổng phí mỗi lần */}
                        {previewData.formattedTotalFeesPerOccurrence && (
                          <View style={[commonStyles.flexRowBetween, { paddingVertical: 4, marginTop: 4 }]}>
                            <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>Tổng phí mỗi lần</Text>
                            <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                              {previewData.formattedTotalFeesPerOccurrence}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Tóm tắt thanh toán - Header */}
                    <View style={{ marginTop: 16, marginBottom: 12 }}>
                      <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.heading3, color: colors.primary.navy }]}>
                        Tóm tắt thanh toán
                      </Text>
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        marginTop: 6,
                        backgroundColor: colors.highlight.purple + '15',
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 6,
                        alignSelf: 'flex-start'
                      }}>
                        <Ionicons name="repeat" size={14} color={colors.highlight.purple} style={{ marginRight: 6 }} />
                        <Text style={[commonStyles.cardDescription, { fontWeight: '600', color: colors.highlight.purple, fontSize: 13 }]}>
                          Thanh toán theo từng lần
                        </Text>
                      </View>
                    </View>

                    {/* Giá mỗi lần (sau phí) */}
                    <View style={[commonStyles.flexRowBetween, { paddingVertical: 6, marginTop: 8 }]}>
                      <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>Giá mỗi lần</Text>
                      <Text style={[commonStyles.cardDescription, { fontWeight: '700', color: colors.highlight.purple }]}>
                        {previewData.formattedPricePerOccurrence}
                      </Text>
                    </View>

                    {/* Lịch thực hiện preview */}
                    {((previewData.occurrenceDates?.length || 0) > 0 || (previewData.plannedBookingTimes?.length || 0) > 0) && (
                      <View style={{ marginTop: 12 }}>
                        <Text style={[commonStyles.cardDescription, { fontWeight: '600', marginBottom: 8, color: colors.primary.navy }]}>
                          Các lịch dự kiến ({previewData.occurrenceCount || previewData.previewedOccurrences}/{previewData.occurrenceCount || previewData.totalOccurrences})
                        </Text>
                        {(previewData.plannedBookingTimes || previewData.occurrenceDates)?.slice(0, 5).map((date, index) => (
                          <View 
                            key={index} 
                            style={[
                              commonStyles.flexRowBetween, 
                              { 
                                padding: 8, 
                                backgroundColor: colors.warm.beige, 
                                borderRadius: 6,
                                marginBottom: 6
                              }
                            ]}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="calendar-outline" size={14} color={colors.highlight.purple} style={{ marginRight: 6 }} />
                              <Text style={[commonStyles.cardDescription, { fontSize: 13 }]}>
                                {(() => {
                                  const d = new Date(date);
                                  const day = String(d.getDate()).padStart(2, '0');
                                  const month = String(d.getMonth() + 1).padStart(2, '0');
                                  const year = d.getFullYear();
                                  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                                  return `${weekdays[d.getDay()]}, ${day}/${month}/${year}`;
                                })()}
                              </Text>
                            </View>
                            <Text style={[commonStyles.cardDescription, { fontWeight: '600', fontSize: 13, color: accentColor }]}>
                              {previewData.formattedPricePerOccurrence}
                            </Text>
                          </View>
                        ))}
                        {((previewData.plannedBookingTimes?.length || previewData.occurrenceDates?.length) || 0) > 5 && (
                          <Text style={[commonStyles.cardDescription, { textAlign: 'center', marginTop: 4, fontSize: 12, color: colors.neutral.textSecondary }]}>
                            +{((previewData.plannedBookingTimes?.length || previewData.occurrenceDates?.length) || 0) - 5} lịch khác...
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Tổng thanh toán ước tính */}
                    <View style={{ height: 2, backgroundColor: colors.highlight.purple, marginVertical: 16, opacity: 0.3 }} />
                    <View style={{ backgroundColor: colors.highlight.purple + '10', padding: 12, borderRadius: 12 }}>
                      <View style={commonStyles.flexRowBetween}>
                        <View style={{ flex: 1 }}>
                          <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.heading3 }]}>Tổng ước tính</Text>
                          <Text style={[commonStyles.cardDescription, { fontSize: 12, marginTop: 4, color: colors.neutral.textSecondary }]}>
                            {previewData.occurrenceCount || previewData.totalOccurrences} lần × {previewData.formattedPricePerOccurrence}
                          </Text>
                        </View>
                        <Text style={[commonStyles.cardPrice, { fontSize: 24, fontWeight: '800', color: colors.highlight.purple }]}>
                          {previewData.formattedTotalEstimatedPrice}
                        </Text>
                      </View>
                      
                      {/* Badge: Thanh toán theo từng lần */}
                      <View style={{ 
                        marginTop: 12, 
                        paddingTop: 12, 
                        borderTopWidth: 1, 
                        borderTopColor: colors.highlight.purple + '30',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Ionicons name="wallet-outline" size={16} color={colors.highlight.purple} style={{ marginRight: 6 }} />
                        <Text style={[commonStyles.cardDescription, { fontWeight: '600', color: colors.highlight.purple }]}>
                          Thanh toán: {previewData.formattedPricePerOccurrence}/lần
                        </Text>
                      </View>
                    </View>
                    
                    {/* Ghi chú thanh toán định kỳ - giống web */}
                    <View style={{ marginTop: 12, padding: 10, backgroundColor: colors.neutral.background, borderRadius: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Ionicons name="information-circle" size={16} color={colors.neutral.textSecondary} style={{ marginRight: 8, marginTop: 2 }} />
                        <Text style={[commonStyles.cardDescription, { fontSize: 12, flex: 1, color: colors.neutral.textSecondary }]}>
                          Đây là ước tính cho {previewData.occurrenceCount || previewData.totalOccurrences} lần đặt lịch. Tổng thanh toán thực tế có thể thay đổi nếu có điều chỉnh trong quá trình.
                        </Text>
                      </View>
                    </View>
                  </>
                ) : isMultiplePreview(previewData) ? (
                  /* === MULTIPLE BOOKING PREVIEW === */
                  <>
                    {/* Chi tiết dịch vụ */}
                    {previewData.serviceItems && previewData.serviceItems.length > 0 && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={[commonStyles.cardDescription, { fontWeight: '700', marginBottom: 8, color: colors.primary.navy }]}>
                          Chi tiết dịch vụ (mỗi lịch)
                        </Text>
                        {previewData.serviceItems.map((item, index) => (
                          <View key={index} style={{ 
                            padding: 10, 
                            backgroundColor: colors.warm.beige, 
                            borderRadius: 8,
                            marginBottom: index < previewData.serviceItems.length - 1 ? 8 : 0
                          }}>
                            <View style={commonStyles.flexRowBetween}>
                              <Text style={[commonStyles.cardDescription, { fontWeight: '600', flex: 1 }]}>
                                {item.serviceName}
                              </Text>
                              <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                                {item.formattedSubTotal}
                              </Text>
                            </View>
                            <Text style={[commonStyles.cardDescription, { fontSize: 12, color: colors.neutral.textSecondary, marginTop: 2 }]}>
                              {item.formattedUnitPrice} × {item.quantity} {item.unit}
                            </Text>
                            {item.selectedChoices && item.selectedChoices.length > 0 && (
                              <View style={{ marginTop: 6 }}>
                                {item.selectedChoices.map((choice, cIndex) => (
                                  <View key={cIndex} style={[commonStyles.flexRowBetween, { paddingVertical: 2 }]}>
                                    <Text style={[commonStyles.cardDescription, { fontSize: 12, color: colors.neutral.textSecondary }]}>
                                      + {choice.optionName}: {choice.choiceName}
                                    </Text>
                                    <Text style={[commonStyles.cardDescription, { fontSize: 12, color: colors.neutral.textSecondary }]}>
                                      {choice.formattedPrice}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Tạm tính mỗi lịch */}
                    <View style={[commonStyles.flexRowBetween, { paddingVertical: 6 }]}>
                      <Text style={commonStyles.cardDescription}>Tạm tính mỗi lịch</Text>
                      <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                        {previewData.formattedSubtotalPerBooking}
                      </Text>
                    </View>

                    {/* Khuyến mãi */}
                    {previewData.promotionInfo && (
                      <View style={{ backgroundColor: successColor + '10', padding: 10, borderRadius: 8, marginVertical: 8, borderLeftWidth: 3, borderLeftColor: successColor }}>
                        <View style={commonStyles.flexRowBetween}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="pricetag" size={14} color={successColor} style={{ marginRight: 6 }} />
                              <Text style={[commonStyles.cardDescription, { fontWeight: '700', color: successColor }]}>
                                {previewData.promotionInfo.promoCode}
                              </Text>
                            </View>
                            <Text style={[commonStyles.cardDescription, { fontSize: 11, color: successColor, marginTop: 2 }]}>
                              {previewData.promotionInfo.description}
                            </Text>
                          </View>
                          <Text style={[commonStyles.cardDescription, { fontWeight: '700', color: successColor }]}>
                            -{previewData.formattedDiscountPerBooking}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Phí dịch vụ */}
                    {previewData.feeBreakdowns && previewData.feeBreakdowns.length > 0 && (
                      <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: dividerColor }}>
                        <Text style={[commonStyles.cardDescription, { fontWeight: '700', marginBottom: 6, color: colors.primary.navy }]}>Phí mỗi lịch</Text>
                        {previewData.feeBreakdowns.map((fee, index) => (
                          <View key={index} style={[commonStyles.flexRowBetween, { paddingVertical: 4 }]}>
                            <Text style={[commonStyles.cardDescription, { fontSize: 13, flex: 1 }]}>
                              {fee.name}{fee.type === 'PERCENT' ? ` (${fee.value < 1 ? (fee.value * 100).toFixed(0) : fee.value}%)` : ''}
                            </Text>
                            <Text style={[commonStyles.cardDescription, { fontSize: 13, flexShrink: 0 }]}>
                              {`+${fee.formattedAmount ?? (fee.amount != null ? formatPrice(fee.amount) : '0 ₫')}`}
                            </Text>
                          </View>
                        ))}
                        <View style={[commonStyles.flexRowBetween, { paddingVertical: 4, marginTop: 4 }]}>
                          <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>Tổng phí mỗi lịch</Text>
                          <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                            {previewData.formattedTotalFeesPerBooking}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Giá mỗi lịch */}
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: dividerColor }}>
                      <View style={[commonStyles.flexRowBetween, { paddingVertical: 4 }]}>
                        <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>Giá mỗi lịch</Text>
                        <Text style={[commonStyles.cardDescription, { fontWeight: '700', color: accentColor }]}>
                          {previewData.formattedPricePerBooking}
                        </Text>
                      </View>
                    </View>

                    {/* Số lịch */}
                    <View style={[commonStyles.flexRowBetween, { paddingVertical: 6, marginTop: 4 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="calendar-outline" size={16} color={colors.neutral.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={commonStyles.cardDescription}>Số lịch đặt</Text>
                      </View>
                      <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                        {previewData.bookingCount}
                      </Text>
                    </View>

                    {/* Invalid bookings warning */}
                    {previewData.invalidBookingsCount > 0 && (
                      <View style={{ backgroundColor: warningColor + '10', padding: 10, borderRadius: 8, marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="warning" size={16} color={warningColor} style={{ marginRight: 6 }} />
                          <Text style={[commonStyles.cardDescription, { color: warningColor }]}>
                            {previewData.invalidBookingsCount} lịch không hợp lệ sẽ không được tạo
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Tổng thanh toán */}
                    <View style={{ height: 2, backgroundColor: accentColor, marginVertical: 16, opacity: 0.3 }} />
                    <View style={[commonStyles.flexRowBetween, { backgroundColor: accentColor + '10', padding: 12, borderRadius: 12 }]}>
                      <View>
                        <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.heading3 }]}>Tổng thanh toán</Text>
                        <Text style={[commonStyles.cardDescription, { fontSize: 12, marginTop: 4, color: colors.neutral.textSecondary }]}>
                          {previewData.bookingCount} lịch × {previewData.formattedPricePerBooking}
                        </Text>
                      </View>
                      <Text style={[commonStyles.cardPrice, { fontSize: 24, fontWeight: '800' }]}>
                        {previewData.formattedTotalEstimatedPrice}
                      </Text>
                    </View>
                  </>
                ) : isSinglePreview(previewData) ? (
                  /* === SINGLE BOOKING PREVIEW === */
                  <>
                    {/* Chi tiết dịch vụ */}
                    {(previewData as BookingPreviewResponse).serviceItems && (previewData as BookingPreviewResponse).serviceItems!.length > 0 && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={[commonStyles.cardDescription, { fontWeight: '700', marginBottom: 8, color: colors.primary.navy }]}>
                          Chi tiết dịch vụ
                        </Text>
                        {(previewData as BookingPreviewResponse).serviceItems!.map((item, index) => (
                          <View key={index} style={{ 
                            padding: 10, 
                            backgroundColor: colors.warm.beige, 
                            borderRadius: 8,
                            marginBottom: index < (previewData as BookingPreviewResponse).serviceItems!.length - 1 ? 8 : 0
                          }}>
                            <View style={commonStyles.flexRowBetween}>
                              <Text style={[commonStyles.cardDescription, { fontWeight: '600', flex: 1 }]}>
                                {item.serviceName}
                              </Text>
                              <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                                {item.formattedSubTotal}
                              </Text>
                            </View>
                            <Text style={[commonStyles.cardDescription, { fontSize: 12, color: colors.neutral.textSecondary, marginTop: 2 }]}>
                              {item.formattedUnitPrice} × {item.quantity} {item.unit}
                            </Text>
                            {item.selectedChoices && item.selectedChoices.length > 0 && (
                              <View style={{ marginTop: 6 }}>
                                {item.selectedChoices.map((choice, cIndex) => (
                                  <View key={cIndex} style={[commonStyles.flexRowBetween, { paddingVertical: 2 }]}>
                                    <Text style={[commonStyles.cardDescription, { fontSize: 12, color: colors.neutral.textSecondary }]}>
                                      + {choice.optionName}: {choice.choiceName}
                                    </Text>
                                    <Text style={[commonStyles.cardDescription, { fontSize: 12, color: colors.neutral.textSecondary }]}>
                                      {choice.formattedPrice}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                            {item.estimatedDuration && (
                              <Text style={[commonStyles.cardDescription, { fontSize: 11, color: colors.neutral.textSecondary, marginTop: 4 }]}>
                                ⏱ Thời gian: {item.estimatedDuration}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Tạm tính */}
                    <View style={[commonStyles.flexRowBetween, { paddingVertical: 6 }]}>
                      <Text style={commonStyles.cardDescription}>Tạm tính</Text>
                      <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                        {(previewData as BookingPreviewResponse).formattedSubtotal}
                      </Text>
                    </View>

                    {/* Khuyến mãi */}
                    {(previewData as BookingPreviewResponse).promotionInfo && (previewData as BookingPreviewResponse).formattedDiscountAmount && (
                      <View style={{ backgroundColor: successColor + '10', padding: 10, borderRadius: 8, marginVertical: 8, borderLeftWidth: 3, borderLeftColor: successColor }}>
                        <View style={commonStyles.flexRowBetween}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="pricetag" size={14} color={successColor} style={{ marginRight: 6 }} />
                              <Text style={[commonStyles.cardDescription, { fontWeight: '700', color: successColor }]}>
                                {(previewData as BookingPreviewResponse).promotionInfo!.promoCode}
                              </Text>
                            </View>
                            <Text style={[commonStyles.cardDescription, { fontSize: 11, color: successColor, marginTop: 2 }]}>
                              {(previewData as BookingPreviewResponse).promotionInfo!.description}
                            </Text>
                          </View>
                          <Text style={[commonStyles.cardDescription, { fontWeight: '700', color: successColor }]}>
                            -{(previewData as BookingPreviewResponse).formattedDiscountAmount}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Sau giảm giá */}
                    {(((previewData as BookingPreviewResponse).discountAmount ?? 0) > 0) && (
                      <View style={[commonStyles.flexRowBetween, { paddingVertical: 6 }]}>
                        <Text style={commonStyles.cardDescription}>Sau giảm giá</Text>
                        <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                          {(previewData as BookingPreviewResponse).formattedTotalAfterDiscount}
                        </Text>
                      </View>
                    )}

                    {/* Phí dịch vụ */}
                    {(previewData as BookingPreviewResponse).feeBreakdowns && (previewData as BookingPreviewResponse).feeBreakdowns!.length > 0 && (
                      <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: dividerColor }}>
                        <Text style={[commonStyles.cardDescription, { fontWeight: '700', marginBottom: 6, color: colors.primary.navy }]}>Phí dịch vụ</Text>
                        {(previewData as BookingPreviewResponse).feeBreakdowns!.map((fee, index) => (
                          <View key={index} style={[commonStyles.flexRowBetween, { paddingVertical: 4 }]}>
                            <Text style={[commonStyles.cardDescription, { fontSize: 13, flex: 1 }]}>
                              {fee.name}{fee.type === 'PERCENT' ? ` (${fee.value < 1 ? (fee.value * 100).toFixed(0) : fee.value}%)` : ''}
                            </Text>
                            <Text style={[commonStyles.cardDescription, { fontSize: 13, flexShrink: 0 }]}>
                              {`+${fee.formattedAmount ?? (fee.amount != null ? formatPrice(fee.amount) : '0 ₫')}`}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Tổng phí */}
                    {(previewData as BookingPreviewResponse).totalFees && (previewData as BookingPreviewResponse).totalFees! > 0 && (
                      <View style={[commonStyles.flexRowBetween, { paddingVertical: 6, marginTop: 4 }]}>
                        <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>Tổng phí</Text>
                        <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                          {(previewData as BookingPreviewResponse).formattedTotalFees}
                        </Text>
                      </View>
                    )}

                    {/* Thời gian ước tính */}
                    {(previewData as BookingPreviewResponse).estimatedDuration && (
                      <View style={[commonStyles.flexRowBetween, { paddingVertical: 6 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="time-outline" size={16} color={colors.neutral.textSecondary} style={{ marginRight: 6 }} />
                          <Text style={commonStyles.cardDescription}>Thời gian ước tính</Text>
                        </View>
                        <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
                          {(previewData as BookingPreviewResponse).estimatedDuration}
                        </Text>
                      </View>
                    )}

                    {/* Tổng thanh toán */}
                    <View style={{ height: 2, backgroundColor: accentColor, marginVertical: 16, opacity: 0.3 }} />
                    <View style={[commonStyles.flexRowBetween, { backgroundColor: accentColor + '10', padding: 12, borderRadius: 12 }]}>
                      <View>
                        <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.heading3 }]}>
                          {bookingMode === 'recurring' ? 'Tổng thanh toán' : 'Tổng cộng'}
                        </Text>
                        {bookingMode === 'recurring' && (
                          <Text style={[commonStyles.cardDescription, { fontSize: 12, marginTop: 4, color: colors.neutral.textSecondary }]}>
                            Thanh toán sau mỗi lần thực hiện
                          </Text>
                        )}
                      </View>
                      <Text style={[commonStyles.cardPrice, { fontSize: 24, fontWeight: '800' }]}>
                        {(previewData as BookingPreviewResponse).formattedGrandTotal}
                      </Text>
                    </View>
                  </>
                ) : null}
              </>
            )}

            {/* Fallback when no preview data */}
            {!previewData && !previewLoading && (
              <>
                <View style={[commonStyles.flexRowBetween, { paddingVertical: 6 }]}>
                  <Text style={[commonStyles.cardDescription, { fontSize: responsiveFontSize.body }]}>
                    Giá dịch vụ{normalizedQuantity > 1 ? ` x${normalizedQuantity}` : ''}
                  </Text>
                  <Text style={[commonStyles.cardDescription, { fontSize: responsiveFontSize.body, fontWeight: '600' }]}>
                    {formatPrice(basePriceTotal)}
                  </Text>
                </View>

                {selectedOptions.length === 0 ? (
                  <View style={[commonStyles.flexRowBetween, { paddingVertical: 6 }]}>
                    <Text style={commonStyles.cardDescription}>Không có tùy chọn</Text>
                    <Text style={commonStyles.cardDescription}>+0₫</Text>
                  </View>
                ) : null}

                <View style={{ height: 2, backgroundColor: accentColor, marginVertical: 16, opacity: 0.3 }} />
                
                {bookingMode === 'single' ? (
                  <View style={[commonStyles.flexRowBetween, { backgroundColor: accentColor + '10', padding: 12, borderRadius: 12 }]}>
                    <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.heading3 }]}>Tổng cộng</Text>
                    <Text style={[commonStyles.cardPrice, { fontSize: 24, fontWeight: '800' }]}>
                      {formatPrice(effectiveFinalPrice)}
                    </Text>
                  </View>
                ) : bookingMode === 'multiple' ? (
                  <>
                    <View style={[commonStyles.flexRowBetween, { paddingVertical: 6 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="calendar" size={16} color={colors.neutral.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={[commonStyles.cardDescription, { fontSize: responsiveFontSize.body }]}>
                          Giá mỗi ngày
                        </Text>
                      </View>
                      <Text style={[commonStyles.cardDescription, { fontSize: responsiveFontSize.body, fontWeight: '600' }]}>
                        {formatPrice(effectiveFinalPrice)}
                      </Text>
                    </View>
                    <View style={[commonStyles.flexRowBetween, { paddingVertical: 6, marginTop: 4 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="close-circle" size={16} color={colors.neutral.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={[commonStyles.cardDescription, { fontSize: responsiveFontSize.body }]}>
                          Số ngày
                        </Text>
                      </View>
                      <Text style={[commonStyles.cardDescription, { fontSize: responsiveFontSize.body, fontWeight: '600' }]}>
                        {selectedDates.length}
                      </Text>
                    </View>
                    <View style={[commonStyles.flexRowBetween, { backgroundColor: accentColor + '10', padding: 12, borderRadius: 12, marginTop: 8 }]}>
                      <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.heading3 }]}>Tổng cộng</Text>
                      <Text style={[commonStyles.cardPrice, { fontSize: 24, fontWeight: '800' }]}>
                        {formatPrice(effectiveFinalPrice * selectedDates.length)}
                      </Text>
                    </View>
                  </>
                ) : bookingMode === 'recurring' ? (
                  <>
                    <View style={[commonStyles.flexRowBetween, { paddingVertical: 6 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="repeat" size={16} color={colors.neutral.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={[commonStyles.cardDescription, { fontSize: responsiveFontSize.body }]}>
                          Giá mỗi lần
                        </Text>
                      </View>
                      <Text style={[commonStyles.cardDescription, { fontSize: responsiveFontSize.body, fontWeight: '600' }]}>
                        {formatPrice(effectiveFinalPrice)}
                      </Text>
                    </View>
                    <View style={[commonStyles.flexRowBetween, { backgroundColor: accentColor + '10', padding: 12, borderRadius: 12, marginTop: 8 }]}>
                      <View>
                        <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.heading3 }]}>Đặt lịch định kỳ</Text>
                        <Text style={[commonStyles.cardDescription, { fontSize: 12, marginTop: 4 }]}>
                          Thanh toán sau mỗi lần thực hiện
                        </Text>
                      </View>
                      <Text style={[commonStyles.cardPrice, { fontSize: 24, fontWeight: '800' }]}>
                        {formatPrice(effectiveFinalPrice)}
                      </Text>
                    </View>
                  </>
                ) : null}
              </>
            )}
          </View>
        </View>

        <View style={commonStyles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.highlight.teal + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="card-outline" size={18} color={accentColor} />
            </View>
            <Text style={commonStyles.sectionTitle}>Phương thức thanh toán</Text>
          </View>
          {availablePaymentMethods.length === 0 ? (
            <View style={[commonStyles.card, { alignItems: 'center', paddingVertical: 24 }]}>
              <Ionicons name="wallet-outline" size={48} color={colors.neutral.border} />
              <Text style={[commonStyles.loadingText, { marginTop: 12 }]}>
                Chưa có phương thức thanh toán khả dụng.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {availablePaymentMethods.map((method) => {
                const isSelected = method.methodId === selectedPaymentMethodId;
                return (
                  <TouchableOpacity
                    key={method.methodId}
                    style={[
                      commonStyles.card,
                      { 
                        marginBottom: 0,
                        borderWidth: 2,
                        borderColor: isSelected ? accentColor : colors.neutral.border,
                      },
                      isSelected && { backgroundColor: accentColor + '10' },
                    ]}
                    onPress={() => onPaymentMethodSelect(method.methodId)}
                  >
                    <View style={commonStyles.flexRowBetween}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: isSelected ? accentColor : colors.neutral.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}>
                          <Ionicons 
                            name={method.methodName.toLowerCase().includes('cash') ? 'cash' : 'card'} 
                            size={20} 
                            color={isSelected ? colors.neutral.white : colors.neutral.textSecondary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              commonStyles.cardTitle,
                              isSelected && { color: accentColor },
                            ]}
                          >
                            {method.methodName}
                          </Text>
                          {method.description ? (
                            <Text style={[commonStyles.cardDescription, { marginTop: 2 }]}>
                              {method.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={accentColor}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={commonStyles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.highlight.teal + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="chatbox-outline" size={18} color={accentColor} />
            </View>
            <Text style={commonStyles.sectionTitle}>Ghi chú cho nhân viên</Text>
          </View>
          <View style={commonStyles.card}>
            <TextInput
              style={{
                minHeight: 100,
                fontSize: responsiveFontSize.body,
                color: colors.neutral.textPrimary,
                textAlignVertical: 'top',
                padding: 0,
              }}
              value={bookingNote}
              onChangeText={onNoteChange}
              placeholder="Ví dụ: Có thú cưng, ưu tiên dùng sản phẩm thân thiện..."
              placeholderTextColor={colors.neutral.textSecondary}
              multiline
              numberOfLines={5}
              maxLength={500}
            />
            <View style={{ 
              marginTop: 12, 
              paddingTop: 12, 
              borderTopWidth: 1, 
              borderTopColor: dividerColor,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={commonStyles.cardDescription}>
                <Ionicons name="information-circle-outline" size={14} color={colors.neutral.textSecondary} /> Tối đa 500 ký tự
              </Text>
              <Text style={[commonStyles.cardDescription, { fontWeight: '600', color: bookingNote.length > 450 ? warningColor : colors.neutral.textSecondary }]}>
                {bookingNote.length}/500
              </Text>
            </View>
          </View>
        </View>

        <View style={commonStyles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.highlight.teal + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="pricetag-outline" size={18} color={accentColor} />
            </View>
            <Text style={commonStyles.sectionTitle}>Mã khuyến mãi</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={[
                  commonStyles.input,
                  {
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: responsiveFontSize.body,
                    fontWeight: '600',
                  }
                ]}
                value={promoCode}
                onChangeText={onPromoCodeChange}
                placeholder="Nhập mã khuyến mãi"
                placeholderTextColor={colors.neutral.textSecondary}
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity
              style={[
                commonStyles.secondaryButton, 
                { 
                  paddingHorizontal: 24,
                  minWidth: 100,
                  justifyContent: 'center',
                }
              ]}
              onPress={applyPromoCode}
            >
              <Text style={commonStyles.secondaryButtonText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
          <View style={commonStyles.infoBox}>
            <Ionicons name="gift-outline" size={20} color={accentColor} style={{ marginRight: 12 }} />
            <Text style={[commonStyles.infoText, { fontSize: responsiveFontSize.caption }]}>
              Mã khuyến mãi sẽ được áp dụng khi xác nhận đơn hàng
            </Text>
          </View>
        </View>

        <View style={commonStyles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.highlight.teal + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="document-text-outline" size={18} color={accentColor} />
            </View>
            <Text style={commonStyles.sectionTitle}>Điều khoản</Text>
          </View>
          <View style={commonStyles.card}>
            <TouchableOpacity
              style={{ 
                flexDirection: 'row', 
                alignItems: 'flex-start',
                paddingVertical: 8,
              }}
              onPress={() => setAcceptTerms((prev) => !prev)}
            >
              <View style={{ marginRight: 12, marginTop: 2 }}>
                <Checkbox checked={acceptTerms} onPress={() => setAcceptTerms((prev) => !prev)} />
              </View>
              <Text style={[commonStyles.checkboxLabel, { marginLeft: 0, flex: 1 }]}>
                Tôi đồng ý với{' '}
                <Text style={{ color: accentColor, fontWeight: '600' }}>
                  điều khoản sử dụng
                </Text>{' '}
                và{' '}
                <Text style={{ color: accentColor, fontWeight: '600' }}>
                  chính sách bảo mật
                </Text>
              </Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 12 }} />

            <TouchableOpacity
              style={{ 
                flexDirection: 'row', 
                alignItems: 'flex-start',
                paddingVertical: 8,
              }}
              onPress={() => setAcceptReschedule((prev) => !prev)}
            >
              <View style={{ marginRight: 12, marginTop: 2 }}>
                <Checkbox
                  checked={acceptReschedule}
                  onPress={() => setAcceptReschedule((prev) => !prev)}
                />
              </View>
              <Text style={[commonStyles.checkboxLabel, { marginLeft: 0, flex: 1 }]}>
                Tôi hiểu rằng có thể hủy hoặc đổi lịch trước{' '}
                <Text style={{ fontWeight: '700', color: colors.primary.navy }}>2 giờ</Text>{' '}
                mà không phát sinh phí.
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={commonStyles.buttonContainer}>
        <TouchableOpacity
          style={[
            commonStyles.primaryButton,
            { 
              paddingVertical: responsiveSpacing.md + 4,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            },
            isConfirmDisabled && commonStyles.primaryButtonDisabled,
          ]}
          onPress={handleConfirmBooking}
          disabled={isConfirmDisabled}
        >
          {isProcessing || isSubmitting ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.neutral.white} />
              <Text style={[commonStyles.primaryButtonText, { marginLeft: 12 }]}>
                {bookingMode === 'recurring' 
                  ? 'Đang tạo lịch định kỳ...' 
                  : 'Đang xử lý...'}
              </Text>
            </View>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={colors.neutral.white} style={{ marginRight: 8 }} />
              <Text style={[commonStyles.primaryButtonText, { fontSize: responsiveFontSize.heading3 }]}>
                Xác nhận đặt lịch
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BookingConfirmation;