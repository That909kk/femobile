import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { Button, ReviewModal, RebookModal } from '../../../components';
import { useAuth, useEnsureValidToken, useUserInfo } from '../../../hooks';
import { bookingService, chatService, reviewService } from '../../../services';
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
  employeeId?: string;
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

type FilterTab = 'all' | 'pending' | 'awaitingEmployee' | 'confirmed' | 'inProgress' | 'completed' | 'cancelled';

interface BookingStatistics {
  PENDING?: number;
  AWAITING_EMPLOYEE?: number;
  CONFIRMED?: number;
  IN_PROGRESS?: number;
  COMPLETED?: number;
  CANCELLED?: number;
}

export const OrdersScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { userInfo } = useUserInfo();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Use ref to track loading page synchronously (avoid race condition)
  const loadingPageRef = useRef<number | null>(null);
  
  // Statistics states
  const [statistics, setStatistics] = useState<BookingStatistics>({});
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);
  
  // Rebook modal state
  const [showRebookModal, setShowRebookModal] = useState(false);
  const [selectedOrderForRebook, setSelectedOrderForRebook] = useState<Order | null>(null);
  
  // Ensure token is valid when component mounts
  useEnsureValidToken();

  useEffect(() => {
    loadOrders(true);
    loadStatistics();
  }, []);

  // Don't reload when filter changes - just filter locally
  // useEffect(() => {
  //   loadOrders(true);
  // }, [selectedFilter]);

  useEffect(() => {
    console.log('Statistics updated:', statistics);
    console.log('Orders count:', orders.length);
    console.log('Current filter:', selectedFilter);
    
    // Check if we've loaded all orders
    if (!hasMore && orders.length > 0 && totalElements > 0) {
      if (orders.length < totalElements) {
        console.error(`🚨 MISSING ORDERS: Loaded ${orders.length} but expected ${totalElements}. Missing: ${totalElements - orders.length}`);
      } else if (orders.length === totalElements) {
        console.log(`✅ All orders loaded successfully: ${orders.length}/${totalElements}`);
      }
    }
  }, [statistics, orders.length, selectedFilter, hasMore, totalElements]);

  const loadStatistics = async () => {
    try {
      setLoadingStats(true);
      const customerId =
        userInfo?.id || (user && 'customerId' in user ? (user as any).customerId : undefined);

      if (!customerId) {
        return;
      }

      // Call statistics API - GET /api/v1/customer/{customerId}/bookings/statistics?timeUnit=MONTH
      const response = await bookingService.getBookingStatistics(customerId, 'MONTH');
      
      console.log('Statistics response:', response);
      
      // Handle response structure - could be wrapped or direct
      if (response.data?.countByStatus) {
        setStatistics(response.data.countByStatus);
        console.log('Statistics loaded:', response.data.countByStatus);
      } else if (response.success && response.data) {
        setStatistics(response.data.countByStatus || {});
      } else {
        console.warn('Statistics response invalid structure:', response);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Don't show error to user, just use empty stats
    } finally {
      setLoadingStats(false);
    }
  };

  const loadOrders = async (resetPage: boolean = false, append: boolean = false) => {
    try {
      const pageToLoad = resetPage ? 0 : currentPage;
      
      if (resetPage) {
        setLoading(true);
        setOrders([]);
        setCurrentPage(0);
        setHasMore(true);
        loadingPageRef.current = 0;
      } else {
        // Don't load if already loading or no more data
        if (loadingMore || !hasMore) {
          console.log('Skip loading: already loading or no more data');
          return;
        }
        
        // Prevent loading the same page twice (synchronous check)
        if (loadingPageRef.current === pageToLoad) {
          console.log(`⚠️ Already loading page ${pageToLoad}, skipping duplicate request`);
          return;
        }
        
        setLoadingMore(true);
        loadingPageRef.current = pageToLoad;
      }

      const customerId =
        userInfo?.id || (user && 'customerId' in user ? (user as any).customerId : undefined);

      if (!customerId) {
        console.warn('Khong co ma khach hang trong he thong');
        setOrders([]);
        return;
      }

      console.log(`Loading orders - page: ${pageToLoad}, reset: ${resetPage}, append: ${append}`);

      // Call API: GET /api/v1/customer/bookings/customer/{customerId}
      const response = await bookingService.getCustomerBookings(customerId, {
        page: pageToLoad,
        size: 10, // Load 10 items per page
        sort: 'bookingId,desc', // Use bookingId for stable sort (unique)
      });

      const transformedOrders: Order[] = (response.content || []).map((booking: any) => {
        const bookingDate = booking.bookingTime ? new Date(booking.bookingTime) : null;
        
        // API returns 'services' array according to docs
        // Example: [{ serviceId, name, description, basePrice, ... }]
        const services = booking.services || [];
        const serviceName = services.length > 0 
          ? services.map((s: any) => s.name || s.serviceName).join(', ')
          : 'Dịch vụ gia đình';
        
        // API returns 'assignedEmployees' array according to docs
        const primaryEmployee = booking.assignedEmployees?.[0];

        // API returns 'address' object: { addressId, fullAddress, ward, city, latitude, longitude }
        const addressInfo = booking.address;
        const fullAddress = addressInfo?.fullAddress || '';
        
        // API returns 'payment' object: { id, amount, paymentMethodName, paymentStatus, transactionCode, ... }
        const paymentInfo = booking.payment;
        
        // API returns 'promotion' object: { promotionId, promoCode, description, discountType, ... }
        const promotionInfo = booking.promotion;

        // Format price - API returns formattedTotalAmount as string like "120,000đ"
        // or payment.amount as number
        let formattedPrice = '0đ';
        if (booking.formattedTotalAmount) {
          // Use formattedTotalAmount if available (e.g., "120,000đ")
          formattedPrice = booking.formattedTotalAmount;
        } else if (paymentInfo?.amount && typeof paymentInfo.amount === 'number') {
          // Fallback to payment.amount if formattedTotalAmount is not available
          formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(paymentInfo.amount);
        }

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
          employeeId: primaryEmployee?.employeeId,
          price: formattedPrice,
          address: fullAddress || 'Chưa cập nhật địa chỉ',
          fullAddress: fullAddress,
          rating: booking.rating,
          notes: booking.note,
          estimatedCompletion: services[0]?.estimatedDurationHours ? `${services[0].estimatedDurationHours} giờ` : undefined,
          cancelReason: booking.cancelReason,
          paymentStatus: paymentInfo?.paymentStatus,
          paymentMethod: paymentInfo?.paymentMethodName || paymentInfo?.paymentMethod,
          promotionCode: promotionInfo?.promoCode,
          promotionDescription: promotionInfo?.description,
        };
      });

      // Update pagination info
      // Response structure: { content: [], page: { totalElements, totalPages, number, size } }
      // Or direct: { content: [], totalElements, totalPages, last, number }
      const pageInfo = (response as any).page || response;
      const newTotalPages = pageInfo.totalPages || totalPages;
      const newTotalElements = pageInfo.totalElements || totalElements; // Keep existing if not in response
      const isLastPage = pageInfo.last || false;
      const currentPageNumber = pageInfo.number ?? pageToLoad;

      console.log(`📄 Page ${currentPageNumber}: ${transformedOrders.length} orders, total: ${newTotalElements}, last: ${isLastPage}`);

      // Stop loading if response is empty or we've reached the last page
      const shouldStop = isLastPage || transformedOrders.length === 0 || currentPageNumber >= newTotalPages - 1;

      setTotalPages(newTotalPages);
      setTotalElements(newTotalElements);
      setHasMore(!shouldStop);

      if (append) {
        // Append new orders and filter duplicates (API sometimes returns duplicates)
        setOrders(prev => {
          const existingIds = new Set(prev.map(order => order.bookingId));
          const newOrders = transformedOrders.filter(order => !existingIds.has(order.bookingId));
          const duplicateCount = transformedOrders.length - newOrders.length;
          
          if (duplicateCount > 0) {
            console.warn(`⚠️ Filtered ${duplicateCount} duplicates from page ${pageToLoad}`);
          }
          
          console.log(`Appending: ${newOrders.length} orders. Total: ${prev.length} → ${prev.length + newOrders.length}/${newTotalElements}`);
          return [...prev, ...newOrders];
        });
        // Update page number after successful load
        setCurrentPage(pageToLoad + 1);
        loadingPageRef.current = null; // Clear loading page
      } else {
        setOrders(transformedOrders);
        setCurrentPage(1); // Reset to page 1 after loading first page
        loadingPageRef.current = null;
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      if (resetPage) {
        Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
        setOrders([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      loadingPageRef.current = null; // Always clear loading page in finally
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && !loading && hasMore) {
      console.log(`📥 Loading more... Current: ${orders.length}/${totalElements}, Page: ${currentPage}`);
      loadOrders(false, true);
    } else {
      console.log(`❌ Cannot load more: loading=${loading}, loadingMore=${loadingMore}, hasMore=${hasMore}`);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders(true);
    loadStatistics();
  };

  const FILTER_STATUS_MAP: Record<FilterTab, BookingStatus[]> = {
    all: [],
    pending: ['PENDING'],
    awaitingEmployee: ['AWAITING_EMPLOYEE'],
    confirmed: ['CONFIRMED'],
    inProgress: ['IN_PROGRESS'],
    completed: ['COMPLETED'],
    cancelled: ['CANCELLED'],
  };

  const FILTER_LABELS: Record<FilterTab, string> = {
    all: 'Tất cả',
    pending: 'Chờ xử lý',
    awaitingEmployee: 'Chờ phân công',
    confirmed: 'Đã xác nhận',
    inProgress: 'Đang thực hiện',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  const filterOrder: FilterTab[] = ['all', 'pending', 'awaitingEmployee', 'confirmed', 'inProgress', 'completed', 'cancelled'];

  // Get total count from API response (totalElements) or statistics
  const getFilterCount = (filterKey: FilterTab): number => {
    // For 'all' filter, use totalElements from API response (real total count)
    if (filterKey === 'all') {
      return totalElements || 0;
    }
    
    // For other filters, use statistics API if available
    const hasStatistics = Object.keys(statistics).length > 0;
    
    if (hasStatistics) {
      if (filterKey === 'pending') {
        return statistics.PENDING || 0;
      }
      if (filterKey === 'awaitingEmployee') {
        return statistics.AWAITING_EMPLOYEE || 0;
      }
      if (filterKey === 'confirmed') {
        return statistics.CONFIRMED || 0;
      }
      if (filterKey === 'inProgress') {
        return statistics.IN_PROGRESS || 0;
      }
      if (filterKey === 'completed') {
        return statistics.COMPLETED || 0;
      }
      if (filterKey === 'cancelled') {
        return statistics.CANCELLED || 0;
      }
    } else {
      // Fallback: count from loaded orders only
      return orders.filter(order => FILTER_STATUS_MAP[filterKey].includes(order.status)).length;
    }
    
    return 0;
  };

  // Get loaded count (currently displayed) for each filter
  const getLoadedCount = (filterKey: FilterTab): number => {
    if (filterKey === 'all') {
      return orders.length;
    }
    return orders.filter(order => FILTER_STATUS_MAP[filterKey].includes(order.status)).length;
  };

  const filterOptions = useMemo(() => {
    return filterOrder.map((key) => {
      if (key === 'all') {
        // For "Tất cả": loaded count / total count from API (supports load more)
        return {
          id: key,
          label: FILTER_LABELS[key],
          loadedCount: getLoadedCount(key), // Currently loaded count
          count: getFilterCount(key), // Total count from API
        };
      } else {
        // For other filters: count from loaded orders only (no separate loading)
        const loadedCount = getLoadedCount(key);
        return {
          id: key,
          label: FILTER_LABELS[key],
          loadedCount: loadedCount, // Count of this specific status in loaded orders
          count: loadedCount, // Same as loaded (filtered from "all")
        };
      }
    });
  }, [orders, statistics, totalElements]);

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

  // Filter orders locally based on selected filter tab
  // Memoized to avoid re-filtering on every render for better performance
  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'all') {
      return orders;
    }
    return orders.filter((order) => FILTER_STATUS_MAP[selectedFilter].includes(order.status));
  }, [orders, selectedFilter]);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    
    // Calculate how far user has scrolled (percentage)
    const scrollPercentage = (layoutMeasurement.height + contentOffset.y) / contentSize.height;
    
    // Prefetch next page when user reaches 70% of scroll
    // This makes scrolling feel smoother as data is already loading
    if (scrollPercentage >= 0.7 && !loadingMore && !loading && hasMore) {
      console.log('Prefetching next page at 70% scroll...');
      handleLoadMore();
    }
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
        if (order) {
          handleOpenReviewModal(order);
        }
        break;
      case 'rebook':
        if (order) {
          handleOpenRebookModal(order);
        }
        break;
      case 'details':
        navigation.navigate('OrderDetail', { bookingId: orderId });
        break;
      default:
        console.log(`${action} order:`, orderId);
    }
  };

  // Handle opening review modal
  const handleOpenReviewModal = (order: Order) => {
    if (!order.employeeId) {
      Alert.alert('Thông báo', 'Đơn hàng này chưa có nhân viên được phân công để đánh giá');
      return;
    }
    setSelectedOrderForReview(order);
    setShowReviewModal(true);
  };

  // Handle submitting review
  const handleSubmitReview = async (
    ratings: Array<{ criterionId: number; score: number }>,
    comment: string
  ) => {
    if (!selectedOrderForReview?.bookingId || !selectedOrderForReview?.employeeId) {
      throw new Error('Thông tin đánh giá không hợp lệ');
    }

    await reviewService.createReview({
      bookingId: selectedOrderForReview.bookingId,
      employeeId: selectedOrderForReview.employeeId,
      ratings,
      comment,
    });

    Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá dịch vụ!');
    setShowReviewModal(false);
    setSelectedOrderForReview(null);
    loadOrders(true); // Refresh orders
  };

  // Handle opening rebook modal
  const handleOpenRebookModal = (order: Order) => {
    setSelectedOrderForRebook(order);
    setShowRebookModal(true);
  };

  // Handle rebook - create new booking based on completed order
  const handleRebook = async (dateTime: string) => {
    if (!selectedOrderForRebook) {
      throw new Error('Không tìm thấy thông tin đơn hàng');
    }

    // Get full booking details for rebooking
    const bookingDetails = await bookingService.getBookingById(selectedOrderForRebook.bookingId);
    
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
            setSelectedOrderForRebook(null);
            loadOrders(true);
          },
        },
      ]
    );
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

  const handleMessageEmployee = async (order: Order) => {
    try {
      // Kiểm tra xem có thông tin nhân viên không
      if (!order.employeeId) {
        Alert.alert('Thông báo', 'Đơn hàng chưa có nhân viên được phân công');
        return;
      }

      // Lấy customerId từ userInfo hoặc user
      const customerId = userInfo?.id || (user && 'customerId' in user ? (user as any).customerId : undefined);
      
      if (!customerId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin khách hàng');
        return;
      }

      console.log('Opening chat with employee:', order.employeeId, 'for booking:', order.bookingId);

      let conversation;
      
      try {
        // Ưu tiên: Nếu có bookingId, thử lấy conversation theo booking trước
        if (order.bookingId) {
          try {
            conversation = await chatService.getConversationByBooking(order.bookingId);
            console.log('Found conversation by booking:', conversation.conversationId);
          } catch (bookingError) {
            console.log('No conversation found for booking, will search by participants');
          }
        }

        // Nếu chưa có conversation, tìm trong danh sách conversations hiện có
        if (!conversation) {
          const conversations = await chatService.getConversationsBySender({
            senderId: customerId,
            page: 0,
            size: 100, // Lấy nhiều để tìm
          });

          // Tìm conversation với employee này (ưu tiên conversation có bookingId trùng)
          conversation = conversations.find(
            (conv) => 
              conv.employeeId === order.employeeId && 
              (!order.bookingId || conv.bookingId === order.bookingId)
          );

          // Nếu không tìm thấy conversation có cùng bookingId, lấy bất kỳ conversation nào với employee
          if (!conversation) {
            conversation = conversations.find((conv) => conv.employeeId === order.employeeId);
          }

          if (conversation) {
            console.log('Found existing conversation:', conversation.conversationId);
          }
        }

        // Nếu vẫn không có, tạo mới với bookingId
        if (!conversation) {
          console.log('Creating new conversation with booking:', order.bookingId);
          conversation = await chatService.createConversation({
            customerId,
            employeeId: order.employeeId,
            bookingId: order.bookingId,
          });
          console.log('Created new conversation:', conversation.conversationId);
        }
      } catch (error: any) {
        console.error('Error getting/creating conversation:', error);
        throw error;
      }

      // Navigate đến ChatScreen với conversationId và tên nhân viên
      navigation.navigate('ChatScreen', {
        conversationId: conversation.conversationId,
        recipientName: order.employeeName || 'Nhân viên',
      });
    } catch (error: any) {
      console.error('Error opening chat:', error);
      Alert.alert('Lỗi', error.message || 'Không thể mở cuộc trò chuyện. Vui lòng thử lại.');
    }
  };

  const renderOrder = (order: Order) => (
    <View style={styles.orderCard}>
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
              onPress={() => handleMessageEmployee(order)}
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
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => handleOrderAction(order.id, 'rate')}
              activeOpacity={0.7}
            >
              <Ionicons name="star" size={responsive.moderateScale(16)} color={colors.neutral.white} />
              <Text style={styles.primaryButtonText}>Đánh giá</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rebookButton]}
              onPress={() => handleOrderAction(order.id, 'rebook')}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={responsive.moderateScale(16)} color={colors.highlight.teal} />
              <Text style={styles.rebookButtonText}>Đặt lại</Text>
            </TouchableOpacity>
          </>
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
            const isAllFilter = filter.id === 'all';
            
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
                    {isAllFilter ? `${filter.loadedCount}/${filter.count}` : filter.count}
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
              onRefresh={handleRefresh}
              colors={[colors.highlight.teal]}
              tintColor={colors.highlight.teal}
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={100}
          showsVerticalScrollIndicator={false}
        >
          {filteredOrders.length > 0 ? (
            <>
              {filteredOrders.map((order) => (
                <React.Fragment key={order.bookingId}>
                  {renderOrder(order)}
                </React.Fragment>
              ))}
              
              {/* Load More Indicator - Compact design for smooth scrolling */}
              {loadingMore && (
                <View style={styles.loadMoreIndicator}>
                  <ActivityIndicator size="small" color={colors.highlight.teal} />
                  <Text style={styles.loadMoreText}>Đang tải thêm...</Text>
                </View>
              )}
              
              {/* End of List Indicator */}
              {!hasMore && orders.length > 0 && (
                <View style={{ paddingVertical: responsiveSpacing.lg, alignItems: 'center' }}>
                  <Text style={[styles.loadingText, { color: colors.neutral.label }]}>
                    Đã tải tất cả đơn hàng ({totalElements})
                  </Text>
                </View>
              )}
            </>
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

      {/* Review Modal */}
      <ReviewModal
        visible={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedOrderForReview(null);
        }}
        onSubmit={handleSubmitReview}
        employeeName={selectedOrderForReview?.employeeName}
        bookingCode={selectedOrderForReview?.bookingCode}
      />

      {/* Rebook Modal */}
      <RebookModal
        visible={showRebookModal}
        onClose={() => {
          setShowRebookModal(false);
          setSelectedOrderForRebook(null);
        }}
        onConfirm={handleRebook}
        originalDate={selectedOrderForRebook?.date}
        originalTime={selectedOrderForRebook?.time}
        serviceName={selectedOrderForRebook?.serviceName}
        bookingCode={selectedOrderForRebook?.bookingCode}
      />
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
  
  // Load More Indicator (compact)
  loadMoreIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveSpacing.md,
    gap: responsiveSpacing.sm,
  },
  loadMoreText: {
    fontSize: responsiveFontSize.caption,
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
    minWidth: responsive.moderateScale(42),
    height: responsive.moderateScale(28),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing.xs + 2,
  },
  activeFilterCountBadge: {
    backgroundColor: colors.neutral.white + '25',
  },
  filterCountText: {
    fontSize: responsiveFontSize.caption,
    fontWeight: '700',
    color: colors.neutral.textSecondary,
  },
  activeFilterCountText: {
    color: colors.neutral.white,
    fontSize: responsiveFontSize.body,
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
  rebookButton: {
    backgroundColor: colors.highlight.teal + '15',
    borderWidth: 1.5,
    borderColor: colors.highlight.teal,
  },
  rebookButtonText: {
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




