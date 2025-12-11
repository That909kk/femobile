import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Animated,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, responsive, responsiveSpacing, responsiveFontSize } from '../../../../styles';
import { BookingResponse } from '../../../../types/booking';
import { commonStyles } from './styles';
import { ProgressIndicator } from './ProgressIndicator';
import { BookingStep } from './types';
import { useChatStore } from '../../../../store/chatStore';
import { useUserInfo } from '../../../../hooks';
import { useAuthStore } from '../../../../store/authStore';

interface BookingSuccessProps {
  bookingData: BookingResponse;
  onViewBookings: () => void;
  onBookMore: () => void;
  onGoHome: () => void;
  navigation?: any; // Add navigation prop
}

/**
 * DEMO/TEST DATA EXAMPLE:
 * 
 * Để test chức năng tạo conversation tự động, bookingData cần có:
 * 
 * const mockBookingData: BookingResponse = {
 *   bookingId: "b0000001-0000-0000-0000-000000000001",
 *   bookingCode: "BK123456",
 *   customerId: "c1000001-0000-0000-0000-000000000001", // John Doe
 *   status: "CONFIRMED",
 *   totalAmount: 500000,
 *   formattedTotalAmount: "500,000 ₫",
 *   bookingTime: "2025-11-21T09:00:00",
 *   createdAt: "2025-11-21T08:00:00",
 *   assignedEmployees: [
 *     {
 *       employeeId: "e1000001-0000-0000-0000-000000000001",
 *       fullName: "Jane Smith",
 *       email: "jane.smith@example.com",
 *       phoneNumber: "0901234567",
 *       avatar: "https://picsum.photos/200",
 *       rating: 4.8,
 *       employeeStatus: "ACTIVE",
 *       skills: ["Dọn dẹp", "Giặt ủi"],
 *       bio: "Nhân viên chuyên nghiệp"
 *     }
 *   ],
 *   serviceDetails: [
 *     {
 *       service: { name: "Dọn dẹp nhà cửa" },
 *       quantity: 1,
 *       formattedPricePerUnit: "300,000 ₫",
 *       formattedSubTotal: "300,000 ₫",
 *       formattedDuration: "2 giờ"
 *     }
 *   ],
 *   address: {
 *     fullAddress: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM"
 *   }
 * };
 * 
 * Kết quả mong đợi:
 * 1. Sau 1 giây, hiển thị "Đang tạo cuộc trò chuyện với nhân viên..."
 * 2. API POST /api/v1/conversations được gọi với:
 *    {
 *      customerId: "c1000001-0000-0000-0000-000000000001",
 *      employeeId: "e1000001-0000-0000-0000-000000000001", 
 *      bookingId: "b0000001-0000-0000-0000-000000000001"
 *    }
 * 3. Backend tự động tạo tin nhắn chào: "Cảm ơn bạn đã chọn tôi thực hiện dịch vụ cho bạn"
 * 4. Hiển thị "✓ Cuộc trò chuyện với nhân viên đã được tạo!"
 * 5. Console log: conversationId, customerName, employeeName, bookingId
 * 
 * Trường hợp KHÔNG tạo conversation:
 * - isRecurring = true (lịch định kỳ - chưa phát triển)
 * - Không có assignedEmployees
 * - Thiếu customerId, employeeId hoặc bookingId
 * 
 * Trường hợp TẠO conversation:
 * - Đặt lịch đơn (single booking)
 * - Đặt nhiều lịch hẹn (multiple bookings)
 */

const InfoRow: React.FC<{ icon: string; label: string; value: string; valueStyle?: any }> = ({
  icon,
  label,
  value,
  valueStyle,
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconContainer}>
      <Ionicons name={icon as any} size={20} color={colors.highlight.teal} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
  </View>
);

