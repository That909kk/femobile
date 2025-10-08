import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Button, Checkbox } from '../../../../components';
import { COLORS, STORAGE_KEYS } from '../../../../constants';
import { useAuth } from '../../../../hooks';
import { 
  bookingService, 
  serviceService, 
  type Service, 
  type Employee,
  type PaymentMethod,
  type BookingRequest
} from '../../../../services';
import { type LocationData, type SelectedOption } from './types';
import { commonStyles } from './styles';

interface BookingConfirmationProps {
  selectedService: Service | null;
  selectedOptions: SelectedOption[];
  selectedLocation: LocationData | null;
  selectedDate: string;
  selectedTime: string;
  selectedEmployeeId: string | null;
  // availableEmployees: Employee[]; // Temporarily remove
  totalPrice: number;
  availablePaymentMethods?: any[]; // Made optional since we load from API
  selectedPaymentMethodId: number | null;
  bookingNote: string;
  promoCode: string;
  onPaymentMethodSelect: (methodId: number) => void;
  onNoteChange: (note: string) => void;
  onPromoCodeChange: (code: string) => void;
  onConfirm: (bookingData: any) => void;
  onBack: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  selectedService,
  selectedOptions,
  selectedLocation,
  selectedDate,
  selectedTime,
  selectedEmployeeId,
  // availableEmployees, // Temporarily remove
  totalPrice,
  availablePaymentMethods,
  selectedPaymentMethodId,
  bookingNote,
  promoCode,
  onPaymentMethodSelect,
  onNoteChange,
  onPromoCodeChange,
  onConfirm,
  onBack
}) => {
  // Alias for backwards compatibility
  const selectedAddress = selectedLocation;
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptReschedule, setAcceptReschedule] = useState(false);
  const [finalPrice, setFinalPrice] = useState(totalPrice);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // Get current user from auth context
  const { user } = useAuth();

  // const selectedEmployee = availableEmployees.find(emp => emp.employeeId === selectedEmployeeId);
  const bookingDateTime = `${selectedDate}T${selectedTime}:00`;

  useEffect(() => {
    console.log('🔍 BookingConfirmation mounted, checking props:', {
      hasSelectedService: !!selectedService,
      hasSelectedLocation: !!selectedLocation,
      hasSelectedDate: !!selectedDate,
      hasSelectedTime: !!selectedTime,
      selectedLocationData: selectedLocation,
      selectedServiceData: selectedService,
      selectedOptionsData: selectedOptions,
      selectedOptionsLength: selectedOptions.length,
      totalPrice: totalPrice,
      finalPrice: finalPrice,
      basePrice: selectedService?.basePrice,
      priceBreakdown: {
        basePrice: selectedService?.basePrice || 0,
        optionsTotal: selectedOptions.reduce((sum, opt) => sum + (opt.priceAdjustment || 0), 0),
        expectedTotal: (selectedService?.basePrice || 0) + selectedOptions.reduce((sum, opt) => sum + (opt.priceAdjustment || 0), 0),
        actualTotalPrice: totalPrice,
        actualFinalPrice: finalPrice
      }
    });
    
    // Load payment methods
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    console.log('💳 Starting loadPaymentMethods...');
    setLoadingPaymentMethods(true);
    try {
      console.log('💳 About to call bookingService.getPaymentMethods()');
      
      // Test 1: Direct fetch to verify API works
      const testUrl = 'http://192.168.1.9:8080/api/v1/customer/payments/methods';
      console.log('💳 Testing direct fetch to:', testUrl);
      try {
        const directResponse = await fetch(testUrl);
        const directData = await directResponse.json();
        console.log('💳 Direct fetch status:', directResponse.status);
        console.log('💳 Direct fetch response:', directData);
      } catch (directError) {
        console.log('💳 Direct fetch failed:', directError);
      }
      
      // Test 2: Use bookingService
      const methods = await bookingService.getPaymentMethods();
      console.log('💳 BookingService response:', methods);
      console.log('💳 Methods type:', typeof methods);
      console.log('💳 Methods length:', Array.isArray(methods) ? methods.length : 'not array');
      console.log('💳 Methods content:', JSON.stringify(methods, null, 2));
      
      setPaymentMethods(methods);
      console.log('💳 Payment methods set in state');
      
      // Auto-select first payment method if none selected
      if (methods.length > 0 && !selectedPaymentMethodId) {
        console.log('💳 Auto-selecting first method:', methods[0]);
        onPaymentMethodSelect(methods[0].methodId);
      }
    } catch (error: any) {
      console.error('❌ Error loading payment methods:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      Alert.alert('Lỗi', 'Không thể tải phương thức thanh toán. Vui lòng thử lại.');
    } finally {
      setLoadingPaymentMethods(false);
      console.log('💳 loadPaymentMethods finished, loading state set to false');
    }
  };

  const applyPromoCode = () => {
    if (!promoCode.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã khuyến mãi');
      return;
    }
    // For now, just show a message that promo code will be validated during booking
    Alert.alert('Thông báo', 'Mã khuyến mãi sẽ được áp dụng khi đặt lịch');
  };

  const handleConfirmBooking = async () => {
    if (!acceptTerms) {
      Alert.alert('Thông báo', 'Vui lòng đồng ý với điều khoản sử dụng');
      return;
    }

    if (!acceptReschedule) {
      Alert.alert('Thông báo', 'Vui lòng xác nhận chính sách hủy/đổi lịch');
      return;
    }

    if (!selectedPaymentMethodId) {
      Alert.alert('Thông báo', 'Vui lòng chọn phương thức thanh toán');
      return;
    }

    setLoading(true);
    try {
      // First, get the accurate server-side calculated price
      console.log('📋 Calculating accurate server-side price before booking...');
      
      const priceRequest = {
        serviceId: selectedService?.serviceId!,
        selectedChoiceIds: selectedOptions.map(opt => opt.choiceId),
        quantity: 1
      };
      
      let serverCalculatedPrice = finalPrice || totalPrice || selectedService?.basePrice!;
      
      try {
        const priceResponse = await serviceService.calculateServicePrice(priceRequest);
        if (priceResponse.success && priceResponse.data) {
          serverCalculatedPrice = priceResponse.data.finalPrice;
          console.log('📋 Server calculated price:', serverCalculatedPrice);
        }
      } catch (priceError) {
        console.warn('⚠️ Price calculation failed, using fallback price:', priceError);
        // Continue with fallback price
      }

      console.log('📋 Using price for booking:', serverCalculatedPrice);

      // Prepare booking data for parent component to handle
      const bookingData: BookingRequest = {
        addressId: selectedAddress?.addressId ? String(selectedAddress.addressId || selectedAddress.id) : undefined,
        newAddress: !selectedAddress?.addressId ? {
          customerId: (user as any)?.customerId || "c1000001-0000-0000-0000-000000000001", // Use actual customer ID or fallback
          fullAddress: selectedAddress?.fullAddress || "",
          ward: selectedAddress?.ward || "",
          district: selectedAddress?.district || "",
          city: selectedAddress?.city || "",
          latitude: selectedAddress?.latitude,
          longitude: selectedAddress?.longitude,
        } : undefined,
        bookingTime: bookingDateTime,
        note: bookingNote,
        promoCode: promoCode || undefined,
        bookingDetails: [
          {
            serviceId: selectedService?.serviceId!,
            quantity: 1,
            expectedPrice: serverCalculatedPrice,
            expectedPricePerUnit: serverCalculatedPrice,
            selectedChoiceIds: selectedOptions.map(opt => opt.choiceId),
          }
        ],
        assignments: selectedEmployeeId ? [
          {
            serviceId: selectedService?.serviceId!,
            employeeId: selectedEmployeeId,
          }
        ] : undefined,
        paymentMethodId: selectedPaymentMethodId!,
      };

      console.log('📋 Passing booking data to parent component:', bookingData);
      
      // Pass booking data to parent (BookingNavigator) to handle creation and navigation
      onConfirm(bookingData);
      
    } catch (error) {
      console.error('❌ Error in booking confirmation:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <View style={commonStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Header */}
      <View style={commonStyles.header}>
        <TouchableOpacity style={commonStyles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={commonStyles.headerContent}>
          <Text style={commonStyles.headerTitle}>Xác nhận đặt lịch</Text>
          <Text style={commonStyles.headerSubtitle}>Kiểm tra thông tin trước khi xác nhận</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Service Summary */}
        <View style={[commonStyles.section, { margin: 20, marginBottom: 12 }]}>
          <Text style={commonStyles.sectionTitle}>Dịch vụ</Text>
          <View style={[commonStyles.card, { marginTop: 12 }]}>
            <View style={commonStyles.flexRowBetween}>
              <Text style={commonStyles.cardTitle}>{selectedService?.name}</Text>
              <Text style={commonStyles.cardPrice}>
                {formatPrice(totalPrice || selectedService?.basePrice || 0)}
              </Text>
            </View>
            {selectedService?.description && (
              <Text style={[commonStyles.cardDescription, { marginTop: 8 }]}>
                {selectedService.description}
              </Text>
            )}
            <Text style={[commonStyles.cardDescription, { marginTop: 4 }]}>
              Thời gian thực hiện: {(selectedService?.estimatedDurationHours || 0) * 60} phút
            </Text>
          </View>

          {/* Debug Service Options */}
          {(() => {
            console.log('🔍 Rendering service options:', {
              selectedOptionsLength: selectedOptions.length,
              selectedOptions: selectedOptions
            });
            return null;
          })()}

          {/* Service Options */}
          {selectedOptions.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={[commonStyles.cardDescription, { fontWeight: '600', marginBottom: 8 }]}>
                Tùy chọn thêm:
              </Text>
              {selectedOptions.map((option) => (
                <View key={option.choiceId} style={[commonStyles.flexRowBetween, { marginBottom: 4 }]}>
                  <Text style={commonStyles.cardDescription}>{option.choiceName}</Text>
                  <Text style={[commonStyles.cardDescription, { color: '#007AFF', fontWeight: '600' }]}>
                    +{formatPrice(option.priceAdjustment)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Show message if no options */}
          {selectedOptions.length === 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={[commonStyles.cardDescription, { fontStyle: 'italic' }]}>
                Không có tùy chọn thêm được chọn
              </Text>
            </View>
          )}
        </View>

        {/* Time & Location Summary */}
        <View style={[commonStyles.section, { margin: 20, marginTop: 0 }]}>
          <Text style={commonStyles.sectionTitle}>Thời gian & Địa điểm</Text>
          
          <View style={[commonStyles.card, { marginTop: 12 }]}>
            <View style={commonStyles.flexRow}>
              <Ionicons name="time" size={20} color="#007AFF" style={{ marginRight: 12 }} />
              <View>
                <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>Thời gian</Text>
                <Text style={commonStyles.cardTitle}>
                  {formatDate(selectedDate)} lúc {selectedTime}
                </Text>
              </View>
            </View>
          </View>

          <View style={[commonStyles.card, { marginTop: 8 }]}>
            <View style={commonStyles.flexRow}>
              <Ionicons name="location" size={20} color="#007AFF" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>Địa chỉ</Text>
                <Text style={commonStyles.cardTitle}>
                  {selectedAddress?.fullAddress || selectedAddress?.address}
                </Text>
                {(selectedAddress?.ward && selectedAddress?.district && selectedAddress?.city) && (
                  <Text style={commonStyles.cardDescription}>
                    {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.city}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Employee Information */}
        <View style={[commonStyles.section, { margin: 20, marginTop: 0 }]}>
          <Text style={commonStyles.sectionTitle}>Nhân viên thực hiện</Text>
          
          {selectedEmployeeId ? (
            <View style={[commonStyles.card, { marginTop: 12 }]}>
              <View style={commonStyles.flexRow}>
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#007AFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>NV</Text>
                </View>
                <View>
                  <Text style={commonStyles.cardTitle}>Nhân viên đã chọn</Text>
                  <Text style={commonStyles.cardDescription}>ID: {selectedEmployeeId}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={[commonStyles.card, { marginTop: 12 }]}>
              <View style={commonStyles.flexRow}>
                <Ionicons name="shuffle" size={20} color="#007AFF" style={{ marginRight: 12 }} />
                <Text style={commonStyles.cardDescription}>
                  Hệ thống sẽ tự động phân công nhân viên phù hợp nhất
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Price Breakdown */}
        <View style={[commonStyles.section, { margin: 20, marginTop: 0 }]}>
          <Text style={commonStyles.sectionTitle}>Chi tiết giá</Text>
          
          {(() => {
            console.log('🔍 Rendering price breakdown:', {
              selectedServiceBasePrice: selectedService?.basePrice,
              selectedOptionsForPrice: selectedOptions,
              totalPrice: totalPrice,
              finalPrice: finalPrice,
              calculatedOptionsTotal: selectedOptions.reduce((sum, opt) => sum + (opt.priceAdjustment || 0), 0)
            });
            return null;
          })()}
          
          <View style={[commonStyles.card, { marginTop: 12 }]}>
            <View style={commonStyles.flexRowBetween}>
              <Text style={commonStyles.cardDescription}>Dịch vụ cơ bản</Text>
              <Text style={commonStyles.cardDescription}>{formatPrice(selectedService?.basePrice || 0)}</Text>
            </View>
            
            {selectedOptions.map((option) => (
              <View key={option.choiceId} style={[commonStyles.flexRowBetween, { marginTop: 8 }]}>
                <Text style={commonStyles.cardDescription}>{option.choiceName}</Text>
                <Text style={commonStyles.cardDescription}>+{formatPrice(option.priceAdjustment)}</Text>
              </View>
            ))}

            {selectedOptions.length === 0 && (
              <View style={[commonStyles.flexRowBetween, { marginTop: 8 }]}>
                <Text style={[commonStyles.cardDescription, { fontStyle: 'italic' }]}>Không có tùy chọn thêm</Text>
                <Text style={commonStyles.cardDescription}>+{formatPrice(0)}</Text>
              </View>
            )}

            {/* Show subtotal before final adjustments */}
            {(() => {
              const basePrice = selectedService?.basePrice || 0;
              const optionsTotal = selectedOptions.reduce((sum, opt) => sum + (opt.priceAdjustment || 0), 0);
              const calculatedSubtotal = basePrice + optionsTotal;
              
              if (totalPrice !== calculatedSubtotal) {
                return (
                  <>
                    <View style={{
                      height: 1,
                      backgroundColor: '#E5E7EB',
                      marginVertical: 12
                    }} />
                    <View style={[commonStyles.flexRowBetween, { marginTop: 8 }]}>
                      <Text style={commonStyles.cardDescription}>Phụ trội từ hệ thống</Text>
                      <Text style={[commonStyles.cardDescription, { 
                        color: totalPrice > calculatedSubtotal ? '#FF9500' : '#34C759',
                        fontWeight: '600' 
                      }]}>
                        {totalPrice > calculatedSubtotal ? '+' : ''}{formatPrice(totalPrice - calculatedSubtotal)}
                      </Text>
                    </View>
                  </>
                );
              }
              return null;
            })()}

            {finalPrice !== totalPrice && (
              <>
                <View style={{
                  height: 1,
                  backgroundColor: '#E5E7EB',
                  marginVertical: 12
                }} />
                <View style={[commonStyles.flexRowBetween, { marginTop: 8 }]}>
                  <Text style={commonStyles.cardDescription}>Điều chỉnh cuối</Text>
                  <Text style={[commonStyles.cardDescription, { 
                    color: finalPrice > totalPrice ? '#FF9500' : '#34C759',
                    fontWeight: '600' 
                  }]}>
                    {finalPrice > totalPrice ? '+' : ''}{formatPrice(finalPrice - totalPrice)}
                  </Text>
                </View>
              </>
            )}

            <View style={{
              height: 1,
              backgroundColor: '#E5E7EB',
              marginVertical: 12
            }} />
            <View style={commonStyles.flexRowBetween}>
              <Text style={[commonStyles.cardTitle, { fontSize: 18 }]}>Tổng cộng</Text>
              <Text style={[commonStyles.cardPrice, { fontSize: 18 }]}>{formatPrice(finalPrice)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={[commonStyles.section, { margin: 20, marginTop: 0 }]}>
          <Text style={commonStyles.sectionTitle}>Phương thức thanh toán</Text>
          {(() => {
            console.log('💳 Render check:', {
              loadingPaymentMethods,
              paymentMethodsLength: paymentMethods.length,
              paymentMethods: paymentMethods
            });
            return null;
          })()}
          {loadingPaymentMethods ? (
            <View style={commonStyles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={commonStyles.loadingText}>Đang tải phương thức thanh toán...</Text>
            </View>
          ) : paymentMethods.length === 0 ? (
            <View style={commonStyles.loadingContainer}>
              <Text style={commonStyles.loadingText}>Không có phương thức thanh toán nào</Text>
            </View>
          ) : (
            <View style={{ marginTop: 12 }}>
              {paymentMethods.map((method) => {
                console.log('💳 Rendering method:', method);
                return (
                  <TouchableOpacity
                    key={method.methodId}
                    style={[
                      commonStyles.card,
                      { marginBottom: 8 },
                      selectedPaymentMethodId === method.methodId && commonStyles.cardSelected
                    ]}
                    onPress={() => onPaymentMethodSelect(method.methodId)}
                  >
                    <View style={commonStyles.flexRowBetween}>
                      <Text style={[
                        commonStyles.cardTitle,
                        selectedPaymentMethodId === method.methodId && { color: '#007AFF' }
                      ]}>
                        {method.methodName}
                      </Text>
                      {selectedPaymentMethodId === method.methodId && (
                        <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Booking Note */}
        <View style={[commonStyles.section, { margin: 20, marginTop: 0 }]}>
          <Text style={commonStyles.sectionTitle}>Ghi chú (tùy chọn)</Text>
          <TextInput
            style={[commonStyles.input, { 
              minHeight: 80, 
              textAlignVertical: 'top',
              marginTop: 12
            }]}
            value={bookingNote}
            onChangeText={onNoteChange}
            placeholder="Nhập ghi chú cho đơn đặt lịch..."
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          <Text style={[commonStyles.cardDescription, { textAlign: 'right', marginTop: 4 }]}>
            {bookingNote.length}/500
          </Text>
        </View>

        {/* Promo Code */}
        <View style={[commonStyles.section, { margin: 20, marginTop: 0 }]}>
          <Text style={commonStyles.sectionTitle}>Mã khuyến mãi (tùy chọn)</Text>
          <View style={[commonStyles.flexRow, { marginTop: 12, gap: 8 }]}>
            <TextInput
              style={[commonStyles.input, { flex: 1 }]}
              value={promoCode}
              onChangeText={onPromoCodeChange}
              placeholder="Nhập mã khuyến mãi"
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              style={[commonStyles.secondaryButton, { paddingHorizontal: 16 }]}
              onPress={applyPromoCode}
            >
              <Text style={commonStyles.secondaryButtonText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={[commonStyles.section, { margin: 20, marginTop: 0 }]}>
          <Text style={commonStyles.sectionTitle}>Điều khoản</Text>
          
          <TouchableOpacity 
            style={[commonStyles.checkboxContainer, { marginTop: 12 }]}
            onPress={() => setAcceptTerms(!acceptTerms)}
          >
            <Checkbox 
              checked={acceptTerms}
              onPress={() => setAcceptTerms(!acceptTerms)}
            />
            <Text style={commonStyles.checkboxLabel}>
              Tôi đồng ý với{' '}
              <Text style={{ color: '#007AFF', textDecorationLine: 'underline' }}>điều khoản sử dụng</Text>
              {' '}và{' '}
              <Text style={{ color: '#007AFF', textDecorationLine: 'underline' }}>chính sách bảo mật</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={commonStyles.checkboxContainer}
            onPress={() => setAcceptReschedule(!acceptReschedule)}
          >
            <Checkbox 
              checked={acceptReschedule}
              onPress={() => setAcceptReschedule(!acceptReschedule)}
            />
            <Text style={commonStyles.checkboxLabel}>
              Tôi hiểu rằng có thể hủy/đổi lịch trước 2 giờ mà không bị phạt phí
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms and Conditions */}
        <View style={[commonStyles.section, { margin: 20, marginTop: 0 }]}>
          <Text style={commonStyles.sectionTitle}>Điều khoản</Text>
          
          <TouchableOpacity 
            style={[commonStyles.checkboxContainer, { marginTop: 12 }]}
            onPress={() => setAcceptTerms(!acceptTerms)}
          >
            <Checkbox 
              checked={acceptTerms}
              onPress={() => setAcceptTerms(!acceptTerms)}
            />
            <Text style={commonStyles.checkboxLabel}>
              Tôi đồng ý với{' '}
              <Text style={{ color: '#007AFF', textDecorationLine: 'underline' }}>điều khoản sử dụng</Text>
              {' '}và{' '}
              <Text style={{ color: '#007AFF', textDecorationLine: 'underline' }}>chính sách bảo mật</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={commonStyles.checkboxContainer}
            onPress={() => setAcceptReschedule(!acceptReschedule)}
          >
            <Checkbox 
              checked={acceptReschedule}
              onPress={() => setAcceptReschedule(!acceptReschedule)}
            />
            <Text style={commonStyles.checkboxLabel}>
              Tôi hiểu rằng có thể hủy/đổi lịch trước 2 giờ mà không bị phạt phí
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={commonStyles.buttonContainer}>
        <TouchableOpacity
          style={[
            commonStyles.primaryButton,
            (!acceptTerms || !acceptReschedule || loading) && commonStyles.primaryButtonDisabled
          ]}
          onPress={handleConfirmBooking}
          disabled={!acceptTerms || !acceptReschedule || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={commonStyles.primaryButtonText}>Xác nhận đặt lịch</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // BookingConfirmation specific styles if needed
});

export default BookingConfirmation;