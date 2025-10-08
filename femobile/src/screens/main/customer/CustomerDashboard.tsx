import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../../components';
import { useAuth, useEnsureValidToken } from '../../../hooks';
import { useStaticData } from '../../../hooks/useStaticData';
import { COLORS, UI } from '../../../constants';
import type { CustomerData } from '../../../types/auth';
import { 
  customerDashboardService, 
  type CustomerDashboardStats, 
  type UpcomingBooking,
  type RecentBooking
} from '../../../services';

const { width } = Dimensions.get('window');

export const CustomerDashboard: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const { data: staticData } = useStaticData('customer-dashboard');
  const { ensureValidToken } = useEnsureValidToken();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [stats, setStats] = useState<CustomerDashboardStats>({
    upcomingAppointments: 0,
    completedJobs: 0,
    totalSpent: 0,
    membershipLevel: 'Bronze',
    loyaltyPoints: 0,
    thisMonthBookings: 0,
    favoriteServices: [],
    averageRating: 0
  });
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);

  const customer = user as CustomerData;

  // Load dashboard data with mock data
  const loadDashboardData = useCallback(async () => {
    try {
      setDashboardLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data for demonstration
      const mockStats: CustomerDashboardStats = {
        upcomingAppointments: 2,
        completedJobs: 15,
        totalSpent: 2500000,
        membershipLevel: 'Gold',
        loyaltyPoints: 1250,
        thisMonthBookings: 3,
        favoriteServices: ['Tổng vệ sinh', 'Dọn nhà định kỳ'],
        averageRating: 4.8
      };

      const mockUpcomingBookings: UpcomingBooking[] = [
        {
          bookingId: 'BK001',
          serviceName: 'Tổng vệ sinh',
          appointmentDate: '2025-10-08',
          appointmentTime: '09:00',
          employeeName: 'Nguyễn Thị Lan',
          status: 'confirmed',
          address: '123 Nguyễn Văn Cừ, Quận 1, TP.HCM'
        },
        {
          bookingId: 'BK002', 
          serviceName: 'Dọn nhà định kỳ',
          appointmentDate: '2025-10-12',
          appointmentTime: '14:00',
          employeeName: 'Trần Văn Nam',
          status: 'pending',
          address: '456 Lê Văn Sỹ, Quận 3, TP.HCM'
        }
      ];

      const mockRecentBookings: RecentBooking[] = [
        {
          bookingId: 'BK003',
          serviceName: 'Vệ sinh sofa',
          completedDate: '2025-10-02',
          rating: 5,
          amount: 450000,
          employeeName: 'Lê Thị Hoa',
          feedback: 'Dịch vụ rất tốt, nhân viên chuyên nghiệp!'
        },
        {
          bookingId: 'BK004',
          serviceName: 'Tổng vệ sinh',
          completedDate: '2025-09-28',
          rating: 4,
          amount: 800000,
          employeeName: 'Phạm Văn Đức'
        },
        {
          bookingId: 'BK005',
          serviceName: 'Giặt thảm',
          completedDate: '2025-09-25',
          rating: 5,
          amount: 350000,
          employeeName: 'Võ Thị Mai',
          feedback: 'Thảm sạch như mới!'
        }
      ];

      setStats(mockStats);
      setUpcomingBookings(mockUpcomingBookings);
      setRecentBookings(mockRecentBookings);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu dashboard');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getUserDisplayName = () => {
    if (!customer) return 'Customer';
    return customer.fullName || customer.username || 'Customer';
  };

  // Example of how to use token validation before making API calls
  const handleApiCall = async (apiFunction: () => Promise<any>) => {
    try {
      // Ensure we have a valid token before making the API call
      const hasValidToken = await ensureValidToken();
      
      if (!hasValidToken) {
        Alert.alert(
          staticData?.messages?.error || 'Lỗi',
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Proceed with API call if token is valid
      await apiFunction();
    } catch (error) {
      console.warn('API call failed:', error);
      Alert.alert(
        staticData?.messages?.error || 'Lỗi',
        'Có lỗi xảy ra khi thực hiện yêu cầu. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (!staticData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <TouchableOpacity onPress={handleRefresh}>
            <Text>{refreshing ? 'Refreshing...' : ''}</Text>
          </TouchableOpacity>
        }
      >
        {/* Header with Gradient - No logout button */}
        <LinearGradient
          colors={[COLORS.primary, '#6B73FF'] as [string, string]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.greetingText}>
                Chào mừng, {getUserDisplayName()}! 👋
              </Text>
              <Text style={styles.subtitleText}>
                {customer?.email ? `📧 ${customer.email}` : 'Khách hàng thân thiết'}
              </Text>
              <Text style={styles.welcomeMessage}>
                Cấp thành viên: {stats.membershipLevel} • Điểm tích lũy: {stats.loyaltyPoints}
              </Text>
              {customer?.phoneNumber && (
                <Text style={styles.userInfoText}>
                  📱 {customer.phoneNumber}
                </Text>
              )}
            </View>
          </View>

          {/* Customer Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.surface} />
              <Text style={styles.statNumber}>{stats.upcomingAppointments}</Text>
              <Text style={styles.statLabel}>Lịch hẹn</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.surface} />
              <Text style={styles.statNumber}>{stats.completedJobs}</Text>
              <Text style={styles.statLabel}>Hoàn thành</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star-outline" size={20} color={COLORS.surface} />
              <Text style={styles.statNumber}>{stats.loyaltyPoints}</Text>
              <Text style={styles.statLabel}>Điểm thưởng</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Thao tác nhanh</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => console.log('Book service')}
            >
              <Ionicons name="calendar-clear" size={24} color={COLORS.primary} />
              <Text style={styles.quickActionTitle}>Đặt lịch</Text>
              <Text style={styles.quickActionDesc}>Đặt dịch vụ mới</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => console.log('View history')}
            >
              <Ionicons name="time-outline" size={24} color={COLORS.secondary} />
              <Text style={styles.quickActionTitle}>Lịch sử</Text>
              <Text style={styles.quickActionDesc}>Xem đơn hàng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => console.log('Support')}
            >
              <Ionicons name="chatbubbles-outline" size={24} color={COLORS.accent} />
              <Text style={styles.quickActionTitle}>Hỗ trợ</Text>
              <Text style={styles.quickActionDesc}>Liên hệ admin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => console.log('Promotions')}
            >
              <Ionicons name="gift-outline" size={24} color="#E91E63" />
              <Text style={styles.quickActionTitle}>Ưu đãi</Text>
              <Text style={styles.quickActionDesc}>Khuyến mãi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Services Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏠 Dịch vụ phổ biến</Text>
          <View style={styles.servicesGrid}>
            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => console.log('House cleaning')}
            >
              <LinearGradient
                colors={['#E8F5E8', '#C8E6C9']}
                style={styles.serviceCardGradient}
              >
                <Ionicons name="home-outline" size={28} color={COLORS.primary} />
                <Text style={styles.serviceTitle}>Dọn dẹp nhà</Text>
                <Text style={styles.servicePrice}>từ 150k/h</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => console.log('Laundry')}
            >
              <LinearGradient
                colors={['#E3F2FD', '#BBDEFB']}
                style={styles.serviceCardGradient}
              >
                <Ionicons name="shirt-outline" size={28} color={COLORS.secondary} />
                <Text style={styles.serviceTitle}>Giặt ủi</Text>
                <Text style={styles.servicePrice}>từ 20k/kg</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => console.log('Cooking')}
            >
              <LinearGradient
                colors={['#FFF3E0', '#FFE0B2']}
                style={styles.serviceCardGradient}
              >
                <Ionicons name="restaurant-outline" size={28} color={COLORS.accent} />
                <Text style={styles.serviceTitle}>Nấu ăn</Text>
                <Text style={styles.servicePrice}>từ 100k/bữa</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => console.log('Garden care')}
            >
              <LinearGradient
                colors={['#F3E5F5', '#E1BEE7']}
                style={styles.serviceCardGradient}
              >
                <Ionicons name="flower-outline" size={28} color="#9C27B0" />
                <Text style={styles.serviceTitle}>Chăm sóc vườn</Text>
                <Text style={styles.servicePrice}>từ 200k/lần</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Hoạt động gần đây</Text>
          <View style={styles.activityContainer}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Dọn dẹp nhà hoàn thành</Text>
                <Text style={styles.activityTime}>2 giờ trước</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="time-outline" size={20} color={COLORS.warning} />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Lịch hẹn giặt ủi sắp tới</Text>
                <Text style={styles.activityTime}>Ngày mai, 9:00 AM</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="star" size={20} color={COLORS.accent} />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Đánh giá đã gửi</Text>
                <Text style={styles.activityTime}>1 ngày trước</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  welcomeContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: COLORS.surface,
    opacity: 0.9,
    marginBottom: 8,
  },
  welcomeMessage: {
    fontSize: 14,
    color: COLORS.surface,
    opacity: 0.8,
  },
  userInfoText: {
    fontSize: 13,
    color: COLORS.surface,
    opacity: 0.9,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.surface,
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 60) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    ...UI.SHADOW.medium,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 12,
  },
  quickActionDesc: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 60) / 2,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...UI.SHADOW.small,
  },
  serviceCardGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 12,
    textAlign: 'center',
  },
  servicePrice: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  activityContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    ...UI.SHADOW.small,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
});