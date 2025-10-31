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
import * as ImagePicker from 'expo-image-picker';
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
import { type LocationData, type SelectedOption, BookingStep } from './types';
import { commonStyles } from './styles';
import { ProgressIndicator } from './ProgressIndicator';

interface BookingConfirmationProps {
  selectedService: Service | null;
  selectedOptions: SelectedOption[];
  selectedLocation: LocationData | null;
  selectedDate: string;
  selectedTime: string;
  selectedEmployeeId: string | null;
  selectedEmployee: Employee | null;
  totalPrice: number;
  quantity: number;
  availablePaymentMethods: PaymentMethod[];
  selectedPaymentMethodId: number | null;
  bookingNote: string;
  promoCode: string;
  onPaymentMethodSelect: (methodId: number) => void;
  onNoteChange: (note: string) => void;
  onPromoCodeChange: (code: string) => void;
  onConfirm: (bookingData: any) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  selectedService,
  selectedOptions,
  selectedLocation,
  selectedDate,
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
  const [postTitle, setPostTitle] = useState<string>('');
  const [postImageUri, setPostImageUri] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const bookingDateTime =
    selectedDate && selectedTime ? `${selectedDate}T${selectedTime}:00` : '';
  const normalizedQuantity = Math.max(1, quantity || 1);
  const isBookingPost = !selectedEmployeeId; // Nếu không chọn nhân viên thì là bài post

  useEffect(() => {
    setFinalPrice(totalPrice);
  }, [totalPrice]);

  useEffect(() => {
    if (availablePaymentMethods.length > 0 && !selectedPaymentMethodId) {
      onPaymentMethodSelect(availablePaymentMethods[0].methodId);
    }
  }, [availablePaymentMethods, selectedPaymentMethodId, onPaymentMethodSelect]);

