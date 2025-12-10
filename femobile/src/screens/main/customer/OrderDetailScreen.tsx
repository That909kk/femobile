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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, responsive, responsiveSpacing, responsiveFontSize } from '../../../styles';
import { bookingService, reviewService } from '../../../services';
import { ReviewModal, RebookModal } from '../../../components';
import type { BookingStatus } from '../../../types/booking';

interface RouteParams {
  bookingId: string;
}

interface OrderDetail {
  bookingId: string;
  bookingCode: string;
  serviceName: string;
  status: BookingStatus;
  date: string;
  time: string;
  employeeName?: string;
  employeePhone?: string;
  employeeAvatar?: string;
  price: string;
  totalAmount: number;
  address: string;
  fullAddress?: string;
  ward?: string;
  district?: string;
  city?: string;
  rating?: number;
  notes?: string;
  estimatedCompletion?: string;
  cancelReason?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentAmount?: number;
  transactionCode?: string;
  promotionCode?: string;
  promotionDescription?: string;
  discountAmount?: number;
  createdAt?: string;
  employeeId?: string;
}

export const OrderDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId } = route.params as RouteParams;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Rebook modal state
  const [showRebookModal, setShowRebookModal] = useState(false);

  useEffect(() => {
    loadOrderDetail();
  }, [bookingId]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      
      // Call API to get booking detail
      const response = await bookingService.getBookingById(bookingId);
      
      // Transform API response to OrderDetail
      const bookingDate = response.bookingTime ? new Date(response.bookingTime) : null;
      
      // Handle both old and new API response structures
      const bookingDetails = (response as any).bookingDetails || response.serviceDetails;
      const primaryService = bookingDetails?.[0];
      
      // Get employee from assignments or assignedEmployees
      const primaryAssignment = primaryService?.assignments?.[0];
      const primaryEmployee = primaryAssignment?.employee || response.assignedEmployees?.[0];
      
      // Handle address - API returns 'address' field
      const addressInfo = (response as any).address || response.customerInfo;
      const fullAddress = addressInfo?.fullAddress || '';
      
      // Handle payment - API returns 'payment' field
      const paymentInfo = (response as any).payment || response.paymentInfo;
      
      // Handle promotion - API returns 'promotion' field  
      const promotionInfo = (response as any).promotion || response.promotionApplied;
      
      const orderDetail: OrderDetail = {
        bookingId: response.bookingId,
        bookingCode: response.bookingCode,
        serviceName: primaryService?.service?.name || 'Dịch vụ gia đình',
        status: (response.status as BookingStatus) || 'PENDING',
        date: bookingDate ? bookingDate.toLocaleDateString('vi-VN') : 'Không rõ ngày',
        time: bookingDate
          ? bookingDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          : '',
        employeeName: primaryEmployee?.fullName,
        employeePhone: primaryEmployee?.phoneNumber,
        employeeAvatar: primaryEmployee?.avatar,
        price: response.formattedTotalAmount || `${new Intl.NumberFormat('vi-VN').format(response.totalAmount || 0)}đ`,
        totalAmount: response.totalAmount || 0,
        address: fullAddress || 'Chưa cập nhật địa chỉ',
        fullAddress: fullAddress,
        ward: addressInfo?.ward,
        district: addressInfo?.district,
        city: addressInfo?.city,
        notes: (response as any).note,
        estimatedCompletion: response.estimatedDuration || primaryService?.formattedDuration,
        cancelReason: (response as any).cancelReason,
        paymentStatus: paymentInfo?.paymentStatus,
        paymentMethod: typeof paymentInfo?.paymentMethod === 'string'
          ? paymentInfo.paymentMethod
          : paymentInfo?.paymentMethod?.methodName,
        paymentAmount: paymentInfo?.amount,
        transactionCode: paymentInfo?.transactionCode || undefined,
        promotionCode: promotionInfo?.promoCode,
        promotionDescription: promotionInfo?.description,
        discountAmount: promotionInfo?.discountValue,
        createdAt: response.createdAt,
        employeeId: primaryEmployee?.employeeId,
      };
      
      setOrder(orderDetail);
    } catch (error) {
      console.error('Error loading order detail:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết đơn hàng');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
      case 'AWAITING_EMPLOYEE':
        return colors.feedback.warning;
      case 'CONFIRMED':
        return colors.highlight.teal;
      case 'IN_PROGRESS':
        return colors.primary.navy;
      case 'COMPLETED':
        return colors.feedback.success;
      case 'CANCELLED':
        return colors.feedback.error;
      default:
        return colors.neutral.label;
    }
  };

  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ xác nhận';
      case 'AWAITING_EMPLOYEE':
        return 'Đang tìm nhân viên';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'IN_PROGRESS':
        return 'Đang thực hiện';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
      case 'AWAITING_EMPLOYEE':
        return 'time-outline';
      case 'CONFIRMED':
        return 'checkmark-circle-outline';
      case 'IN_PROGRESS':
        return 'play-circle';
      case 'COMPLETED':
        return 'checkmark-circle';
      case 'CANCELLED':
        return 'close-circle';
      default:
        return 'ellipse-outline';
    }
  };

  const handleCallEmployee = (phoneNumber: string) => {
    Alert.alert('Thông báo', 'Tính năng đang được phát triển');
  };

  const handleMessageEmployee = () => {
    Alert.alert('Thông báo', 'Tính năng đang được phát triển');
  };

  const handleCancelOrder = () => {
    if (!order) return;

    // Check if booking can be cancelled
    const cancellableStatuses: BookingStatus[] = ['PENDING', 'AWAITING_EMPLOYEE'];
    
    if (!cancellableStatuses.includes(order.status)) {
      Alert.alert('Không thể hủy', 'Chỉ có thể hủy đơn hàng ở trạng thái Chờ xác nhận hoặc Đang tìm nhân viên');
      return;
    }

    Alert.alert(
      'Hủy đơn hàng',
      'Bạn có chắc chắn muốn hủy đơn hàng này? Nếu đã thanh toán, số tiền sẽ được hoàn lại.',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await bookingService.cancelBooking(order.bookingId, 'Khách hàng hủy đơn hàng');
              Alert.alert('Thành công', 'Đơn hàng đã được hủy thành công', [
                { 
                  text: 'OK', 
                  onPress: () => {
                    navigation.goBack();
                  }
                }
              ]);
            } catch (error: any) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Lỗi', error.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.');
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  const handleRateOrder = () => {
    if (!order?.employeeId) {
      Alert.alert('Thông báo', 'Đơn hàng này chưa có nhân viên được phân công để đánh giá');
      return;
    }
    setShowReviewModal(true);
  };

  // Handle submitting review
  const handleSubmitReview = async (
    ratings: Array<{ criterionId: number; score: number }>,
    comment: string
  ) => {
    if (!order?.bookingId || !order?.employeeId) {
      throw new Error('Thông tin đánh giá không hợp lệ');
    }

    await reviewService.createReview({
      bookingId: order.bookingId,
      employeeId: order.employeeId,
      ratings,
      comment,
    });

    Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá dịch vụ!');
    setShowReviewModal(false);
    loadOrderDetail(); // Refresh order detail
  };

  const handleRebookOrder = () => {
    setShowRebookModal(true);
  };

  // Handle rebook - create new booking based on completed order
  const handleRebook = async (dateTime: string) => {
    if (!order) {
      throw new Error('Không tìm thấy thông tin đơn hàng');
    }

    // Get full booking details for rebooking
    const bookingDetails = await bookingService.getBookingById(order.bookingId);
    
    if (!bookingDetails) {
      throw new Error('Không thể lấy chi tiết đơn hàng');
    }

    // Prepare new booking data based on original booking
    const newBookingData = {
      addressId: (bookingDetails as any).address?.addressId,
      bookingTime: dateTime,
      note: (bookingDetails as any).note || '',
      paymentMethodId: (bookingDetails as any).payment?.paymentMethodId || 1,
      bookingDetails: ((bookingDetails as any).bookingDetails || []).map((detail: any) => ({
        serviceId: detail.service?.serviceId || detail.serviceId,
        quantity: detail.quantity || 1,
        selectedChoices: (detail.selectedChoices || []).map((c: any) => c.choiceId || c),
      })),
    };

    await bookingService.createBooking(newBookingData as any);
    
    Alert.alert(
      'Đặt lại thành công!',
      'Đơn hàng mới đã được tạo. Bạn có thể xem trong danh sách đơn hàng.',
      [
        {
          text: 'OK',
          onPress: () => {
            setShowRebookModal(false);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={responsive.moderateScale(24)} color={colors.primary.navy} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.highlight.teal} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={responsive.moderateScale(24)} color={colors.primary.navy} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={responsive.moderateScale(64)} color={colors.neutral.label} />
          <Text style={styles.emptyText}>Không tìm thấy đơn hàng</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={responsive.moderateScale(24)} color={colors.primary.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIconContainer, { backgroundColor: getStatusColor(order.status) + '15' }]}>
            <Ionicons
              name={getStatusIcon(order.status) as any}
              size={responsive.moderateScale(32)}
              color={getStatusColor(order.status)}
            />
          </View>
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {getStatusText(order.status)}
          </Text>
          {order.bookingCode && (
            <Text style={styles.bookingCode}>{order.bookingCode}</Text>
          )}
        </View>

        {/* Service Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin dịch vụ</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="construct-outline" size={responsive.moderateScale(20)} color={colors.highlight.teal} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Dịch vụ</Text>
                <Text style={styles.infoValue}>{order.serviceName}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar-outline" size={responsive.moderateScale(20)} color={colors.highlight.teal} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Thời gian</Text>
                <Text style={styles.infoValue}>{order.date} lúc {order.time}</Text>
              </View>
            </View>

            {order.estimatedCompletion && (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="time-outline" size={responsive.moderateScale(20)} color={colors.highlight.teal} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Thời gian dự kiến</Text>
                  <Text style={styles.infoValue}>{order.estimatedCompletion}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="location-outline" size={responsive.moderateScale(20)} color={colors.highlight.teal} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoValue}>{order.address}</Text>
              </View>
            </View>

            {order.notes && (
              <View style={styles.noteContainer}>
                <Ionicons name="document-text-outline" size={responsive.moderateScale(18)} color={colors.neutral.label} />
                <Text style={styles.noteText}>{order.notes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Employee Info */}
        {order.employeeName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nhân viên thực hiện</Text>
            <View style={styles.card}>
              <View style={styles.employeeRow}>
                <View style={styles.employeeInfo}>
                  {order.employeeAvatar ? (
                    <Image
                      source={{ uri: order.employeeAvatar }}
                      style={styles.employeeAvatar}
                    />
                  ) : (
                    <View style={[styles.employeeAvatar, styles.employeeAvatarPlaceholder]}>
                      <Ionicons name="person" size={responsive.moderateScale(24)} color={colors.neutral.label} />
                    </View>
                  )}
                  <View style={styles.employeeDetails}>
                    <Text style={styles.employeeName}>{order.employeeName}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.messageButton}
                  onPress={handleMessageEmployee}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbubble-outline" size={responsive.moderateScale(20)} color={colors.neutral.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
          <View style={styles.card}>
            {order.promotionCode && (
              <View style={styles.promotionRow}>
                <Ionicons name="pricetag" size={responsive.moderateScale(18)} color={colors.feedback.success} />
                <View style={styles.promotionInfo}>
                  <Text style={styles.promotionCode}>{order.promotionCode}</Text>
                  {order.promotionDescription && (
                    <Text style={styles.promotionDesc}>{order.promotionDescription}</Text>
                  )}
                </View>
                {order.discountAmount && (
                  <Text style={styles.discountAmount}>-{new Intl.NumberFormat('vi-VN').format(order.discountAmount)}đ</Text>
                )}
              </View>
            )}

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Tổng tiền</Text>
                {order.paymentStatus && (
                  <View style={[
                    styles.paymentStatusBadge,
                    { backgroundColor: order.paymentStatus === 'PAID' ? colors.feedback.success + '15' : colors.feedback.warning + '15' }
                  ]}>
                    <Text style={[
                      styles.paymentStatusText,
                      { color: order.paymentStatus === 'PAID' ? colors.feedback.success : colors.feedback.warning }
                    ]}>
                      {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.totalAmount}>{order.price}</Text>
            </View>

            {order.paymentMethod && (
              <View style={styles.paymentMethodRow}>
                <Ionicons name="card-outline" size={responsive.moderateScale(18)} color={colors.neutral.label} />
                <Text style={styles.paymentMethodText}>{order.paymentMethod}</Text>
              </View>
            )}

            {order.transactionCode && (
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Mã giao dịch:</Text>
                <Text style={styles.transactionCode}>{order.transactionCode}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Cancel Reason */}
        {order.cancelReason && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lý do hủy</Text>
            <View style={[styles.card, styles.cancelCard]}>
              <Ionicons name="information-circle" size={responsive.moderateScale(20)} color={colors.feedback.error} />
              <Text style={styles.cancelReason}>{order.cancelReason}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {(order.status === 'PENDING' || order.status === 'AWAITING_EMPLOYEE') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelOrder}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={responsive.moderateScale(20)} color={colors.feedback.error} />
              <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
            </TouchableOpacity>
          )}

          {order.status === 'COMPLETED' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleRateOrder}
                activeOpacity={0.8}
              >
                <Ionicons name="star" size={responsive.moderateScale(20)} color={colors.neutral.white} />
                <Text style={styles.primaryButtonText}>Đánh giá dịch vụ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rebookButton]}
                onPress={handleRebookOrder}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={responsive.moderateScale(20)} color={colors.highlight.teal} />
                <Text style={styles.rebookButtonText}>Đặt lại dịch vụ</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Review Modal */}
      <ReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        employeeName={order?.employeeName}
        bookingCode={order?.bookingCode}
      />

      {/* Rebook Modal */}
      <RebookModal
        visible={showRebookModal}
        onClose={() => setShowRebookModal(false)}
        onConfirm={handleRebook}
        originalDate={order?.date}
        originalTime={order?.time}
        serviceName={order?.serviceName}
        bookingCode={order?.bookingCode}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveSpacing.lg,
    paddingVertical: responsiveSpacing.md,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  backButton: {
    width: responsive.moderateScale(40),
    height: responsive.moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.primary.navy,
  },

  // Loading & Empty
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: responsiveSpacing.md,
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.xl,
  },
  emptyText: {
    marginTop: responsiveSpacing.md,
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsiveSpacing.lg,
    paddingTop: responsiveSpacing.lg,
    paddingBottom: 0,
  },

  // Status Card
  statusCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(16),
    padding: responsiveSpacing.xl,
    alignItems: 'center',
    marginBottom: responsiveSpacing.lg,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statusIconContainer: {
    width: responsive.moderateScale(64),
    height: responsive.moderateScale(64),
    borderRadius: responsive.moderateScale(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing.md,
  },
  statusText: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    marginBottom: responsiveSpacing.xs,
  },
  bookingCode: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.label,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Section
  section: {
    marginBottom: responsiveSpacing.lg,
  },
  sectionTitle: {
    fontSize: responsiveFontSize.bodyLarge,
    fontWeight: '700',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.md,
  },

  // Card
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(16),
    padding: responsiveSpacing.lg,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveSpacing.md,
  },
  iconContainer: {
    width: responsive.moderateScale(40),
    height: responsive.moderateScale(40),
    borderRadius: responsive.moderateScale(20),
    backgroundColor: colors.warm.beige,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSpacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
    marginBottom: responsiveSpacing.xs / 2,
  },
  infoValue: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textPrimary,
    fontWeight: '500',
    lineHeight: responsiveFontSize.body * 1.4,
  },

  // Note
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutral.background,
    padding: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(12),
    gap: responsiveSpacing.sm,
    marginTop: responsiveSpacing.xs,
  },
  noteText: {
    flex: 1,
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    lineHeight: responsiveFontSize.body * 1.4,
  },

  // Employee
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  employeeAvatar: {
    width: responsive.moderateScale(60),
    height: responsive.moderateScale(60),
    borderRadius: responsive.moderateScale(30),
    marginRight: responsiveSpacing.md,
  },
  employeeAvatarPlaceholder: {
    backgroundColor: colors.warm.beige,
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: responsiveFontSize.bodyLarge,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.xs / 2,
  },
  employeePhone: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
  },
  messageButton: {
    width: responsive.moderateScale(48),
    height: responsive.moderateScale(48),
    borderRadius: responsive.moderateScale(24),
    backgroundColor: colors.highlight.teal,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.highlight.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  // Promotion
  promotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.feedback.success + '10',
    padding: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(12),
    marginBottom: responsiveSpacing.md,
    gap: responsiveSpacing.sm,
  },
  promotionInfo: {
    flex: 1,
  },
  promotionCode: {
    fontSize: responsiveFontSize.body,
    fontWeight: '700',
    color: colors.feedback.success,
    marginBottom: responsiveSpacing.xs / 2,
  },
  promotionDesc: {
    fontSize: responsiveFontSize.caption,
    color: colors.feedback.success,
  },
  discountAmount: {
    fontSize: responsiveFontSize.body,
    fontWeight: '700',
    color: colors.feedback.success,
  },

  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: responsiveSpacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  totalLabel: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    marginBottom: responsiveSpacing.xs,
  },
  totalAmount: {
    fontSize: responsiveFontSize.heading1,
    fontWeight: '700',
    color: colors.highlight.teal,
  },
  paymentStatusBadge: {
    paddingHorizontal: responsiveSpacing.sm,
    paddingVertical: responsiveSpacing.xs / 2,
    borderRadius: responsive.moderateScale(8),
    alignSelf: 'flex-start',
  },
  paymentStatusText: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '600',
  },

  // Payment Method
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsiveSpacing.sm,
    gap: responsiveSpacing.sm,
  },
  paymentMethodText: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
  },

  // Transaction
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsiveSpacing.xs,
    gap: responsiveSpacing.sm,
  },
  transactionLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
  },
  transactionCode: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textPrimary,
    fontWeight: '600',
  },

  // Cancel Card
  cancelCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.feedback.error + '10',
    gap: responsiveSpacing.sm,
  },
  cancelReason: {
    flex: 1,
    fontSize: responsiveFontSize.body,
    color: colors.feedback.error,
    fontWeight: '500',
    lineHeight: responsiveFontSize.body * 1.4,
  },

  // Actions
  actionsSection: {
    marginTop: responsiveSpacing.md,
    gap: responsiveSpacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(12),
    gap: responsiveSpacing.sm,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: colors.highlight.teal,
  },
  primaryButtonText: {
    fontSize: responsiveFontSize.bodyLarge,
    fontWeight: '700',
    color: colors.neutral.white,
  },
  cancelButton: {
    backgroundColor: colors.neutral.white,
    borderWidth: 1.5,
    borderColor: colors.feedback.error,
  },
  cancelButtonText: {
    fontSize: responsiveFontSize.bodyLarge,
    fontWeight: '700',
    color: colors.feedback.error,
  },
  rebookButton: {
    backgroundColor: colors.highlight.teal + '15',
    borderWidth: 1.5,
    borderColor: colors.highlight.teal,
  },
  rebookButtonText: {
    fontSize: responsiveFontSize.bodyLarge,
    fontWeight: '700',
    color: colors.highlight.teal,
  },
});
