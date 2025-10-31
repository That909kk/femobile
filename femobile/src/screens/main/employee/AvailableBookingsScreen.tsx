import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth, useEnsureValidToken, useUserInfo } from '../../../hooks';
import { COLORS, UI } from '../../../constants';
import {
  bookingService,
  type BookingResponse,
} from '../../../services';

const TEAL_COLOR = '#1bb5a6';

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat('vi-VN').format(value || 0)} VND`;

const formatDateTime = (dateTimeStr: string) => {
  const date = new Date(dateTimeStr);
  if (Number.isNaN(date.getTime())) return dateTimeStr;
  
  return `${date.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })} ${date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const AvailableBookingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const ensureValidToken = useEnsureValidToken();
  const { user } = useAuth();
  const { userInfo } = useUserInfo();

  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const employeeId =
    userInfo?.id || (user && 'employeeId' in user ? (user as any).employeeId : undefined);

  const fetchVerifiedBookings = useCallback(async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    try {
      if (!refreshing) {
        setLoading(true);
      }

      await ensureValidToken.ensureValidToken();

      const response = await bookingService.getVerifiedAwaitingBookings({
        page: 0,
        size: 50,
      });

      // API returns { data: BookingResponse[] }
      const bookingList = response.data.map((item: any) => {
        // Each item has structure { success, message, data: BookingResponse }
        if (item.data) {
          return item.data;
        }
        return item;
      });

      setBookings(bookingList);
    } catch (error) {
      console.error('Fetch verified bookings error:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách bài đăng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [employeeId, ensureValidToken, refreshing]);

  useEffect(() => {
    fetchVerifiedBookings();
  }, [fetchVerifiedBookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVerifiedBookings();
  }, [fetchVerifiedBookings]);

  const handleAcceptBooking = async (bookingId: string) => {
    Alert.alert('Thông báo', 'Tính năng đang được phát triển');
  };

  const renderBookingCard = (booking: BookingResponse) => {
    const addressData = booking.address || booking.customerInfo;
    const fullAddress = addressData?.fullAddress || 'Không có địa chỉ';

    return (
      <View key={booking.bookingId} style={styles.bookingCard}>
        {booking.imageUrl && (
          <Image
            source={{ uri: booking.imageUrl }}
            style={styles.bookingImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.bookingContent}>
          {booking.title && (
            <Text style={styles.bookingTitle}>{booking.title}</Text>
          )}
          
          <View style={styles.infoRow}>
            <Ionicons name="receipt-outline" size={16} color={TEAL_COLOR} />
            <Text style={styles.infoText}>#{booking.bookingCode}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={TEAL_COLOR} />
            <Text style={styles.infoText}>{booking.customerName || 'Khách hàng'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={TEAL_COLOR} />
            <Text style={styles.infoText} numberOfLines={2}>{fullAddress}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color={TEAL_COLOR} />
            <Text style={styles.infoText}>{formatDateTime(booking.bookingTime)}</Text>
          </View>

          {booking.note && (
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={16} color={TEAL_COLOR} />
              <Text style={styles.infoText} numberOfLines={2}>{booking.note}</Text>
            </View>
          )}

          <View style={styles.divider} />

          {booking.bookingDetails && booking.bookingDetails.length > 0 && (
            <View style={styles.servicesSection}>
              <Text style={styles.servicesTitle}>Dịch vụ:</Text>
              {booking.bookingDetails.map((detail, index) => (
                <View key={index} style={styles.serviceItem}>
                  <Text style={styles.serviceName}>
                    • {detail.service?.name || 'Dịch vụ'}
                  </Text>
                  <Text style={styles.servicePrice}>
                    {detail.formattedSubTotal || formatCurrency(detail.subTotal || 0)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <View>
              <Text style={styles.priceLabel}>Tổng tiền</Text>
              <Text style={styles.price}>
                {booking.formattedTotalAmount || formatCurrency(booking.totalAmount)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptBooking(booking.bookingId)}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.acceptButtonText}>Nhận việc</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{booking.status}</Text>
        </View>

        {booking.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.verifiedText}>Đã duyệt</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bài đăng</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={TEAL_COLOR} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bài đăng</Text>
        <Text style={styles.headerSubtitle}>
          Các công việc đã được duyệt và chờ nhân viên nhận
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[TEAL_COLOR]}
            tintColor={TEAL_COLOR}
          />
        }
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Không có bài đăng nào</Text>
            <Text style={styles.emptySubtext}>
              Các công việc cần nhân viên sẽ xuất hiện ở đây
            </Text>
          </View>
        ) : (
          bookings.map(renderBookingCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: UI.SPACING.lg,
    paddingVertical: UI.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: UI.SPACING.md,
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: UI.SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: UI.SPACING.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: UI.SPACING.sm,
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: UI.SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  bookingContent: {
    padding: UI.SPACING.md,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: UI.SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI.SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    marginLeft: UI.SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: UI.SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: TEAL_COLOR,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_COLOR,
    paddingHorizontal: UI.SPACING.md,
    paddingVertical: UI.SPACING.sm,
    borderRadius: 8,
    gap: 6,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  servicesSection: {
    marginTop: UI.SPACING.sm,
    marginBottom: UI.SPACING.sm,
  },
  servicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: UI.SPACING.xs,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  serviceName: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '600',
    color: TEAL_COLOR,
    marginLeft: UI.SPACING.sm,
  },
});