  // Request permission and pick image
  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Cần quyền truy cập',
          'Vui lòng cấp quyền truy cập thư viện ảnh để tải ảnh lên.'
        );
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPostImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Cần quyền truy cập',
          'Vui lòng cấp quyền truy cập camera để chụp ảnh.'
        );
        return;
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPostImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    }
  };

  // Show image picker options
  const handleImagePicker = () => {
    Alert.alert(
      'Chọn ảnh',
      'Bạn muốn chọn ảnh từ đâu?',
      [
        {
          text: 'Thư viện',
          onPress: pickImage,
        },
        {
          text: 'Chụp ảnh',
          onPress: takePhoto,
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Remove selected image
  const removeImage = () => {
    setPostImageUri('');
  };

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
    if (!selectedService || !selectedDate || !selectedTime || !selectedAddress) {
      Alert.alert('Thiếu thông tin', 'Vui lòng kiểm tra lại dịch vụ, địa chỉ và thời gian.');
      return;
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

    // Validate title for booking post (when no employee selected)
    if (!selectedEmployeeId && !postTitle.trim()) {
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
      
      console.log('📋 Selected options for booking:', {
        selectedOptions,
        choiceIds,
        serviceId: selectedService.serviceId,
      });
      
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

      // Tạo booking data trực tiếp mà không cần validate API trước
      const bookingData: BookingRequest = {
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

      // Upload ảnh và thêm thông tin CHỈ KHI KHÔNG CHỌN NHÂN VIÊN (booking post)
      if (!selectedEmployeeId) {
        if (postTitle.trim()) {
          bookingData.title = postTitle.trim();
        }
        
        // Upload image if selected
        if (postImageUri) {
          try {
            console.log('📤 Uploading booking image...');
            const uploadResult = await uploadService.uploadBookingImage(postImageUri);
            
            if (uploadResult.imageUrl) {
              bookingData.imageUrl = uploadResult.imageUrl;
              console.log('✅ Image uploaded successfully:', uploadResult.imageUrl);
            }
          } catch (uploadError: any) {
            console.error('❌ Error uploading image:', uploadError);
            
            // Ask user if they want to continue without image
            const continueWithoutImage = await new Promise<boolean>((resolve) => {
              Alert.alert(
                'Không thể upload ảnh',
                'Không thể tải ảnh lên server. Bạn có muốn tiếp tục đặt lịch không?',
                [
                  { 
                    text: 'Hủy', 
                    style: 'cancel', 
                    onPress: () => resolve(false) 
                  },
                  { 
                    text: 'Tiếp tục', 
                    onPress: () => resolve(true) 
                  },
                ]
              );
            });
            
            if (!continueWithoutImage) {
              setIsProcessing(false);
              return;
            }
          }
        }
      }

      console.log('🚀 Creating booking with data:', bookingData);

      // Gọi trực tiếp API tạo booking, backend sẽ validate và trả về lỗi nếu có
      await onConfirm(bookingData);
    } catch (error: any) {
      console.error('❌ Booking confirmation error:', error);
      
      let errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';
      let errorTitle = 'Lỗi';
      
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
    !acceptTerms || !acceptReschedule || isProcessing || isSubmitting || isUploadingImage;

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

            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: dividerColor }}>
              <View style={commonStyles.flexRowBetween}>
                <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.heading3 }]}>Tổng cộng</Text>
                <Text style={[commonStyles.cardPrice, { fontSize: 22 }]}>
                  {formatPrice(effectiveFinalPrice)}
                </Text>
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
                <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.body }]}>
                  {formatDate(selectedDate)}
                </Text>
                <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.heading3, color: accentColor, marginTop: 2 }]}>
                  {selectedTime || '--:--'}
                </Text>
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
              backgroundColor: colors.highlight.teal + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="people-outline" size={18} color={accentColor} />
            </View>
            <Text style={commonStyles.sectionTitle}>Nhân viên thực hiện</Text>
          </View>
          {selectedEmployeeId && selectedEmployee ? (
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

            {selectionAdjustment !== 0 ? (
              <>
                <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 12 }} />
                <View style={[commonStyles.flexRowBetween, { paddingVertical: 6 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons 
                      name={selectionAdjustment > 0 ? "arrow-up-circle" : "arrow-down-circle"} 
                      size={16} 
                      color={selectionAdjustment > 0 ? warningColor : successColor}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={commonStyles.cardDescription}>Điều chỉnh hệ thống</Text>
                  </View>
                  <Text
                    style={[
                      commonStyles.cardDescription,
                      {
                        color: selectionAdjustment > 0 ? warningColor : successColor,
                        fontWeight: '700',
                        fontSize: responsiveFontSize.body,
                      },
                    ]}
                  >
                    {selectionAdjustment > 0 ? '+' : ''}
                    {formatPrice(selectionAdjustment)}
                  </Text>
                </View>
              </>
            ) : null}

            {finalAdjustment !== 0 ? (
              <>
                <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 12 }} />
                <View style={[commonStyles.flexRowBetween, { paddingVertical: 6 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons 
                      name={finalAdjustment > 0 ? "arrow-up-circle" : "arrow-down-circle"} 
                      size={16} 
                      color={finalAdjustment > 0 ? warningColor : successColor}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={commonStyles.cardDescription}>Điều chỉnh cuối</Text>
                  </View>
                  <Text
                    style={[
                      commonStyles.cardDescription,
                      {
                        color: finalAdjustment > 0 ? warningColor : successColor,
                        fontWeight: '700',
                        fontSize: responsiveFontSize.body,
                      },
                    ]}
                  >
                    {finalAdjustment > 0 ? '+' : ''}
                    {formatPrice(finalAdjustment)}
                  </Text>
                </View>
              </>
            ) : null}

            <View style={{ 
              height: 2, 
              backgroundColor: accentColor, 
              marginVertical: 16,
              opacity: 0.3,
            }} />
            <View style={[commonStyles.flexRowBetween, { backgroundColor: accentColor + '10', padding: 12, borderRadius: 12, marginTop: 4 }]}>
              <Text style={[commonStyles.cardTitle, { fontSize: responsiveFontSize.heading3 }]}>Tổng cộng</Text>
              <Text style={[commonStyles.cardPrice, { fontSize: 24, fontWeight: '800' }]}>
                {formatPrice(effectiveFinalPrice)}
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

        {/* Thêm phần title và image URL CHỈ KHI KHÔNG CHỌN NHÂN VIÊN (booking post) */}
        {!selectedEmployeeId && (
          <View style={commonStyles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: accentColor + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Ionicons name="create-outline" size={18} color={accentColor} />
              </View>
              <Text style={commonStyles.sectionTitle}>Thông tin bài đăng</Text>
            </View>
            <View style={[commonStyles.card, { marginBottom: 12 }]}>
              <Text style={[commonStyles.cardDescription, { marginBottom: 8, fontWeight: '600' }]}>
                Tiêu đề <Text style={{ color: warningColor }}>*</Text>
              </Text>
              <TextInput
                style={{
                  fontSize: responsiveFontSize.body,
                  color: colors.neutral.textPrimary,
                  borderWidth: 1,
                  borderColor: dividerColor,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
                value={postTitle}
                onChangeText={setPostTitle}
                placeholder="Ví dụ: Cần nhân viên dọn dẹp nhà cấp tốc"
                placeholderTextColor={colors.neutral.textSecondary}
                maxLength={200}
              />
              <Text style={[commonStyles.cardDescription, { marginTop: 4, textAlign: 'right' }]}>
                {postTitle.length}/200
              </Text>
            </View>
            
            {/* Image Upload Section */}
            <View style={commonStyles.card}>
              <Text style={[commonStyles.cardDescription, { marginBottom: 12, fontWeight: '600' }]}>
                Hình ảnh (tùy chọn)
              </Text>
              
              {postImageUri ? (
                // Show selected image
                <View>
                  <Image
                    source={{ uri: postImageUri }}
                    style={{
                      width: '100%',
                      height: 200,
                      borderRadius: 12,
                      backgroundColor: colors.neutral.border,
                    }}
                    resizeMode="cover"
                  />
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <TouchableOpacity
                      onPress={handleImagePicker}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 12,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: accentColor,
                        backgroundColor: colors.neutral.white,
                      }}
                    >
                      <Ionicons name="images-outline" size={18} color={accentColor} />
                      <Text style={{ marginLeft: 6, color: accentColor, fontWeight: '600' }}>
                        Đổi ảnh
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={removeImage}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 12,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.feedback.error,
                        backgroundColor: colors.neutral.white,
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.feedback.error} />
                      <Text style={{ marginLeft: 6, color: colors.feedback.error, fontWeight: '600' }}>
                        Xóa
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // Show image picker button
                <TouchableOpacity
                  onPress={handleImagePicker}
                  style={{
                    borderWidth: 2,
                    borderColor: dividerColor,
                    borderStyle: 'dashed',
                    borderRadius: 12,
                    padding: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.neutral.background,
                  }}
                >
                  <Ionicons name="cloud-upload-outline" size={48} color={colors.neutral.textSecondary} />
                  <Text style={[commonStyles.cardDescription, { marginTop: 12, textAlign: 'center', fontWeight: '600' }]}>
                    Chọn ảnh từ thư viện hoặc chụp ảnh
                  </Text>
                  <Text style={[commonStyles.cardDescription, { marginTop: 4, textAlign: 'center', fontSize: 12 }]}>
                    JPG, PNG (tối đa 5MB)
                  </Text>
                </TouchableOpacity>
              )}
              
              <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons name="information-circle-outline" size={14} color={colors.neutral.textSecondary} style={{ marginTop: 2 }} />
                <Text style={[commonStyles.cardDescription, { marginLeft: 6, flex: 1 }]}>
                  Bài đăng của bạn cần được admin phê duyệt trước khi hiển thị cho nhân viên
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
                {isUploadingImage ? 'Đang tải ảnh lên...' : 'Đang xử lý...'}
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