export const BookingSuccess: React.FC<BookingSuccessProps> = ({
  bookingData,
  onViewBookings,
  onBookMore,
  onGoHome,
  navigation,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [conversationCreating, setConversationCreating] = useState(false);
  const [conversationCreated, setConversationCreated] = useState(false);
  const [createdConversationId, setCreatedConversationId] = useState<string | null>(null);
  
  const { userInfo } = useUserInfo();
  const { user: authUser } = useAuthStore();
  const { createConversation } = useChatStore();

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Auto-create conversation after successful booking
  useEffect(() => {
    const createConversationAfterBooking = async () => {
      // Skip if already created or creating
      if (conversationCreated || conversationCreating) return;
      
      // Skip ONLY for recurring bookings (not yet developed)
      // Allow conversation creation for single bookings and multiple bookings
      if ((bookingData as any).isRecurring) {
        console.log('✓ Skip conversation creation for recurring bookings (not yet supported)');
        return;
      }
      
      // Need customerId, employeeId, and bookingId
      // Try multiple sources for customerId:
      // 1. userInfo.id (from useUserInfo hook)
      // 2. authUser.customerId (from auth store - only for CUSTOMER role)
      // 3. bookingData.customerId (from booking response)
      const customerId = userInfo?.id || (authUser && 'customerId' in authUser ? authUser.customerId : undefined) || bookingData.customerId;
      const employeeId = bookingData.assignedEmployees?.[0]?.employeeId;
      const bookingId = bookingData.bookingId;
      
      // For multiple bookings: bookingId is the parent/first booking ID
      // Backend will create one conversation linked to this bookingId
      // When user clicks different bookings, they'll see the same conversation
      
      if (!customerId || !employeeId || !bookingId) {
        console.log('⚠️ Missing required data for conversation creation:', {
          customerId,
          employeeId,
          bookingId,
          hasAssignedEmployees: !!bookingData.assignedEmployees,
          assignedEmployeesCount: bookingData.assignedEmployees?.length || 0,
          userInfoId: userInfo?.id,
          authUserCustomerId: authUser && 'customerId' in authUser ? authUser.customerId : undefined,
          bookingDataCustomerId: bookingData.customerId,
        });
        return;
      }
      
      try {
        setConversationCreating(true);
        console.log('🔄 Creating conversation for booking:', {
          customerId,
          employeeId,
          bookingId,
          employeeName: bookingData.assignedEmployees?.[0]?.fullName,
        });
        
        const conversation = await createConversation(customerId, employeeId, bookingId);
        
        console.log('✅ Conversation created successfully!', {
          conversationId: conversation.conversationId,
          customerName: conversation.customerName,
          employeeName: conversation.employeeName,
          bookingId: conversation.bookingId,
          lastMessage: conversation.lastMessage,
        });
        
        setConversationCreated(true);
        setCreatedConversationId(conversation.conversationId);
        
        // Optional: Show success notification
        // Alert.alert(
        //   '✓ Đã tạo cuộc trò chuyện', 
        //   `Bạn có thể chat với ${bookingData.assignedEmployees?.[0]?.fullName} trong phần Tin nhắn`,
        //   [{ text: 'OK' }]
        // );
      } catch (error: any) {
        console.error('❌ Error creating conversation:', {
          error: error.message || error,
          customerId,
          employeeId,
          bookingId,
        });
        // Silent fail - don't disrupt booking success experience
      } finally {
        setConversationCreating(false);
      }
    };
    
    // Wait a bit for animations to complete
    const timer = setTimeout(createConversationAfterBooking, 1000);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData.bookingId]); // Only re-run if bookingId changes

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Đặt dịch vụ thành công!\nMã: ${bookingData.bookingCode}\nThời gian: ${bookingData.bookingTime}\nTổng tiền: ${bookingData.formattedTotalAmount}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert('Thông báo', 'Chức năng đang được phát triển');
  };

  const handleContactEmployee = () => {
    if (!createdConversationId) {
      Alert.alert('Thông báo', 'Đang tạo cuộc trò chuyện, vui lòng đợi trong giây lát...');
      return;
    }

    if (!navigation) {
      Alert.alert('Lỗi', 'Không thể mở màn hình chat');
      return;
    }

    // Get employee name for chat header
    const employeeName = bookingData.assignedEmployees?.[0]?.fullName || 'Nhân viên';

    // Navigate to ChatScreen - use parent navigation to go out of tab navigator
    const parentNavigation = navigation.getParent?.() || navigation;
    parentNavigation.navigate('ChatScreen', {
      conversationId: createdConversationId,
      recipientName: employeeName,
    });
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateTimeString;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={BookingStep.SUCCESS} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Icon với Animation */}
        <Animated.View style={[styles.successIconContainer, { 
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim 
        }]}>
          <View style={styles.successIconBg}>
            <Ionicons name="checkmark-circle" size={100} color={colors.feedback.success} />
          </View>
        </Animated.View>

        {/* Success Message */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.successTitle}>
            {(bookingData as any).isRecurring 
              ? 'Tạo lịch định kỳ thành công!' 
              : (bookingData as any).isMultiple
              ? 'Tạo nhiều lịch hẹn thành công!'
              : 'Đặt dịch vụ thành công!'}
          </Text>
          <Text style={styles.successSubtitle}>
            {(bookingData as any).isRecurring 
              ? `Hệ thống đã tạo ${(bookingData as any).recurringInfo?.totalGeneratedBookings || 0} lịch hẹn tự động`
              : (bookingData as any).isMultiple
              ? `Đã tạo thành công ${(bookingData as any).multipleInfo?.successfulBookings || 0} lịch hẹn`
              : 'Chúng tôi đã nhận được yêu cầu của bạn'}
          </Text>
        </Animated.View>

        {/* Quick Info Cards - Similar to Web MetricCards */}
        <Animated.View style={[styles.quickInfoContainer, { opacity: fadeAnim }]}>
          {/* Status Card */}
          <View style={styles.quickInfoCard}>
            <View style={[styles.quickInfoIconBg, { backgroundColor: colors.highlight.purple + '20' }]}>
              <Ionicons name="hourglass-outline" size={20} color={colors.highlight.purple} />
            </View>
            <Text style={styles.quickInfoLabel}>Trạng thái</Text>
            <Text style={[styles.quickInfoValue, { color: colors.highlight.purple }]}>
              {(bookingData as any).statusDisplay || 
               (bookingData.status === 'AWAITING_EMPLOYEE' ? 'Chờ phân công' : 
               bookingData.status === 'PENDING' ? 'Chờ xác nhận' : 
               bookingData.status === 'CONFIRMED' ? 'Đã xác nhận' :
               bookingData.status === 'ACTIVE' ? 'Đang hoạt động' :
               bookingData.status || 'Đang xử lý')}
            </Text>
          </View>

          {/* Time Card */}
          <View style={styles.quickInfoCard}>
            <View style={[styles.quickInfoIconBg, { backgroundColor: colors.highlight.teal + '20' }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.highlight.teal} />
            </View>
            <Text style={styles.quickInfoLabel}>
              {(bookingData as any).isRecurring ? 'Bắt đầu' : 'Thời gian'}
            </Text>
            <Text style={styles.quickInfoValue}>
              {(bookingData as any).isRecurring && (bookingData as any).recurringInfo
                ? (bookingData as any).recurringInfo.startDate
                : bookingData.bookingTime 
                  ? new Date(bookingData.bookingTime).toLocaleDateString('vi-VN', { 
                      day: '2-digit', 
                      month: '2-digit'
                    })
                  : 'N/A'}
            </Text>
          </View>

          {/* Payment Card */}
          <View style={styles.quickInfoCard}>
            <View style={[styles.quickInfoIconBg, { backgroundColor: (bookingData as any).isRecurring ? colors.feedback.warning + '20' : colors.feedback.success + '20' }]}>
              <Ionicons name="card-outline" size={20} color={(bookingData as any).isRecurring ? colors.feedback.warning : colors.feedback.success} />
            </View>
            <Text style={styles.quickInfoLabel}>Thanh toán</Text>
            <Text style={[styles.quickInfoValue, { color: (bookingData as any).isRecurring ? colors.feedback.warning : colors.feedback.success, fontSize: 11 }]}>
              {(bookingData as any).isRecurring 
                ? 'Trả theo lần'
                : bookingData.paymentInfo?.paymentStatus === 'PAID' ? 'Đã thanh toán' : 
                  typeof bookingData.paymentInfo?.paymentMethod === 'string' && 
                  (bookingData.paymentInfo.paymentMethod.toUpperCase().includes('CASH') || 
                   bookingData.paymentInfo.paymentMethod.toUpperCase().includes('TIỀN MẶT'))
                  ? 'Trả khi xong' : 'Chờ thanh toán'}
            </Text>
          </View>
        </Animated.View>

        {/* Recurring Info Card */}
        {(bookingData as any).isRecurring && (bookingData as any).recurringInfo && (
          <Animated.View style={[styles.detailsCard, { opacity: fadeAnim, backgroundColor: colors.highlight.purple + '08', borderWidth: 2, borderColor: colors.highlight.purple }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={[styles.quickInfoIconBg, { backgroundColor: colors.highlight.purple + '20' }]}>
                <Ionicons name="repeat" size={22} color={colors.highlight.purple} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 0, color: colors.highlight.purple }]}>
                  Lịch định kỳ
                </Text>
                <Text style={{ fontSize: 12, color: colors.neutral.textSecondary }}>
                  {(bookingData as any).recurringInfo.recurrenceTypeDisplay || 
                   ((bookingData as any).recurringInfo.recurrenceType === 'WEEKLY' ? 'Hàng tuần' : 'Hàng tháng')}
                </Text>
              </View>
            </View>
            
            <InfoRow
              icon="calendar-outline"
              label="Lặp lại vào"
              value={(bookingData as any).recurringInfo.recurrenceDaysDisplay || 'Chưa xác định'}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="time-outline"
              label="Giờ thực hiện"
              value={(bookingData as any).recurringInfo.bookingTime?.substring(0, 5) || 
                     bookingData.bookingTime?.substring(11, 16) || 'Chưa xác định'}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="calendar-number-outline"
              label="Khoảng thời gian"
              value={`${(bookingData as any).recurringInfo.startDate || ''} ${(bookingData as any).recurringInfo.endDate ? `→ ${(bookingData as any).recurringInfo.endDate}` : '(không giới hạn)'}`}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="layers-outline"
              label="Lịch đã tạo"
              value={`${(bookingData as any).recurringInfo.totalGeneratedBookings || 0} lịch hẹn`}
              valueStyle={{ color: colors.feedback.success, fontWeight: '700' }}
            />
            
            {/* Ghi chú thanh toán */}
            <View style={{ marginTop: 16, padding: 12, backgroundColor: colors.feedback.warning + '15', borderRadius: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons name="information-circle" size={18} color={colors.feedback.warning} style={{ marginRight: 8, marginTop: 1 }} />
                <Text style={{ flex: 1, fontSize: 13, color: colors.feedback.warning, lineHeight: 18 }}>
                  Bạn sẽ thanh toán sau mỗi lần thực hiện dịch vụ. Hệ thống sẽ tự động tạo lịch hẹn theo chu kỳ đã chọn.
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Multiple Bookings Info Card */}
        {(bookingData as any).isMultiple && (bookingData as any).multipleInfo && (
          <Animated.View style={[styles.detailsCard, { opacity: fadeAnim, backgroundColor: colors.highlight.teal + '10', borderWidth: 2, borderColor: colors.highlight.teal }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="calendar-sharp" size={24} color={colors.highlight.teal} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { marginBottom: 0, color: colors.highlight.teal }]}>
                Nhiều lịch hẹn
              </Text>
            </View>
            <InfoRow
              icon="checkbox-outline"
              label="Tổng số lịch đã tạo"
              value={`${(bookingData as any).multipleInfo.totalBookingsCreated || 0} lịch hẹn`}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="checkmark-circle-outline"
              label="Thành công"
              value={`${(bookingData as any).multipleInfo.successfulBookings || 0} lịch`}
              valueStyle={{ color: colors.feedback.success, fontWeight: '700' }}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="close-circle-outline"
              label="Thất bại"
              value={`${(bookingData as any).multipleInfo.failedBookings || 0} lịch`}
              valueStyle={{ color: colors.feedback.error, fontWeight: '700' }}
            />
            
            {/* Tổng thanh toán cho multiple booking */}
            {(bookingData as any).multipleInfo.formattedTotalAmount && (
              <>
                <View style={styles.divider} />
                <InfoRow
                  icon="cash-outline"
                  label="Tổng thanh toán"
                  value={(bookingData as any).multipleInfo.formattedTotalAmount}
                  valueStyle={{ color: colors.highlight.teal, fontWeight: '700', fontSize: 16 }}
                />
              </>
            )}
          </Animated.View>
        )}

        {/* Multiple Bookings List - Danh sách các booking đã tạo */}
        {(bookingData as any).isMultiple && (bookingData as any).multipleInfo?.bookings?.length > 0 && (
          <Animated.View style={[styles.detailsCard, { opacity: fadeAnim }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={[styles.quickInfoIconBg, { backgroundColor: colors.primary.navy + '15' }]}>
                <Ionicons name="list-outline" size={20} color={colors.primary.navy} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                  Danh sách {(bookingData as any).multipleInfo.totalBookingsCreated || 0} đơn hàng
                </Text>
                <Text style={{ fontSize: 12, color: colors.neutral.textSecondary }}>
                  Tất cả các đơn hàng đã được tạo thành công
                </Text>
              </View>
            </View>
            
            {(bookingData as any).multipleInfo.bookings.map((booking: any, index: number) => (
              <View 
                key={booking.bookingId || index} 
                style={{
                  backgroundColor: colors.warm.beige,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: index < (bookingData as any).multipleInfo.bookings.length - 1 ? 12 : 0,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.highlight.teal,
                }}
              >
                {/* Header: Mã đơn và thành tiền */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary.navy }}>
                      Đơn #{index + 1}: {booking.bookingCode || 'N/A'}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.neutral.textSecondary, marginTop: 4 }}>
                      {booking.bookingTime 
                        ? new Date(booking.bookingTime).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) + ' - ' + new Date(booking.bookingTime).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: colors.neutral.textSecondary }}>Thành tiền</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.feedback.success }}>
                      {booking.formattedTotalAmount || `${(booking.totalAmount || 0).toLocaleString('vi-VN')}₫`}
                    </Text>
                  </View>
                </View>
                
                {/* Status badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    backgroundColor: booking.status === 'CONFIRMED' ? colors.feedback.success + '20' : 
                                    booking.status === 'AWAITING_EMPLOYEE' ? colors.highlight.purple + '20' :
                                    colors.feedback.warning + '20',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: booking.status === 'CONFIRMED' ? colors.feedback.success : 
                             booking.status === 'AWAITING_EMPLOYEE' ? colors.highlight.purple :
                             colors.feedback.warning,
                    }}>
                      {booking.statusDisplay || 
                       (booking.status === 'AWAITING_EMPLOYEE' ? 'Chờ phân công' : 
                        booking.status === 'PENDING' ? 'Chờ xác nhận' :
                        booking.status === 'CONFIRMED' ? 'Đã xác nhận' :
                        booking.status || 'Đang xử lý')}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Booking Details Card */}
        <Animated.View style={[styles.detailsCard, { opacity: fadeAnim }]}>
          <InfoRow
            icon="receipt-outline"
            label="Mã đặt dịch vụ"
            value={bookingData.bookingCode || bookingData.bookingId || 'Đang cập nhật'}
          />
          <View style={styles.divider} />
          
          {/* Hiển thị Title nếu có (booking post) */}
          {bookingData.title && (
            <>
              <InfoRow
                icon="create-outline"
                label="Tiêu đề"
                value={bookingData.title}
              />
              <View style={styles.divider} />
            </>
          )}
          
          {/* Only show booking time for non-recurring */}
          {!(bookingData as any).isRecurring && bookingData.bookingTime && (
            <>
              <InfoRow
                icon="calendar-outline"
                label="Thời gian"
                value={formatDateTime(bookingData.bookingTime)}
              />
              <View style={styles.divider} />
            </>
          )}
          
          <InfoRow
            icon="location-outline"
            label="Địa chỉ"
            value={bookingData.customerInfo?.fullAddress || bookingData.address?.fullAddress || 'Không có địa chỉ'}
          />
          <View style={styles.divider} />
          
          {/* Trạng thái */}
          <InfoRow
            icon="hourglass-outline"
            label="Trạng thái"
            value={(bookingData as any).statusDisplay || 
                   (bookingData.status === 'AWAITING_EMPLOYEE' ? 'Chờ phân công nhân viên' : 
                   bookingData.status === 'PENDING' ? 'Chờ xác nhận' : 
                   bookingData.status === 'CONFIRMED' ? 'Đã xác nhận' :
                   bookingData.status === 'ACTIVE' ? 'Đang hoạt động' :
                   bookingData.status || 'Đang xử lý')}
          />
          <View style={styles.divider} />
          
          {/* Ghi chú nếu có */}
          {bookingData.note && (
            <>
              <InfoRow
                icon="document-text-outline"
                label="Ghi chú"
                value={bookingData.note}
              />
              <View style={styles.divider} />
            </>
          )}
          
          {/* Show total price if available - special handling for recurring */}
          {(bookingData as any).isRecurring ? (
            <InfoRow
              icon="cash-outline"
              label="Thanh toán"
              value="Thanh toán sau mỗi lần thực hiện"
              valueStyle={{ color: colors.feedback.warning }}
            />
          ) : (bookingData.formattedTotalAmount || (bookingData as any).totalPrice) && (
            <InfoRow
              icon="cash-outline"
              label="Tổng tiền"
              value={bookingData.formattedTotalAmount || `${(bookingData as any).totalPrice?.toLocaleString('vi-VN')} ₫` || 'Đang cập nhật'}
              valueStyle={styles.priceValue}
            />
          )}
        </Animated.View>

        {/* Services Card */}
        {((bookingData.serviceDetails && bookingData.serviceDetails.length > 0) || (bookingData.bookingDetails && bookingData.bookingDetails.length > 0)) && (
          <Animated.View style={[styles.detailsCard, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>Dịch vụ đã đặt</Text>
            {(bookingData.serviceDetails || bookingData.bookingDetails || []).map((detail: any, index: number) => (
              <View key={detail.bookingDetailId || index}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.serviceItem}>
                  <View style={styles.serviceIconContainer}>
                    <Ionicons name="construct-outline" size={24} color={colors.highlight.teal} />
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{detail.service.name}</Text>
                    <Text style={styles.servicePrice}>
                      {detail.formattedPricePerUnit} x {detail.quantity} = {detail.formattedSubTotal}
                    </Text>
                    <Text style={styles.serviceDuration}>
                      <Ionicons name="time-outline" size={14} color={colors.neutral.textSecondary} /> {detail.formattedDuration}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Payment Summary Card - Fee Breakdown */}
        <Animated.View style={[styles.detailsCard, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Tóm tắt thanh toán</Text>
          
          {/* Service Breakdown */}
          <View style={styles.paymentSummarySection}>
            <Text style={styles.paymentSummaryLabel}>Chi tiết dịch vụ</Text>
            {(bookingData.serviceDetails || bookingData.bookingDetails || []).map((detail: any, index: number) => (
              <View key={detail.bookingDetailId || index}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentItemName}>
                    {detail.service?.name || 'Dịch vụ'} × {detail.quantity || 1}
                  </Text>
                  <Text style={styles.paymentItemAmount}>
                    {detail.formattedSubTotal || `${(detail.subTotal || 0).toLocaleString('vi-VN')} ₫`}
                  </Text>
                </View>
                {/* Service Options/Choices */}
                {detail.selectedChoices && detail.selectedChoices.length > 0 && (
                  detail.selectedChoices.map((choice: any, choiceIndex: number) => (
                    <View key={choiceIndex} style={styles.paymentSubRow}>
                      <Text style={styles.paymentSubItemName}>+ {choice.choiceName}</Text>
                      <Text style={styles.paymentSubItemAmount}>{choice.formattedPriceAdjustment}</Text>
                    </View>
                  ))
                )}
              </View>
            ))}
          </View>
          
          {/* Base Amount / Subtotal */}
          {(bookingData as any).baseAmount !== undefined && (
            <>
              <View style={styles.divider} />
              <View style={styles.paymentRow}>
                <Text style={styles.paymentItemName}>Tạm tính</Text>
                <Text style={styles.paymentItemAmount}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((bookingData as any).baseAmount)}
                </Text>
              </View>
            </>
          )}
          
          {/* Fee Breakdown */}
          {(bookingData as any).fees && (bookingData as any).fees.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.paymentSummarySection}>
                <Text style={styles.paymentSummaryLabel}>Phụ phí</Text>
                {(bookingData as any).fees.map((fee: any, index: number) => (
                  <View key={index} style={styles.paymentRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Text style={styles.paymentSubItemName}>{fee.name}</Text>
                      {fee.type === 'PERCENT' && (
                        <Text style={styles.percentBadge}>({(fee.value * 100).toFixed(0)}%)</Text>
                      )}
                      {fee.systemSurcharge && (
                        <View style={styles.systemBadge}>
                          <Text style={styles.systemBadgeText}>Hệ thống</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.paymentItemAmount, { color: colors.feedback.warning }]}>
                      +{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fee.amount)}
                    </Text>
                  </View>
                ))}
                
                {/* Total Fees */}
                {(bookingData as any).totalFees !== undefined && (
                  <View style={[styles.paymentRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.neutral.border, borderStyle: 'dashed' }]}>
                    <Text style={[styles.paymentItemName, { fontWeight: '600' }]}>Tổng phụ phí</Text>
                    <Text style={[styles.paymentItemAmount, { color: colors.feedback.warning, fontWeight: '700' }]}>
                      +{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((bookingData as any).totalFees)}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
          
          {/* Grand Total */}
          <View style={[styles.divider, { marginVertical: 12 }]} />
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Tổng cộng</Text>
            <Text style={styles.grandTotalAmount}>
              {bookingData.formattedTotalAmount || `${(bookingData.totalAmount || 0).toLocaleString('vi-VN')} ₫`}
            </Text>
          </View>
          
          {/* Cash Payment Note */}
          {bookingData.paymentInfo && typeof bookingData.paymentInfo.paymentMethod === 'string' && 
           (bookingData.paymentInfo.paymentMethod.toUpperCase().includes('CASH') || 
            bookingData.paymentInfo.paymentMethod.toUpperCase().includes('TIỀN MẶT')) && (
            <View style={styles.cashPaymentNote}>
              <Ionicons name="wallet-outline" size={16} color={colors.feedback.warning} />
              <Text style={styles.cashPaymentNoteText}>
                Thanh toán trực tiếp cho nhân viên sau khi hoàn thành
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Payment Info Card */}
        {bookingData.paymentInfo && (
          <Animated.View style={[styles.detailsCard, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
            <InfoRow
              icon="card-outline"
              label="Phương thức"
              value={typeof bookingData.paymentInfo.paymentMethod === 'string' 
                ? bookingData.paymentInfo.paymentMethod 
                : bookingData.paymentInfo.paymentMethod?.methodName || 'N/A'}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="checkmark-circle-outline"
              label="Trạng thái"
              value={bookingData.paymentInfo.paymentStatus === 'PENDING' ? 'Chưa thanh toán' :
                     bookingData.paymentInfo.paymentStatus === 'PAID' ? 'Đã thanh toán' :
                     bookingData.paymentInfo.paymentStatus}
            />
            {bookingData.paymentInfo.transactionCode && (
              <>
                <View style={styles.divider} />
                <InfoRow
                  icon="barcode-outline"
                  label="Mã giao dịch"
                  value={bookingData.paymentInfo.transactionCode}
                />
              </>
            )}
          </Animated.View>
        )}

        {/* Assigned Employees Card */}
        {bookingData.assignedEmployees && bookingData.assignedEmployees.length > 0 && (
          <Animated.View style={[styles.detailsCard, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>Nhân viên được phân công</Text>
            {bookingData.assignedEmployees.map((emp, index) => (
              <View key={emp.employeeId || index}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.employeeItem}>
                  {emp.avatar ? (
                    <Image source={{ uri: emp.avatar }} style={styles.employeeAvatar} />
                  ) : (
                    <View style={[styles.employeeAvatar, { backgroundColor: colors.neutral.border }]}>
                      <Ionicons name="person" size={24} color={colors.neutral.textSecondary} />
                    </View>
                  )}
                  <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName}>{emp.fullName}</Text>
                    <Text style={styles.employeePhone}>{emp.phoneNumber}</Text>
                    {emp.rating && (
                      <Text style={styles.employeeRating}>
                        <Ionicons name="star" size={14} color="#FFB800" /> {emp.rating}
                      </Text>
                    )}
                  </View>
                  
                  {/* Chat Icon Button */}
                  {conversationCreated && createdConversationId && (
                    <TouchableOpacity 
                      style={styles.chatIconButton}
                      onPress={handleContactEmployee}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chatbubble-ellipses" size={22} color={colors.neutral.white} />
                    </TouchableOpacity>
                  )}
                  
                  {/* Loading indicator while creating conversation */}
                  {conversationCreating && !conversationCreated && (
                    <View style={styles.chatIconButton}>
                      <ActivityIndicator size="small" color={colors.neutral.white} />
                    </View>
                  )}
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Hiển thị hình ảnh nếu có (booking post) */}
        {bookingData.imageUrls && bookingData.imageUrls.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
            <View style={styles.imageCard}>
              <Text style={styles.imageCardTitle}>Hình ảnh đính kèm ({bookingData.imageUrls.length})</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageScrollContainer}
              >
                {bookingData.imageUrls.map((url: string, index: number) => (
                  <Image 
                    key={index}
                    source={{ uri: url }} 
                    style={styles.bookingImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        )}

        {/* Additional Info */}
        <Animated.View style={{ opacity: fadeAnim, width: '100%', marginTop: responsiveSpacing.lg }}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.highlight.teal} />
            <Text style={styles.infoBoxText}>
              {bookingData.title 
                ? 'Bài đăng của bạn sẽ được hiển thị cho các nhân viên phù hợp. Chúng tôi sẽ liên hệ với bạn khi có nhân viên quan tâm.' 
                : 'Chúng tôi sẽ liên hệ với bạn để xác nhận chi tiết dịch vụ trước khi thực hiện.'}
            </Text>
          </View>
        </Animated.View>

        {/* Cancel Booking Button */}
        <Animated.View style={{ opacity: fadeAnim, width: '100%', marginTop: responsiveSpacing.md }}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBooking}>
            <Ionicons name="close-circle-outline" size={20} color={colors.feedback.error} />
            <Text style={styles.cancelText}>Hủy đặt</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Share Button */}
        <Animated.View style={{ opacity: fadeAnim, width: '100%', marginTop: responsiveSpacing.md }}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={colors.highlight.teal} />
            <Text style={styles.shareText}>Chia sẻ thông tin đặt lịch</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Text Link to Home */}
        <Animated.View style={{ opacity: fadeAnim, marginTop: responsiveSpacing.lg }}>
          <TouchableOpacity style={styles.textButton} onPress={onGoHome}>
            <Ionicons name="home-outline" size={18} color={colors.neutral.textSecondary} />
            <Text style={styles.textButtonText}>Về trang chủ</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <Animated.View style={[commonStyles.buttonContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={[commonStyles.primaryButton, commonStyles.flexRow, { justifyContent: 'center', marginBottom: responsiveSpacing.sm }]} 
          onPress={onViewBookings}
        >
          <Ionicons name="document-text-outline" size={20} color={colors.neutral.white} />
          <Text style={[commonStyles.primaryButtonText, { marginLeft: 8 }]}>Xem chi tiết đơn hàng</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[commonStyles.secondaryButton, commonStyles.flexRow, { justifyContent: 'center' }]} 
          onPress={onBookMore}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.highlight.teal} />
          <Text style={[commonStyles.secondaryButtonText, { marginLeft: 8 }]}>Đặt thêm dịch vụ</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  scrollContent: {
    padding: responsiveSpacing.lg,
    alignItems: 'center',
  },
  successIconContainer: {
    marginVertical: responsiveSpacing.xxl,
    alignItems: 'center',
  },
  successIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.feedback.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: responsiveFontSize.heading1,
    fontWeight: '700',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.xs,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    marginBottom: responsiveSpacing.xl,
    textAlign: 'center',
  },
  quickInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: responsiveSpacing.lg,
    gap: 8,
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: responsiveSpacing.sm,
    alignItems: 'center',
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickInfoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickInfoLabel: {
    fontSize: 11,
    color: colors.neutral.textSecondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  quickInfoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary.navy,
    textAlign: 'center',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: responsiveSpacing.lg,
    marginBottom: responsiveSpacing.md,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: responsiveSpacing.xs,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.highlight.teal + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveSpacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.highlight.teal,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral.border,
    marginVertical: responsiveSpacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.highlight.teal + '15',
    borderRadius: 12,
    padding: responsiveSpacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.highlight.teal,
  },
  infoBoxText: {
    flex: 1,
    fontSize: responsiveFontSize.caption,
    color: colors.primary.navy,
    lineHeight: responsiveFontSize.caption * 1.5,
    marginLeft: responsiveSpacing.sm,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSpacing.md,
    paddingHorizontal: responsiveSpacing.lg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.feedback.error,
    backgroundColor: colors.neutral.white,
  },
  cancelText: {
    fontSize: responsiveFontSize.body,
    color: colors.feedback.error,
    fontWeight: '600',
    marginLeft: responsiveSpacing.xs,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSpacing.md,
    paddingHorizontal: responsiveSpacing.lg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.white,
  },
  shareText: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textPrimary,
    fontWeight: '600',
    marginLeft: responsiveSpacing.xs,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSpacing.sm,
  },
  textButtonText: {
    color: colors.neutral.textSecondary,
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    marginLeft: 6,
  },
  contactEmployeeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.highlight.teal,
    borderRadius: 12,
    paddingVertical: responsiveSpacing.md,
    paddingHorizontal: responsiveSpacing.lg,
    marginTop: responsiveSpacing.md,
    shadowColor: colors.highlight.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  contactEmployeeText: {
    color: colors.neutral.white,
    fontSize: responsiveFontSize.body,
    fontWeight: '700',
    marginLeft: responsiveSpacing.sm,
    marginRight: responsiveSpacing.sm,
  },
  imageCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: responsiveSpacing.lg,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  imageCardTitle: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.md,
  },
  imageScrollContainer: {
    paddingRight: responsiveSpacing.md,
  },
  bookingImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: colors.neutral.border,
    marginRight: responsiveSpacing.sm,
  },
  sectionTitle: {
    fontSize: responsiveFontSize.body,
    fontWeight: '700',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.md,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: responsiveSpacing.xs,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.highlight.teal + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveSpacing.md,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsiveSpacing.xs,
  },
  employeeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: responsiveSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: 2,
  },
  employeePhone: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginBottom: 2,
  },
  employeeRating: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
  },
  chatIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.highlight.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.highlight.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  // Payment Summary Styles
  paymentSummarySection: {
    marginBottom: 8,
  },
  paymentSummaryLabel: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '600',
    color: colors.neutral.textSecondary,
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  paymentSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
    paddingLeft: 16,
  },
  paymentItemName: {
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
    flex: 1,
  },
  paymentItemAmount: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
  },
  paymentSubItemName: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    flex: 1,
  },
  paymentSubItemAmount: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
  },
  percentBadge: {
    fontSize: 10,
    color: colors.neutral.textSecondary,
    marginLeft: 4,
  },
  systemBadge: {
    backgroundColor: colors.highlight.teal + '20',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  systemBadgeText: {
    fontSize: 10,
    color: colors.highlight.teal,
    fontWeight: '500',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.highlight.teal + '10',
    borderRadius: 12,
    padding: 12,
  },
  grandTotalLabel: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  grandTotalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.feedback.success,
  },
  cashPaymentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.feedback.warning + '15',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  cashPaymentNoteText: {
    fontSize: responsiveFontSize.caption,
    color: colors.feedback.warning,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
});
