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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../../components';
import { useAuth, useEnsureValidToken, useUserInfo } from '../../../hooks';
import { bookingService } from '../../../services';
import { COLORS } from '../../../constants';

interface Order {
  id: string;
  bookingId: string;
  serviceName: string;
  status: string;
  date: string;
  time: string;
  employeeName?: string;
  employeePhone?: string;
  price: string;
  address: string;
  rating?: number;
  notes?: string;
  estimatedCompletion?: string;
  cancelReason?: string;
}

export const OrdersScreen = () => {
  const { user } = useAuth();
  const { userInfo } = useUserInfo();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Ensure token is valid when component mounts
  useEnsureValidToken();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // Get customer ID from user info
      const customerId = userInfo?.id || (user && 'customerId' in user ? user.customerId : undefined);
      if (!customerId) {
        console.warn('No customer ID available');
        setOrders([]);
        return;
      }

      // Get customer bookings from API
      const response = await bookingService.getCustomerBookings(customerId);
      
      if (response.success && response.data) {
        // Transform API data to match our Order interface
        const transformedOrders: Order[] = response.data.bookings.map((booking: any) => ({
          id: booking.bookingId,
          bookingId: booking.bookingId,
          serviceName: booking.serviceDetails?.[0]?.service?.name || 'Dịch vụ',
          status: booking.status,
          date: new Date(booking.bookingTime).toLocaleDateString('vi-VN'),
          time: new Date(booking.bookingTime).toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          employeeName: booking.assignedEmployees?.[0]?.fullName,
          employeePhone: booking.assignedEmployees?.[0]?.phoneNumber,
          price: booking.formattedTotalAmount || `${booking.totalAmount?.toLocaleString('vi-VN')}đ`,
          address: booking.customerInfo?.fullAddress || 'Địa chỉ chưa xác định',
          rating: booking.rating,
          notes: booking.note,
          estimatedCompletion: booking.estimatedDuration,
        }));
        
        setOrders(transformedOrders);
      } else {
        console.warn('Failed to load orders:', response.message);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = [
    { id: 'all', label: 'Tất cả', count: orders.length },
    { id: 'scheduled', label: 'Đã đặt', count: orders.filter(o => o.status === 'scheduled').length },
    { id: 'in-progress', label: 'Đang thực hiện', count: orders.filter(o => o.status === 'in_progress').length },
    { id: 'completed', label: 'Hoàn thành', count: orders.filter(o => o.status === 'completed').length },
    { id: 'cancelled', label: 'Đã hủy', count: orders.filter(o => o.status === 'cancelled').length },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'pending':
        return COLORS.warning;
      case 'in-progress':
      case 'in_progress':
        return COLORS.secondary;
      case 'completed':
        return COLORS.success;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.text.tertiary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'pending':
        return 'Đã đặt lịch';
      case 'in-progress':
      case 'in_progress':
        return 'Đang thực hiện';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'pending':
        return 'time-outline';
      case 'in-progress':
      case 'in_progress':
        return 'play-circle';
      case 'completed':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'information-circle';
    }
  };

  const filteredOrders = selectedFilter === 'all' 
    ? orders 
    : orders.filter(order => {
        if (selectedFilter === 'in-progress') {
          return order.status === 'in-progress' || order.status === 'in_progress';
        }
        return order.status === selectedFilter;
      });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleOrderAction = (orderId: string, action: string) => {
    console.log(`${action} order:`, orderId);
    // Handle different actions: cancel, reschedule, rate, etc.
  };

  const renderOrder = (order: any) => (
    <View key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>#{order.id}</Text>
          <Text style={styles.serviceName}>{order.serviceName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
          <Ionicons 
            name={getStatusIcon(order.status) as any} 
            size={16} 
            color={getStatusColor(order.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {getStatusText(order.status)}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={COLORS.text.tertiary} />
          <Text style={styles.detailText}>{order.date} lúc {order.time}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color={COLORS.text.tertiary} />
          <Text style={styles.detailText} numberOfLines={2}>{order.address}</Text>
        </View>

        {order.employeeName && (
          <View style={styles.detailRow}>
            <Ionicons name="person" size={16} color={COLORS.text.tertiary} />
            <Text style={styles.detailText}>{order.employeeName}</Text>
            {order.employeePhone && (
              <TouchableOpacity style={styles.callButton}>
                <Ionicons name="call" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons name="card" size={16} color={COLORS.text.tertiary} />
          <Text style={[styles.detailText, styles.priceText]}>{order.price}</Text>
        </View>

        {order.estimatedCompletion && (
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color={COLORS.secondary} />
            <Text style={styles.detailText}>Dự kiến hoàn thành: {order.estimatedCompletion}</Text>
          </View>
        )}

        {order.rating && (
          <View style={styles.detailRow}>
            <Ionicons name="star" size={16} color={COLORS.warning} />
            <Text style={styles.detailText}>Đánh giá: {order.rating}/5 sao</Text>
          </View>
        )}

        {order.cancelReason && (
          <View style={styles.detailRow}>
            <Ionicons name="information-circle" size={16} color={COLORS.error} />
            <Text style={styles.detailText}>{order.cancelReason}</Text>
          </View>
        )}
      </View>

      <View style={styles.orderActions}>
        {order.status === 'scheduled' && (
          <>
            <Button
              title="Đổi lịch"
              variant="outline"
              onPress={() => handleOrderAction(order.id, 'reschedule')}
            />
            <Button
              title="Hủy đơn"
              variant="outline"
              onPress={() => handleOrderAction(order.id, 'cancel')}
            />
          </>
        )}
        
        {order.status === 'in-progress' && (
          <Button
            title="Theo dõi"
            variant="primary"
            onPress={() => handleOrderAction(order.id, 'track')}
          />
        )}
        
        {order.status === 'completed' && !order.rating && (
          <Button
            title="Đánh giá"
            variant="primary"
            onPress={() => handleOrderAction(order.id, 'rate')}
          />
        )}
        
        <Button
          title="Chi tiết"
          variant="outline"
          onPress={() => handleOrderAction(order.id, 'details')}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[COLORS.secondary, COLORS.secondaryLight]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Đơn Hàng</Text>
            <Text style={styles.headerSubtitle}>
              Quản lý các dịch vụ đã đặt
            </Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color={COLORS.surface} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filterOptions.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterTab,
                selectedFilter === filter.id && styles.activeFilterTab
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === filter.id && styles.activeFilterTabText
                ]}
              >
                {filter.label}
              </Text>
              {filter.count > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{filter.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
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
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrder)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={COLORS.text.tertiary} />
            <Text style={styles.emptyStateTitle}>
              {selectedFilter === 'all' ? 'Chưa có đơn hàng nào' : `Không có đơn hàng ${getStatusText(selectedFilter).toLowerCase()}`}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {selectedFilter === 'all' 
                ? 'Hãy đặt dịch vụ đầu tiên của bạn'
                : 'Thử chọn bộ lọc khác để xem đơn hàng'
              }
            </Text>
            {selectedFilter === 'all' && (
              <Button
                title="Đặt dịch vụ ngay"
                variant="primary"
                onPress={() => {/* Navigate to booking */}}
              />
            )}
          </View>
        )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.surface,
    opacity: 0.9,
  },
  searchButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterContainer: {
    paddingHorizontal: 20,
  },
  filterContent: {
    paddingBottom: 20,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  activeFilterTab: {
    backgroundColor: COLORS.surface,
  },
  filterTabText: {
    fontSize: 14,
    color: COLORS.surface,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: COLORS.secondary,
  },
  countBadge: {
    backgroundColor: COLORS.warning,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for bottom tab
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    fontWeight: '500',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  orderDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 8,
    flex: 1,
  },
  priceText: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  callButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
});