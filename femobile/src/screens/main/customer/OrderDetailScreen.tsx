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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, responsive, responsiveSpacing, responsiveFontSize } from '../../../styles';
import { bookingService, reviewService } from '../../../services';
import { ReviewModal, RebookModal } from '../../../components';
import type { BookingStatus, BookingResponse, BookingServiceDetail, BookingEmployee } from '../../../types/booking';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RouteParams {
  bookingId: string;
}

interface FeeItem {
  name: string;
  type: string;
  value: number;
  amount: number;
  systemSurcharge?: boolean;
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
  paidAt?: string;
  promotionCode?: string;
  promotionDescription?: string;
  discountAmount?: number;
  discountType?: string;
  createdAt?: string;
  employeeId?: string;
  // Extended data for full display like web
  bookingDetails?: BookingServiceDetail[];
  assignedEmployees?: BookingEmployee[];
  imageUrls?: string[];
  title?: string;
  baseAmount?: number;
  fees?: FeeItem[];
  totalFees?: number;
  adminComment?: string;
  isVerified?: boolean;
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
      
      // Debug: Log response để xem có fees không
      console.log('[OrderDetail] API Response:', JSON.stringify({
        bookingId: response.bookingId,
        baseAmount: response.baseAmount,
        fees: response.fees,
        totalFees: response.totalFees,
        totalAmount: response.totalAmount,
      }, null, 2));
      
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
        paidAt: paymentInfo?.paidAt || undefined,
        promotionCode: promotionInfo?.promoCode,
        promotionDescription: promotionInfo?.description,
        discountAmount: promotionInfo?.discountValue,
        discountType: promotionInfo?.discountType,
        createdAt: response.createdAt,
        employeeId: primaryEmployee?.employeeId,
        // Extended data for full display like web
        bookingDetails: bookingDetails || [],
        assignedEmployees: response.assignedEmployees || [],
        imageUrls: (response as any).imageUrls || ((response as any).imageUrl ? [(response as any).imageUrl] : []),
        title: (response as any).title,
        baseAmount: (response as any).baseAmount,
        fees: (response as any).fees || [],
        totalFees: (response as any).totalFees,
        adminComment: (response as any).adminComment,
        isVerified: (response as any).isVerified,
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

