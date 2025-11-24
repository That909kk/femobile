import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { employeeAssignmentService } from '../../../services/employeeAssignmentService';
import type { BookingResponse } from '../../../types/booking';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useUserInfo } from '../../../hooks';

const { width } = Dimensions.get('window');
const PAGE_SIZE = 10;

interface AvailableBookingsScreenProps {
  onAcceptBooking?: (bookingId: number) => void;
}

const AvailableBookingsScreen: React.FC<AvailableBookingsScreenProps> = ({ onAcceptBooking }) => {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [matchEmployeeZones, setMatchEmployeeZones] = useState(true);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);
  const [accepting, setAccepting] = useState(false);
  
  const { userInfo } = useUserInfo();

  const fetchBookings = useCallback(async (page: number = 0, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (page === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await employeeAssignmentService.getVerifiedAwaitingEmployeeBookings({
        page,
        size: PAGE_SIZE,
        matchEmployeeZones,
      });

      if (response.success && response.data) {
        if (isRefresh || page === 0) {
          setBookings(response.data);
        } else {
          setBookings(prev => [...prev, ...response.data]);
        }
        setCurrentPage(response.currentPage || page);
        setTotalPages(response.totalPages || 0);
        setTotalItems(response.totalItems || 0);
      }
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách bài đăng');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [matchEmployeeZones]);

  useEffect(() => {
    fetchBookings(0);
  }, [fetchBookings]);

  const handleRefresh = () => {
    setCurrentPage(0);
    fetchBookings(0, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && !loading && currentPage < totalPages - 1) {
      fetchBookings(currentPage + 1);
    }
  };

  const handleToggleZoneFilter = () => {
    setMatchEmployeeZones(prev => !prev);
    setCurrentPage(0);
  };

  const handleAcceptBooking = (booking: BookingResponse) => {
    setSelectedBooking(booking);
    setConfirmModalVisible(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedBooking || !userInfo?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin nhân viên');
      return;
    }

    try {
      setAccepting(true);
      
      // Lấy bookingDetailId từ booking
      const firstDetail = selectedBooking.serviceDetails?.[0] || selectedBooking.bookingDetails?.[0];
      if (!firstDetail || !firstDetail.bookingDetailId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin chi tiết booking');
        return;
      }

      const response = await employeeAssignmentService.acceptBookingDetail(
        firstDetail.bookingDetailId,
        userInfo.id
      );

      if (response.success) {
        Alert.alert(
          'Thành công',
          'Bạn đã nhận việc thành công! Vui lòng kiểm tra trong mục "Công việc của tôi".',
          [
            {
              text: 'OK',
              onPress: () => {
                setConfirmModalVisible(false);
                setSelectedBooking(null);
                // Refresh danh sách
                handleRefresh();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error accepting booking:', error);
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể nhận việc. Vui lòng thử lại sau.'
      );
    } finally {
      setAccepting(false);
    }
  };

  const handleCancelConfirm = () => {
    setConfirmModalVisible(false);
    setSelectedBooking(null);
  };

  const handleContactHotline = () => {
    Linking.openURL('tel:0825371577');
  };

  const handleContactZalo = () => {
    Linking.openURL('https://zalo.me/0342287853');
  };

  const handleContactEmail = () => {
    Linking.openURL('mailto:mthat456@gmail.com');
  };

  const formatAddress = (booking: BookingResponse) => {
    const address = booking.address || booking.customerInfo;
    if (!address) return 'Chưa có địa chỉ';
    
    const parts = [];
    if (address.fullAddress) return address.fullAddress;
    if (address.ward) parts.push(address.ward);
    if (address.district) parts.push(address.district);
    if (address.city) parts.push(address.city);
    return parts.join(', ') || 'Chưa có địa chỉ';
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
    } catch {
      return 'Vừa xong';
    }
  };

  const formatStartTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm 'ngày' dd/MM/yyyy", { locale: vi });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} giờ`;
  };

  const getServiceIcon = (service: any) => {
    const iconUrl = service?.service?.iconUrl || service?.iconUrl;
    const serviceName = (service?.serviceName || service?.service?.name || '').toLowerCase();
    
    if (serviceName.includes('dọn dẹp') || serviceName.includes('vệ sinh')) {
      return 'home-outline';
    } else if (serviceName.includes('sofa') || serviceName.includes('nệm')) {
      return 'bed-outline';
    } else if (serviceName.includes('máy lạnh')) {
      return 'snow-outline';
    } else if (serviceName.includes('sửa chữa')) {
      return 'construct-outline';
    } else if (serviceName.includes('điện')) {
      return 'flash-outline';
    } else if (serviceName.includes('nước')) {
      return 'water-outline';
    }
    return 'briefcase-outline';
  };

  const renderBookingCard = ({ item }: { item: BookingResponse }) => {
    const firstService = item.serviceDetails?.[0] || item.bookingDetails?.[0];
    const customer = (item as any).customer;
    const avatarUrl = customer?.avatar || 'https://ui-avatars.com/api/?name=' + 
      encodeURIComponent(customer?.fullName || item.customerName || 'KH') + '&background=4CAF50&color=fff&size=100';
    const address = item.address || (item as any).customerInfo;
    
    return (
    <View style={styles.card}>
      {/* Header - Customer Info */}
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
        />
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>
            {customer?.fullName || item.customerName || 'Khách hàng'}
          </Text>
          <View style={styles.timeAgoContainer}>
            <Ionicons name="time-outline" size={13} color="#9E9E9E" />
            <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Chờ nhận</Text>
        </View>
      </View>

      {/* Booking Info Section */}
      <View style={styles.infoSection}>
        {/* Start Time */}
        <View style={styles.infoRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="calendar" size={16} color="#2196F3" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Thời gian bắt đầu</Text>
            <Text style={styles.infoValue}>{formatStartTime(item.bookingTime)}</Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.infoRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={16} color="#F44336" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Địa điểm</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {address?.ward || 'Phường/Xã'}, {address?.city || 'TP.HCM'}
            </Text>
          </View>
        </View>
      </View>

      {/* Note */}
      {item.note && (
        <View style={styles.noteContainer}>
          <View style={styles.noteHeader}>
            <Ionicons name="document-text" size={16} color="#FF9800" />
            <Text style={styles.noteLabel}>Ghi chú</Text>
          </View>
          <Text style={styles.noteText} numberOfLines={3}>
            {item.note}
          </Text>
        </View>
      )}

      {/* Service Info */}
      {firstService && (
        <View style={styles.serviceCard}>
          <View style={styles.serviceRow}>
            <View style={styles.serviceIconWrapper}>
              <Ionicons name={getServiceIcon(firstService)} size={28} color="#4CAF50" />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName} numberOfLines={1}>
                {(firstService as any).serviceName || firstService.service?.name || 'Dịch vụ'}
              </Text>
              <View style={styles.serviceMetaRow}>
                <View style={styles.serviceMetaItem}>
                  <Ionicons name="time" size={14} color="#757575" />
                  <Text style={styles.serviceMetaText}>
                    {firstService.formattedDuration || firstService.duration || item.estimatedDuration || 'N/A'}
                  </Text>
                </View>
                <View style={styles.serviceDivider} />
                <View style={styles.serviceMetaItem}>
                  <Ionicons name="cash" size={14} color="#4CAF50" />
                  <Text style={styles.servicePriceText}>
                    {item.formattedTotalAmount || formatPrice(item.totalAmount || 0)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Images */}
      {item.imageUrls && item.imageUrls.length > 0 && (
        <View style={styles.imagesSection}>
          <Text style={styles.imagesSectionTitle}>Hình ảnh đính kèm</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={item.imageUrls}
            keyExtractor={(url, index) => `${item.bookingId}-img-${index}`}
            renderItem={({ item: imageUrl }) => (
              <Image source={{ uri: imageUrl }} style={styles.bookingImage} />
            )}
          />
        </View>
      )}

      {/* Accept Button */}
      <TouchableOpacity
        style={styles.acceptButton}
        onPress={() => handleAcceptBooking(item)}
        activeOpacity={0.7}
      >
        <Ionicons name="checkmark-circle" size={22} color="#fff" />
        <Text style={styles.acceptButtonText}>Nhận việc ngay</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="briefcase-outline" size={64} color="#BDBDBD" />
        <Text style={styles.emptyTitle}>
          {matchEmployeeZones ? 'Chưa có bài đăng phù hợp' : 'Chưa có bài đăng nào'}
        </Text>
        <Text style={styles.emptyText}>
          {matchEmployeeZones
            ? 'Chưa có bài đăng nào trong khu vực của bạn'
            : 'Hiện tại chưa có bài đăng nào đang chờ nhận việc'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#4CAF50" />
        <Text style={styles.footerText}>Đang tải thêm...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Toggle */}
      <View style={styles.filterContainer}>
        <View style={styles.filterLeft}>
          <Ionicons
            name={matchEmployeeZones ? 'location' : 'globe-outline'}
            size={20}
            color={matchEmployeeZones ? '#4CAF50' : '#757575'}
          />
          <Text style={styles.filterLabel}>
            {matchEmployeeZones ? 'Khu vực của tôi' : 'Tất cả khu vực'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleButton, matchEmployeeZones && styles.toggleButtonActive]}
          onPress={handleToggleZoneFilter}
          activeOpacity={0.7}
        >
          <View style={[styles.toggleThumb, matchEmployeeZones && styles.toggleThumbActive]} />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      {totalItems > 0 && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            Tìm thấy <Text style={styles.statsHighlight}>{totalItems}</Text> bài đăng
          </Text>
          {totalPages > 1 && (
            <Text style={styles.statsPage}>
              Trang {currentPage + 1}/{totalPages}
            </Text>
          )}
        </View>
      )}

      {/* Bookings List */}
      <FlatList
        data={bookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => `booking-${item.bookingId}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
      />

      {/* Initial Loading */}
      {loading && bookings.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải bài đăng...</Text>
        </View>
      )}

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelConfirm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalIconWrapper}>
                  <Ionicons name="warning" size={32} color="#FF9800" />
                </View>
                <Text style={styles.modalTitle}>Xác nhận nhận công việc</Text>
              </View>

              {/* Warning Section */}
              <View style={styles.warningSection}>
                <View style={styles.warningHeader}>
                  <Ionicons name="alert-circle" size={20} color="#F44336" />
                  <Text style={styles.warningTitle}>⚠️ Lưu ý quan trọng:</Text>
                </View>
                
                <View style={styles.warningItem}>
                  <View style={styles.warningBullet} />
                  <Text style={styles.warningText}>
                    Bạn sẽ không thể hủy sau khi nhận công việc
                  </Text>
                </View>
                
                <View style={styles.warningItem}>
                  <View style={styles.warningBullet} />
                  <Text style={styles.warningText}>
                    Bạn phải cam kết hoàn thành công việc đúng thời gian
                  </Text>
                </View>
              </View>

              {/* Contact Section */}
              <View style={styles.contactSection}>
                <View style={styles.contactHeader}>
                  <Text style={styles.contactTitle}>📞 Nếu có thắc mắc, liên hệ:</Text>
                </View>

                <TouchableOpacity 
                  style={styles.contactItem}
                  onPress={handleContactHotline}
                >
                  <Ionicons name="call-outline" size={18} color="#2196F3" />
                  <Text style={styles.contactLabel}>Hotline:</Text>
                  <Text style={styles.contactValue}>0825371577</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.contactItem}
                  onPress={handleContactZalo}
                >
                  <Ionicons name="chatbubble-outline" size={18} color="#2196F3" />
                  <Text style={styles.contactLabel}>Zalo:</Text>
                  <Text style={styles.contactValue}>0342287853 (Minh That)</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.contactItem}
                  onPress={handleContactEmail}
                >
                  <Ionicons name="mail-outline" size={18} color="#2196F3" />
                  <Text style={styles.contactLabel}>Email:</Text>
                  <Text style={styles.contactValue}>mthat456@gmail.com</Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelConfirm}
                  disabled={accepting}
                >
                  <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmButton, accepting && styles.confirmButtonDisabled]}
                  onPress={handleConfirmAccept}
                  disabled={accepting}
                >
                  {accepting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Xác nhận</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statsText: {
    fontSize: 14,
    color: '#757575',
  },
  statsHighlight: {
    fontWeight: '700',
    color: '#4CAF50',
  },
  statsPage: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0E0E0',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 6,
  },
  timeAgoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeAgo: {
    fontSize: 13,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F57C00',
  },
  infoSection: {
    gap: 14,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#9E9E9E',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#212121',
    fontWeight: '600',
    lineHeight: 20,
  },
  noteContainer: {
    backgroundColor: '#FFF3E0',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteLabel: {
    fontSize: 13,
    color: '#F57C00',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteText: {
    fontSize: 14,
    color: '#5D4037',
    lineHeight: 21,
    fontWeight: '500',
  },
  serviceCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  serviceIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
  },
  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  serviceDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#81C784',
  },
  serviceMetaText: {
    fontSize: 13,
    color: '#4E4E4E',
    fontWeight: '600',
  },
  servicePriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E7D32',
  },
  imagesSection: {
    marginBottom: 16,
  },
  imagesSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#616161',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookingImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#E0E0E0',
    borderWidth: 1,
    borderColor: '#BDBDBD',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  acceptButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#424242',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#757575',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#757575',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#212121',
    textAlign: 'center',
  },
  warningSection: {
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#C62828',
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  warningBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F44336',
    marginTop: 6,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#B71C1C',
    lineHeight: 20,
    fontWeight: '500',
  },
  contactSection: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
  },
  contactValue: {
    flex: 1,
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  bookingInfoSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  bookingInfoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 12,
  },
  bookingInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  bookingInfoLabel: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
    width: 100,
  },
  bookingInfoValue: {
    flex: 1,
    fontSize: 14,
    color: '#212121',
    fontWeight: '600',
  },
  bookingInfoValueHighlight: {
    flex: 1,
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#616161',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
});

export default AvailableBookingsScreen;
