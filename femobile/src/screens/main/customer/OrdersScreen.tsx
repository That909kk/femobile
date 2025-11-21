import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../../../components';
import { useAuth, useEnsureValidToken, useUserInfo } from '../../../hooks';
import { bookingService } from '../../../services';
import { colors, responsive, responsiveSpacing, responsiveFontSize } from '../../../styles';
import type { BookingStatus } from '../../../types/booking';

interface Order {
  id: string;
  bookingId: string;
  bookingCode?: string;
  serviceName: string;
  status: BookingStatus;
  date: string;
  time: string;
  employeeName?: string;
  employeePhone?: string;
  employeeAvatar?: string;
  price: string;
  address: string;
  fullAddress?: string;
  rating?: number;
  notes?: string;
  estimatedCompletion?: string;
  cancelReason?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  promotionCode?: string;
  promotionDescription?: string;
}

type FilterTab = 'all' | 'upcoming' | 'inProgress' | 'completed' | 'cancelled';

export const OrdersScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { userInfo } = useUserInfo();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('all');
  
  // Ensure token is valid when component mounts
  useEnsureValidToken();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const customerId =
        userInfo?.id || (user && 'customerId' in user ? (user as any).customerId : undefined);

      if (!customerId) {
        console.warn('Khong co ma khach hang trong he thong');
        setOrders([]);
        return;
      }

      const response = await bookingService.getCustomerBookings(customerId, {
        page: 0,
        size: 20,
        sort: 'bookingTime,desc',
      });

      const transformedOrders: Order[] = (response.content || []).map((booking) => {
        const bookingDate = booking.bookingTime ? new Date(booking.bookingTime) : null;
        
        // Try to get service name from various possible locations in API response
        const bookingDetails = (booking as any).bookingDetails || booking.serviceDetails;
        const primaryService = bookingDetails?.[0];
        const serviceName = primaryService?.service?.name || 
                           primaryService?.serviceName ||
                           (booking as any).serviceName || 
                           'Dịch vụ gia đình';
        
        // Get employee from assignments or assignedEmployees
        const primaryAssignment = primaryService?.assignments?.[0];
        const primaryEmployee = primaryAssignment?.employee || booking.assignedEmployees?.[0];

        // Handle address - API returns 'address' field
        const addressInfo = (booking as any).address || booking.customerInfo;
        const fullAddress = addressInfo?.fullAddress || '';
        
        // Handle payment - API returns 'payment' field
        const paymentInfo = (booking as any).payment || booking.paymentInfo;
        
        // Handle promotion - API returns 'promotion' field
        const promotionInfo = (booking as any).promotion || booking.promotionApplied;

        return {
          id: booking.bookingId,
          bookingId: booking.bookingId,
          bookingCode: booking.bookingCode,
          serviceName: serviceName,
          status: (booking.status as BookingStatus) ?? 'PENDING',
          date: bookingDate ? bookingDate.toLocaleDateString('vi-VN') : 'Không rõ ngày',
          time: bookingDate
            ? bookingDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            : '',
          employeeName: primaryEmployee?.fullName,
          employeePhone: primaryEmployee?.phoneNumber,
          employeeAvatar: primaryEmployee?.avatar,
          price: booking.formattedTotalAmount ?? `${new Intl.NumberFormat('vi-VN').format(booking.totalAmount ?? 0)} VND`,
          address: fullAddress || 'Chưa cập nhật địa chỉ',
          fullAddress: fullAddress,
          rating: (booking as any).rating,
          notes: (booking as any).note,
          estimatedCompletion: booking.estimatedDuration || primaryService?.formattedDuration,
          cancelReason: (booking as any).cancelReason,
          paymentStatus: paymentInfo?.paymentStatus,
          paymentMethod: typeof paymentInfo?.paymentMethod === 'string' 
            ? paymentInfo.paymentMethod 
            : paymentInfo?.paymentMethod?.methodName,
          promotionCode: promotionInfo?.promoCode,
          promotionDescription: promotionInfo?.description,
        };
      });

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Loi', 'Khong the tai danh sach don hang. Vui long thu lai.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const FILTER_STATUS_MAP: Record<FilterTab, BookingStatus[]> = {
    all: [],
    upcoming: ['PENDING', 'AWAITING_EMPLOYEE', 'CONFIRMED'],
    inProgress: ['IN_PROGRESS'],
    completed: ['COMPLETED'],
    cancelled: ['CANCELLED'],
  };

  const FILTER_LABELS: Record<FilterTab, string> = {
    all: 'Tất cả',
    upcoming: 'Sắp diễn ra',
    inProgress: 'Đang thực hiện',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  const filterOrder: FilterTab[] = ['all', 'upcoming', 'inProgress', 'completed', 'cancelled'];

  const filterOptions = filterOrder.map((key) => ({
    id: key,
    label: FILTER_LABELS[key],
    count:
      key === 'all'
        ? orders.length
        : orders.filter((order) => FILTER_STATUS_MAP[key].includes(order.status)).length,
  }));

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
      case 'CONFIRMED':
        return 'time-outline';
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

  const filteredOrders =
    selectedFilter === 'all'
      ? orders
      : orders.filter((order) => FILTER_STATUS_MAP[selectedFilter].includes(order.status));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleOrderAction = (orderId: string, action: string) => {
    const order = orders.find(o => o.id === orderId);
    
    switch (action) {
      case 'cancel':
        handleCancelBooking(orderId, order?.status);
        break;
      case 'track':
        Alert.alert('Thông báo', 'Tính năng đang được phát triển');
        break;
      case 'rate':
        Alert.alert('Thông báo', 'Tính năng đang được phát triển');
        break;
      case 'details':
        navigation.navigate('OrderDetail', { bookingId: orderId });
        break;
      default:
        console.log(`${action} order:`, orderId);
    }
  };

  const handleCancelBooking = (bookingId: string, status?: BookingStatus) => {
    // Check if booking can be cancelled (PENDING, AWAITING_EMPLOYEE)
    const cancellableStatuses: BookingStatus[] = ['PENDING', 'AWAITING_EMPLOYEE'];
    
    if (status && !cancellableStatuses.includes(status)) {
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
              await bookingService.cancelBooking(bookingId, 'Khách hàng hủy đơn hàng');
              Alert.alert('Thành công', 'Đơn hàng đã được hủy thành công', [
                { text: 'OK', onPress: () => loadOrders() }
              ]);
            } catch (error: any) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Lỗi', error.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.');
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  const handleCallEmployee = (phoneNumber: string) => {
    Alert.alert('Thông báo', 'Tính năng đang được phát triển');
  };

  const handleMessageEmployee = () => {
    Alert.alert('Thông báo', 'Tính năng đang được phát triển');
  };

  const renderOrder = (order: any) => (
    <View key={order.id} style={styles.orderCard}>
      {/* Header với trạng thái */}
      <View style={styles.orderHeader}>
        <View style={styles.orderTitleRow}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
            <Ionicons 
              name={getStatusIcon(order.status) as any} 
              size={responsive.moderateScale(14)} 
              color={getStatusColor(order.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.serviceName}>{order.serviceName}</Text>
      </View>

      {/* Thông tin chi tiết */}
      <View style={styles.orderBody}>
        {/* Thời gian */}
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="calendar-outline" size={responsive.moderateScale(18)} color={colors.highlight.teal} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Thời gian</Text>
            <Text style={styles.infoValue}>{order.date} lúc {order.time}</Text>
          </View>
        </View>

        {/* Địa chỉ */}
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="location-outline" size={responsive.moderateScale(18)} color={colors.highlight.teal} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Địa chỉ</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{order.address}</Text>
          </View>
        </View>

        {/* Nhân viên */}
        {order.employeeName && (
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              {order.employeeAvatar ? (
                <Image 
                  source={{ uri: order.employeeAvatar }} 
                  style={styles.employeeAvatarSmall}
                />
              ) : (
                <Ionicons name="person-outline" size={responsive.moderateScale(18)} color={colors.highlight.teal} />
              )}
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nhân viên</Text>
              <Text style={styles.infoValue}>{order.employeeName}</Text>
            </View>
            <TouchableOpacity 
              style={styles.messageButtonSmall} 
              activeOpacity={0.7}
              onPress={handleMessageEmployee}
            >
              <Ionicons name="chatbubble-outline" size={responsive.moderateScale(16)} color={colors.highlight.teal} />
            </TouchableOpacity>
          </View>
        )}

        {/* Giá tiền */}
        <View style={styles.priceRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="card-outline" size={responsive.moderateScale(18)} color={colors.highlight.teal} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Tổng tiền</Text>
            <Text style={styles.priceValue}>{order.price}</Text>
          </View>
          {order.paymentStatus && (
            <View style={[
              styles.paymentBadge,
              { backgroundColor: order.paymentStatus === 'PAID' ? colors.feedback.success + '15' : colors.feedback.warning + '15' }
            ]}>
              <Text style={[
                styles.paymentBadgeText,
                { color: order.paymentStatus === 'PAID' ? colors.feedback.success : colors.feedback.warning }
              ]}>
                {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </Text>
            </View>
          )}
        </View>

        {/* Khuyến mãi */}
        {order.promotionCode && (
          <View style={styles.promotionRow}>
            <Ionicons name="pricetag" size={responsive.moderateScale(16)} color={colors.feedback.success} />
            <Text style={styles.promotionText}>
              {order.promotionCode} - {order.promotionDescription}
            </Text>
          </View>
        )}

        {/* Ghi chú */}
        {order.notes && (
          <View style={styles.noteRow}>
            <Ionicons name="document-text-outline" size={responsive.moderateScale(16)} color={colors.neutral.label} />
            <Text style={styles.noteText} numberOfLines={2}>{order.notes}</Text>
          </View>
        )}

        {/* Lý do hủy */}
        {order.cancelReason && (
          <View style={styles.cancelReasonRow}>
            <Ionicons name="information-circle" size={responsive.moderateScale(16)} color={colors.feedback.error} />
            <Text style={styles.cancelReasonText}>{order.cancelReason}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.orderActions}>
        {(order.status === 'PENDING' || order.status === 'AWAITING_EMPLOYEE') && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => handleOrderAction(order.id, 'cancel')}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Hủy đơn</Text>
          </TouchableOpacity>
        )}
        
        {order.status === 'IN_PROGRESS' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => handleOrderAction(order.id, 'track')}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryButtonText}>Theo dõi</Text>
          </TouchableOpacity>
        )}
        
        {order.status === 'COMPLETED' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => handleOrderAction(order.id, 'rate')}
            activeOpacity={0.7}
          >
            <Ionicons name="star" size={responsive.moderateScale(16)} color={colors.neutral.white} />
            <Text style={styles.primaryButtonText}>Đánh giá</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.outlineButton]}
          onPress={() => handleOrderAction(order.id, 'details')}
          activeOpacity={0.7}
        >
          <Text style={styles.outlineButtonText}>Chi tiết</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecurringBanner = () => (
    <TouchableOpacity
      style={styles.recurringBanner}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('RecurringBookings')}
    >
      <View style={styles.recurringIcon}>
        <Ionicons name="repeat" size={responsive.moderateScale(20)} color={colors.neutral.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.recurringTitle}>Lịch định kỳ</Text>
        <Text style={styles.recurringSubtitle} numberOfLines={2}>
          Tự động hoá dịch vụ vệ sinh và theo dõi các lịch lặp lại của bạn.
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={responsive.moderateScale(20)} color={colors.primary.navy} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Đơn Hàng</Text>
          <Text style={styles.headerSubtitle}>
            Quản lý và theo dõi các đơn hàng của bạn
          </Text>
        </View>
        <TouchableOpacity style={styles.searchButton} activeOpacity={0.7}>
          <Ionicons name="search-outline" size={responsive.moderateScale(22)} color={colors.primary.navy} />
        </TouchableOpacity>
      </View>

      {renderRecurringBanner()}

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
          style={styles.filterScroll}
        >
          {filterOptions.map((filter) => {
            const isActive = selectedFilter === filter.id;
            
            return (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterCard,
                  isActive && styles.activeFilterCard,
                ]}
                onPress={() => setSelectedFilter(filter.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    isActive && styles.activeFilterLabel
                  ]}
                >
                  {filter.label}
                </Text>
                <View style={[
                  styles.filterCountBadge,
                  isActive && styles.activeFilterCountBadge
                ]}>
                  <Text style={[
                    styles.filterCountText,
                    isActive && styles.activeFilterCountText
                  ]}>
                    {filter.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.highlight.teal} />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.highlight.teal]}
              tintColor={colors.highlight.teal}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrder)
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="receipt-outline" size={responsive.moderateScale(64)} color={colors.neutral.label} />
            </View>
            <Text style={styles.emptyStateTitle}>
              {selectedFilter === 'all'
                ? 'Chưa có đơn hàng nào'
                : `Không có đơn hàng ${FILTER_LABELS[selectedFilter].toLowerCase()}`}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {selectedFilter === 'all' 
                ? 'Hãy đặt dịch vụ đầu tiên của bạn ngay hôm nay'
                : 'Thử chọn bộ lọc khác để xem đơn hàng'
              }
            </Text>
            {selectedFilter === 'all' && (
              <TouchableOpacity
                style={styles.bookServiceButton}
                onPress={() => navigation.navigate('Booking')}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={responsive.moderateScale(20)} color={colors.neutral.white} />
                <Text style={styles.bookServiceButtonText}>Đặt dịch vụ ngay</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveSpacing.xxxl,
  },
  loadingText: {
    marginTop: responsiveSpacing.md,
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    fontWeight: '500',
  },

  // Header
  header: {
    backgroundColor: colors.warm.beige,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.lg,
    paddingTop: responsiveSpacing.md,
    paddingBottom: responsiveSpacing.lg,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: responsiveFontSize.heading1,
    fontWeight: '700',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.xs,
  },
  headerSubtitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    fontWeight: '400',
  },
  searchButton: {
    width: responsive.moderateScale(44),
    height: responsive.moderateScale(44),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(22),
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  recurringBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    marginHorizontal: responsiveSpacing.lg,
    marginTop: -responsiveSpacing.xl,
    marginBottom: responsiveSpacing.md,
    padding: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(18),
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: responsiveSpacing.md,
  },
  recurringIcon: {
    width: responsive.moderateScale(48),
    height: responsive.moderateScale(48),
    borderRadius: responsive.moderateScale(24),
    backgroundColor: colors.highlight.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurringTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  recurringSubtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    marginTop: 2,
  },

  // Filter Section - New Design
  filterSection: {
    backgroundColor: colors.neutral.background,
    paddingTop: responsiveSpacing.sm,
    paddingBottom: responsiveSpacing.sm,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterScrollContent: {
    paddingHorizontal: responsiveSpacing.lg,
    gap: responsiveSpacing.sm,
  },
  filterCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(20),
    paddingHorizontal: responsiveSpacing.sm + 2,
    paddingVertical: responsiveSpacing.sm,
    marginRight: responsiveSpacing.sm,
    width: responsive.moderateScale(95),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  activeFilterCard: {
    backgroundColor: colors.highlight.teal,
    borderColor: colors.highlight.teal,
    shadowColor: colors.highlight.teal,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textPrimary,
    fontWeight: '500',
    marginBottom: responsiveSpacing.xs / 2,
  },
  activeFilterLabel: {
    color: colors.neutral.white,
    fontWeight: '700',
  },
  filterCountBadge: {
    backgroundColor: colors.neutral.background,
    borderRadius: responsive.moderateScale(12),
    minWidth: responsive.moderateScale(28),
    height: responsive.moderateScale(28),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.xs,
  },
  activeFilterCountBadge: {
    backgroundColor: colors.neutral.white + '25',
  },
  filterCountText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '700',
    color: colors.neutral.textSecondary,
  },
  activeFilterCountText: {
    color: colors.neutral.white,
    fontSize: responsiveFontSize.bodyLarge,
  },

  // Old filter styles (deprecated but kept for safety)
  filterContainer: {
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  filterContent: {
    paddingHorizontal: responsiveSpacing.lg,
    paddingVertical: responsiveSpacing.md,
    gap: responsiveSpacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    paddingHorizontal: responsiveSpacing.lg,
    paddingVertical: responsiveSpacing.sm,
    borderRadius: responsive.moderateScale(20),
    marginRight: responsiveSpacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    minHeight: responsive.moderateScale(36),
  },
  activeFilterTab: {
    backgroundColor: colors.highlight.teal,
    borderColor: colors.highlight.teal,
  },
  filterTabText: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textPrimary,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: colors.neutral.white,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: colors.neutral.border,
    borderRadius: responsive.moderateScale(10),
    minWidth: responsive.moderateScale(20),
    height: responsive.moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: responsiveSpacing.sm,
    paddingHorizontal: responsiveSpacing.xs,
  },
  activeCountBadge: {
    backgroundColor: colors.neutral.white + '30',
  },
  countText: {
    fontSize: responsiveFontSize.caption - 2,
    fontWeight: '700',
    color: colors.neutral.textSecondary,
  },
  activeCountText: {
    color: colors.neutral.white,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsiveSpacing.lg,
    paddingTop: responsiveSpacing.md,
    paddingBottom: 0,
  },

  // Order Card
  orderCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(16),
    marginBottom: responsiveSpacing.lg,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },

  // Order Header
  orderHeader: {
    padding: responsiveSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  orderTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveSpacing.sm,
  },
  bookingCode: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: responsiveFontSize.bodyLarge,
    fontWeight: '600',
    color: colors.primary.navy,
    marginTop: responsiveSpacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.sm,
    paddingVertical: responsiveSpacing.xs,
    borderRadius: responsive.moderateScale(12),
    gap: responsiveSpacing.xs,
  },
  statusText: {
    fontSize: responsiveFontSize.caption - 1,
    fontWeight: '600',
  },

  // Order Body
  orderBody: {
    padding: responsiveSpacing.lg,
    gap: responsiveSpacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: responsive.moderateScale(36),
    height: responsive.moderateScale(36),
    borderRadius: responsive.moderateScale(18),
    backgroundColor: colors.warm.beige,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSpacing.sm,
  },
  employeeAvatarSmall: {
    width: responsive.moderateScale(36),
    height: responsive.moderateScale(36),
    borderRadius: responsive.moderateScale(18),
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: responsiveFontSize.caption - 1,
    color: colors.neutral.label,
    marginBottom: responsiveSpacing.xs / 2,
  },
  infoValue: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textPrimary,
    fontWeight: '500',
    lineHeight: responsiveFontSize.body * 1.4,
  },
  phoneNumber: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginTop: responsiveSpacing.xs / 2,
  },
  messageButtonSmall: {
    width: responsive.moderateScale(36),
    height: responsive.moderateScale(36),
    borderRadius: responsive.moderateScale(18),
    backgroundColor: colors.highlight.teal + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: responsiveSpacing.sm,
  },

  // Price Row
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warm.beige,
    padding: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(12),
    marginTop: responsiveSpacing.xs,
  },
  priceValue: {
    fontSize: responsiveFontSize.heading3,
    color: colors.highlight.teal,
    fontWeight: '700',
  },
  paymentBadge: {
    paddingHorizontal: responsiveSpacing.sm,
    paddingVertical: responsiveSpacing.xs,
    borderRadius: responsive.moderateScale(8),
    marginLeft: responsiveSpacing.sm,
  },
  paymentBadgeText: {
    fontSize: responsiveFontSize.caption - 1,
    fontWeight: '600',
  },

  // Promotion
  promotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.feedback.success + '10',
    padding: responsiveSpacing.sm,
    borderRadius: responsive.moderateScale(8),
    gap: responsiveSpacing.sm,
  },
  promotionText: {
    flex: 1,
    fontSize: responsiveFontSize.caption,
    color: colors.feedback.success,
    fontWeight: '500',
  },

  // Note
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutral.background,
    padding: responsiveSpacing.sm,
    borderRadius: responsive.moderateScale(8),
    gap: responsiveSpacing.sm,
  },
  noteText: {
    flex: 1,
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    lineHeight: responsiveFontSize.caption * 1.4,
  },

  // Cancel Reason
  cancelReasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.feedback.error + '10',
    padding: responsiveSpacing.sm,
    borderRadius: responsive.moderateScale(8),
    gap: responsiveSpacing.sm,
  },
  cancelReasonText: {
    flex: 1,
    fontSize: responsiveFontSize.caption,
    color: colors.feedback.error,
    fontWeight: '500',
    lineHeight: responsiveFontSize.caption * 1.4,
  },

  // Actions
  orderActions: {
    flexDirection: 'row',
    padding: responsiveSpacing.lg,
    paddingTop: responsiveSpacing.md,
    gap: responsiveSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSpacing.sm + 2,
    borderRadius: responsive.moderateScale(12),
    gap: responsiveSpacing.xs,
    minHeight: responsive.moderateScale(44),
  },
  primaryButton: {
    backgroundColor: colors.highlight.teal,
  },
  primaryButtonText: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.white,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.feedback.error + '15',
  },
  secondaryButtonText: {
    fontSize: responsiveFontSize.body,
    color: colors.feedback.error,
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: colors.neutral.white,
    borderWidth: 1.5,
    borderColor: colors.highlight.teal,
  },
  outlineButtonText: {
    fontSize: responsiveFontSize.body,
    color: colors.highlight.teal,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: responsiveSpacing.xxxl * 2,
    paddingHorizontal: responsiveSpacing.xl,
  },
  emptyIconContainer: {
    width: responsive.moderateScale(120),
    height: responsive.moderateScale(120),
    borderRadius: responsive.moderateScale(60),
    backgroundColor: colors.warm.beige,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing.xl,
  },
  emptyStateTitle: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: responsiveFontSize.body * 1.5,
    marginBottom: responsiveSpacing.xl,
  },
  bookServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight.teal,
    paddingHorizontal: responsiveSpacing.xl,
    paddingVertical: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(12),
    gap: responsiveSpacing.sm,
    shadowColor: colors.highlight.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookServiceButtonText: {
    fontSize: responsiveFontSize.bodyLarge,
    color: colors.neutral.white,
    fontWeight: '600',
  },
});