        {/* Title (Booking Post) */}
        {order.title && (
          <View style={styles.section}>
            <View style={styles.titleCard}>
              <Ionicons name="document-text" size={responsive.moderateScale(20)} color={colors.highlight.teal} />
              <Text style={styles.titleText}>{order.title}</Text>
              {order.isVerified !== undefined && (
                <View style={[styles.verifiedBadge, { backgroundColor: order.isVerified ? colors.feedback.success + '20' : colors.feedback.warning + '20' }]}>
                  <Ionicons 
                    name={order.isVerified ? "checkmark-circle" : "time"} 
                    size={14} 
                    color={order.isVerified ? colors.feedback.success : colors.feedback.warning} 
                  />
                  <Text style={[styles.verifiedText, { color: order.isVerified ? colors.feedback.success : colors.feedback.warning }]}>
                    {order.isVerified ? 'Đã xác minh' : 'Chờ xác minh'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Booking Images */}
        {order.imageUrls && order.imageUrls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hình ảnh đính kèm</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.imagesScrollView}
              contentContainerStyle={styles.imagesContainer}
            >
              {order.imageUrls.map((imageUrl, index) => (
                <Image
                  key={index}
                  source={{ uri: imageUrl }}
                  style={styles.bookingImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          <View style={styles.card}>
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

            {order.adminComment && (
              <View style={[styles.noteContainer, { backgroundColor: colors.highlight.teal + '10' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={responsive.moderateScale(18)} color={colors.highlight.teal} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLabel, { marginBottom: 4 }]}>Phản hồi từ Admin</Text>
                  <Text style={[styles.noteText, { color: colors.highlight.teal }]}>{order.adminComment}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Booking Details - Chi tiết dịch vụ */}
        {order.bookingDetails && order.bookingDetails.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chi tiết đơn đặt ({order.bookingDetails.length} dịch vụ)</Text>
            {order.bookingDetails.map((detail, index) => (
              <View key={detail.bookingDetailId || index} style={[styles.serviceDetailCard, index > 0 && { marginTop: responsiveSpacing.md }]}>
                <View style={styles.serviceDetailHeader}>
                  {detail.service?.iconUrl && (
                    <Image
                      source={{ uri: detail.service.iconUrl }}
                      style={styles.serviceIcon}
                      resizeMode="contain"
                    />
                  )}
                  <View style={styles.serviceDetailInfo}>
                    <Text style={styles.serviceDetailName}>{detail.service?.name || 'Dịch vụ'}</Text>
                    {detail.service?.categoryName && (
                      <Text style={styles.serviceDetailCategory}>{detail.service.categoryName}</Text>
                    )}
                  </View>
                  <Text style={styles.serviceDetailPrice}>
                    {detail.formattedSubTotal || `${new Intl.NumberFormat('vi-VN').format(detail.subTotal || 0)}đ`}
                  </Text>
                </View>

                <View style={styles.serviceDetailMeta}>
                  <View style={styles.serviceMetaItem}>
                    <Text style={styles.serviceMetaLabel}>Số lượng:</Text>
                    <Text style={styles.serviceMetaValue}>{detail.quantity} {detail.service?.unit || 'Gói'}</Text>
                  </View>
                  <View style={styles.serviceMetaItem}>
                    <Text style={styles.serviceMetaLabel}>Đơn giá:</Text>
                    <Text style={styles.serviceMetaValue}>
                      {detail.formattedPricePerUnit || `${new Intl.NumberFormat('vi-VN').format(detail.pricePerUnit || 0)}đ`}
                    </Text>
                  </View>
                  {detail.formattedDuration && (
                    <View style={styles.serviceMetaItem}>
                      <Text style={styles.serviceMetaLabel}>Thời gian:</Text>
                      <Text style={styles.serviceMetaValue}>{detail.formattedDuration}</Text>
                    </View>
                  )}
                </View>

                {/* Selected Choices */}
                {detail.selectedChoices && detail.selectedChoices.length > 0 && (
                  <View style={styles.selectedChoicesContainer}>
                    {detail.selectedChoices.map((choice, choiceIdx) => (
                      <View key={choice.choiceId || choiceIdx} style={styles.choiceBadge}>
                        <Text style={styles.choiceText}>{choice.choiceName}</Text>
                        {choice.priceAdjustment > 0 && (
                          <Text style={styles.choicePrice}>
                            +{choice.formattedPriceAdjustment || `${new Intl.NumberFormat('vi-VN').format(choice.priceAdjustment)}đ`}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Assignments for this service */}
                {detail.assignments && detail.assignments.length > 0 && (
                  <View style={styles.assignmentsContainer}>
                    <Text style={styles.assignmentTitle}>Nhân viên thực hiện:</Text>
                    {detail.assignments.map((assignment) => (
                      <View key={assignment.assignmentId} style={styles.assignmentRow}>
                        {assignment.employee?.avatar ? (
                          <Image
                            source={{ uri: assignment.employee.avatar }}
                            style={styles.assignmentAvatar}
                          />
                        ) : (
                          <View style={[styles.assignmentAvatar, styles.assignmentAvatarPlaceholder]}>
                            <Text style={styles.assignmentAvatarText}>
                              {assignment.employee?.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                          </View>
                        )}
                        <View style={styles.assignmentInfo}>
                          <Text style={styles.assignmentName}>{assignment.employee?.fullName}</Text>
                          <View style={styles.assignmentMeta}>
                            <View style={[styles.assignmentStatusBadge, { 
                              backgroundColor: assignment.status === 'COMPLETED' ? colors.feedback.success + '20' 
                                : assignment.status === 'IN_PROGRESS' ? colors.feedback.warning + '20' 
                                : colors.neutral.border 
                            }]}>
                              <Text style={[styles.assignmentStatusText, { 
                                color: assignment.status === 'COMPLETED' ? colors.feedback.success 
                                  : assignment.status === 'IN_PROGRESS' ? colors.feedback.warning 
                                  : colors.neutral.textSecondary 
                              }]}>
                                {assignment.status === 'COMPLETED' ? 'Hoàn thành' 
                                  : assignment.status === 'IN_PROGRESS' ? 'Đang làm' 
                                  : assignment.status}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Employee Info - Fallback when no booking details */}
        {(!order.bookingDetails || order.bookingDetails.length === 0) && order.employeeName && (
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

        {/* Fee Breakdown - Chi tiết chi phí */}
        {(order.baseAmount || (order.fees && order.fees.length > 0)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chi tiết chi phí</Text>
            <View style={[styles.card, styles.feeBreakdownCard]}>
              {/* Base Amount */}
              {order.baseAmount !== undefined && (
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Phí dịch vụ cơ bản</Text>
                  <Text style={styles.feeValue}>{new Intl.NumberFormat('vi-VN').format(order.baseAmount)}đ</Text>
                </View>
              )}

              {/* Individual Fees */}
              {order.fees && order.fees.length > 0 && (
                <>
                  <View style={styles.feeDivider} />
                  {order.fees.map((fee, index) => (
                    <View key={index} style={styles.feeRow}>
                      <View style={styles.feeLabelContainer}>
                        <Text style={styles.feeLabel}>{fee.name}</Text>
                        {fee.systemSurcharge && (
                          <View style={styles.systemFeeBadge}>
                            <Text style={styles.systemFeeText}>Hệ thống</Text>
                          </View>
                        )}
                        {fee.type === 'PERCENT' && (
                          <Text style={styles.feePercent}>({(fee.value * 100).toFixed(0)}%)</Text>
                        )}
                      </View>
                      <Text style={styles.feeValueAdd}>+{new Intl.NumberFormat('vi-VN').format(fee.amount)}đ</Text>
                    </View>
                  ))}
                </>
              )}

              {/* Total Fees */}
              {order.totalFees !== undefined && order.totalFees > 0 && (
                <>
                  <View style={styles.feeDivider} />
                  <View style={styles.feeRow}>
                    <Text style={[styles.feeLabel, { fontWeight: '600' }]}>Tổng phụ phí</Text>
                    <Text style={styles.feeValueAdd}>+{new Intl.NumberFormat('vi-VN').format(order.totalFees)}đ</Text>
                  </View>
                </>
              )}

              {/* Promotion Discount */}
              {order.promotionCode && order.discountAmount && (
                <View style={[styles.feeRow, { marginTop: responsiveSpacing.sm }]}>
                  <View style={styles.feeLabelContainer}>
                    <Ionicons name="pricetag" size={14} color={colors.feedback.success} />
                    <Text style={[styles.feeLabel, { color: colors.feedback.success, marginLeft: 4 }]}>
                      {order.promotionCode}
                    </Text>
                  </View>
                  <Text style={[styles.feeValue, { color: colors.feedback.success }]}>
                    -{order.discountType === 'FIXED_AMOUNT' 
                      ? new Intl.NumberFormat('vi-VN').format(order.discountAmount)
                      : new Intl.NumberFormat('vi-VN').format(order.discountAmount)
                    }đ
                  </Text>
                </View>
              )}

              {/* Final Total */}
              <View style={[styles.feeDivider, { borderTopWidth: 2 }]} />
              <View style={styles.feeRow}>
                <Text style={styles.totalFeeLabel}>Thành tiền</Text>
                <Text style={styles.totalFeeValue}>{order.price}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
          <View style={styles.card}>
            {order.promotionCode && !order.baseAmount && (
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

            {order.paidAt && (
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Thanh toán lúc:</Text>
                <Text style={styles.transactionCode}>{new Date(order.paidAt).toLocaleString('vi-VN')}</Text>
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

  // Title Card (Booking Post)
  titleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(16),
    padding: responsiveSpacing.lg,
    gap: responsiveSpacing.sm,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  titleText: {
    flex: 1,
    fontSize: responsiveFontSize.bodyLarge,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.sm,
    paddingVertical: responsiveSpacing.xs / 2,
    borderRadius: responsive.moderateScale(8),
    gap: 4,
  },
  verifiedText: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '600',
  },

  // Booking Images
  imagesScrollView: {
    marginHorizontal: -responsiveSpacing.lg,
  },
  imagesContainer: {
    paddingHorizontal: responsiveSpacing.lg,
    gap: responsiveSpacing.sm,
  },
  bookingImage: {
    width: SCREEN_WIDTH * 0.7,
    height: responsive.moderateScale(200),
    borderRadius: responsive.moderateScale(12),
    backgroundColor: colors.neutral.border,
  },

  // Service Detail Card
  serviceDetailCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(16),
    padding: responsiveSpacing.lg,
    borderWidth: 1,
    borderColor: colors.highlight.teal + '30',
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  serviceDetailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  serviceIcon: {
    width: responsive.moderateScale(48),
    height: responsive.moderateScale(48),
    borderRadius: responsive.moderateScale(8),
    marginRight: responsiveSpacing.md,
    backgroundColor: colors.warm.beige,
  },
  serviceDetailInfo: {
    flex: 1,
  },
  serviceDetailName: {
    fontSize: responsiveFontSize.bodyLarge,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: 2,
  },
  serviceDetailCategory: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
  },
  serviceDetailPrice: {
    fontSize: responsiveFontSize.bodyLarge,
    fontWeight: '700',
    color: colors.highlight.teal,
  },
  serviceDetailMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: responsiveSpacing.md,
    gap: responsiveSpacing.md,
  },
  serviceMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceMetaLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
  },
  serviceMetaValue: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '600',
    color: colors.neutral.textPrimary,
  },

  // Selected Choices
  selectedChoicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: responsiveSpacing.md,
    gap: responsiveSpacing.xs,
  },
  choiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight.teal + '15',
    paddingHorizontal: responsiveSpacing.sm,
    paddingVertical: responsiveSpacing.xs / 2,
    borderRadius: responsive.moderateScale(20),
    gap: 4,
  },
  choiceText: {
    fontSize: responsiveFontSize.caption,
    color: colors.highlight.teal,
    fontWeight: '500',
  },
  choicePrice: {
    fontSize: responsiveFontSize.caption,
    color: colors.highlight.teal,
    fontWeight: '600',
  },

  // Assignments
  assignmentsContainer: {
    marginTop: responsiveSpacing.md,
    paddingTop: responsiveSpacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  assignmentTitle: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '600',
    color: colors.highlight.teal,
    marginBottom: responsiveSpacing.sm,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSpacing.sm,
  },
  assignmentAvatar: {
    width: responsive.moderateScale(32),
    height: responsive.moderateScale(32),
    borderRadius: responsive.moderateScale(16),
    marginRight: responsiveSpacing.sm,
  },
  assignmentAvatarPlaceholder: {
    backgroundColor: colors.highlight.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignmentAvatarText: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '700',
    color: colors.neutral.white,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentName: {
    fontSize: responsiveFontSize.body,
    fontWeight: '500',
    color: colors.neutral.textPrimary,
  },
  assignmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: responsiveSpacing.sm,
  },
  assignmentStatusBadge: {
    paddingHorizontal: responsiveSpacing.sm,
    paddingVertical: 2,
    borderRadius: responsive.moderateScale(4),
  },
  assignmentStatusText: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '500',
  },

  // Fee Breakdown
  feeBreakdownCard: {
    backgroundColor: colors.warm.beige + '40',
    borderWidth: 1,
    borderColor: colors.warm.beige,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveSpacing.sm,
  },
  feeLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  feeLabel: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
  },
  feePercent: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
  },
  feeValue: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.neutral.textPrimary,
  },
  feeValueAdd: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.feedback.warning,
  },
  systemFeeBadge: {
    backgroundColor: colors.feedback.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  systemFeeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.feedback.warning,
  },
  feeDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    borderStyle: 'dashed',
    marginVertical: responsiveSpacing.sm,
  },
  totalFeeLabel: {
    fontSize: responsiveFontSize.bodyLarge,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  totalFeeValue: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.highlight.teal,
  },
});
