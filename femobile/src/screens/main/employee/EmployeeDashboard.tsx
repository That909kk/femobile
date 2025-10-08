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
import type { EmployeeData } from '../../../types/auth';
import { 
  employeeDashboardService, 
  type EmployeeDashboardStats, 
  type NextAppointment,
  type RecentActivity
} from '../../../services';

const { width } = Dimensions.get('window');

export const EmployeeDashboard: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const { data: staticData } = useStaticData('employee-dashboard');
  const { ensureValidToken } = useEnsureValidToken();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [stats, setStats] = useState<EmployeeDashboardStats>({
    todayAppointments: 0,
    completedJobs: 0,
    pendingJobs: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    rating: 0,
    totalRatings: 0,
    thisWeekJobs: 0,
    thisMonthJobs: 0
  });
  const [nextAppointment, setNextAppointment] = useState<NextAppointment | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const employee = user as EmployeeData;

  // Load dashboard data with mock data
  const loadDashboardData = useCallback(async () => {
    try {
      setDashboardLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data for demonstration
      const mockStats: EmployeeDashboardStats = {
        todayAppointments: 3,
        completedJobs: 27,
        pendingJobs: 5,
        todayRevenue: 1200000,
        totalRevenue: 15600000,
        rating: 4.7,
        totalRatings: 89,
        thisWeekJobs: 12,
        thisMonthJobs: 42,
        nextAppointment: '2025-10-08T10:00:00'
      };

      const mockNextAppointment: NextAppointment | null = {
        scheduleId: 'SCH001',
        customerName: 'Nguyễn Văn A',
        serviceName: 'Tổng vệ sinh',
        startTime: '2025-10-08T10:00:00',
        address: '123 Lê Lợi, Quận 1, TP.HCM'
      };

      const mockActivities: RecentActivity[] = [
        {
          id: 'ACT001',
          type: 'job_completed',
          title: 'Hoàn thành công việc',
          description: 'Tổng vệ sinh nhà chị Mai - Quận 3',
          timestamp: '2025-10-05T14:30:00'
        },
        {
          id: 'ACT002', 
          type: 'rating_received',
          title: 'Nhận đánh giá 5 sao',
          description: 'Khách hàng Trần Văn B đánh giá dịch vụ',
          timestamp: '2025-10-05T12:15:00'
        },
        {
          id: 'ACT003',
          type: 'new_booking',
          title: 'Có đơn đặt lịch mới',
          description: 'Dọn nhà định kỳ - Chị Lan, Quận 7',
          timestamp: '2025-10-05T09:45:00'
        },
        {
          id: 'ACT004',
          type: 'payment_received',
          title: 'Nhận thanh toán',
          description: 'Thanh toán cho đơn BK12345 - 650,000đ',
          timestamp: '2025-10-04T16:20:00'
        }
      ];

      setStats(mockStats);
      setNextAppointment(mockNextAppointment);
      setRecentActivities(mockActivities);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleLogout = () => {
    Alert.alert(
      staticData?.actions?.logout || 'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: staticData?.actions?.logout || 'Đăng xuất', 
          style: 'destructive',
          onPress: () => logout()
        },
      ]
    );
  };

  const getUserDisplayName = () => {
    if (!employee) return 'Employee';
    return employee.fullName || employee.username || 'Employee';
  };

  // Get current time-based greeting
  const getTimeBasedGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      return staticData?.welcome || 'Good Morning';
    } else if (currentHour < 17) {
      return 'Chào buổi chiều';
    } else {
      return 'Chào buổi tối';
    }
  };

  // Example of how to use token validation before making API calls
  const handleApiCall = async (apiFunction: () => Promise<any>) => {
    try {
      // Ensure we have a valid token before making the API call
      const hasValidToken = await ensureValidToken();
      
      if (!hasValidToken) {
        Alert.alert(
          'Lỗi',
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
        'Lỗi',
        'Có lỗi xảy ra khi thực hiện yêu cầu. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call to refresh data
    await new Promise(resolve => setTimeout(resolve, 1000));
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
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53'] as [string, string]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.greetingText}>
                Chào {getUserDisplayName()}! 💼
              </Text>
              <Text style={styles.subtitleText}>
                {employee?.email ? `📧 ${employee.email}` : 'Nhân viên'}
              </Text>
              <Text style={styles.welcomeMessage}>
                Đánh giá: ⭐ {stats.rating}/5 ({stats.totalRatings} lượt) • Hôm nay: {formatCurrency(stats.todayRevenue)}
              </Text>
              {employee?.phoneNumber && (
                <Text style={styles.userInfoText}>
                  📱 {employee.phoneNumber}
                </Text>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.emergencyButton}
                onPress={() => Alert.alert('Khẩn cấp', 'Tính năng đang phát triển')}
              >
                <Ionicons name="alert-circle" size={20} color={COLORS.surface} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="calendar" size={18} color={COLORS.surface} />
              <Text style={styles.statNumber}>{stats.todayAppointments}</Text>
              <Text style={styles.statLabel}>{staticData.today_stats?.appointments}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.surface} />
              <Text style={styles.statNumber}>{stats.completedJobs}</Text>
              <Text style={styles.statLabel}>{staticData.today_stats?.completed}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={18} color={COLORS.surface} />
              <Text style={styles.statNumber}>{stats.pendingJobs}</Text>
              <Text style={styles.statLabel}>{staticData.today_stats?.pending}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="wallet" size={18} color={COLORS.surface} />
              <Text style={styles.statNumber}>{(stats.todayRevenue / 1000)}K</Text>
              <Text style={styles.statLabel}>{staticData.today_stats?.revenue}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{staticData.quick_actions?.title}</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleApiCall(() => Promise.resolve())}
            >
              <Ionicons name="finger-print" size={28} color="#4CAF50" />
              <Text style={styles.quickActionText}>{staticData.quick_actions?.check_in}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleApiCall(() => Promise.resolve())}
            >
              <Ionicons name="play-circle" size={28} color="#2196F3" />
              <Text style={styles.quickActionText}>{staticData.quick_actions?.start_service}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleApiCall(() => Promise.resolve())}
            >
              <Ionicons name="checkmark-done" size={28} color="#FF9800" />
              <Text style={styles.quickActionText}>{staticData.quick_actions?.complete_task}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleApiCall(() => Promise.resolve())}
            >
              <Ionicons name="cafe" size={28} color="#9C27B0" />
              <Text style={styles.quickActionText}>{staticData.quick_actions?.take_break}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Schedule Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{staticData.schedule_overview?.title}</Text>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <Ionicons name="time-outline" size={24} color={COLORS.primary} />
              <Text style={styles.scheduleTitle}>{staticData.schedule_overview?.next_appointment}</Text>
            </View>
            <Text style={styles.scheduleTime}>
              {nextAppointment ? nextAppointment.startTime : 'Không có lịch hẹn'}
            </Text>
            <Text style={styles.scheduleNote}>Với khách hàng Nguyễn Văn A</Text>
          </View>
        </View>

        {/* Main Sections */}
        <View style={styles.section}>
          <View style={styles.sectionsGrid}>
            {/* Schedule */}
            <TouchableOpacity 
              style={styles.sectionCard}
              onPress={() => handleApiCall(() => Promise.resolve())}
            >
              <View style={styles.sectionIcon}>
                <Ionicons name="calendar-outline" size={32} color="#4CAF50" />
              </View>
              <Text style={styles.sectionCardTitle}>{staticData.sections?.schedule?.title}</Text>
              <Text style={styles.sectionCardSubtitle}>{staticData.sections?.schedule?.subtitle}</Text>
              <Button 
                title={staticData.sections?.schedule?.view_schedule || 'View Schedule'}
                onPress={() => handleApiCall(() => Promise.resolve())}
                variant="outline"
              />
            </TouchableOpacity>

            {/* Customers */}
            <TouchableOpacity 
              style={styles.sectionCard}
              onPress={() => handleApiCall(() => Promise.resolve())}
            >
              <View style={styles.sectionIcon}>
                <Ionicons name="people-outline" size={32} color="#2196F3" />
              </View>
              <Text style={styles.sectionCardTitle}>{staticData.sections?.customers?.title}</Text>
              <Text style={styles.sectionCardSubtitle}>{staticData.sections?.customers?.subtitle}</Text>
              <Button 
                title={staticData.sections?.customers?.view_list || 'View List'}
                onPress={() => handleApiCall(() => Promise.resolve())}
                
                variant="outline"
              />
            </TouchableOpacity>

            {/* Tasks */}
            <TouchableOpacity 
              style={styles.sectionCard}
              onPress={() => handleApiCall(() => Promise.resolve())}
            >
              <View style={styles.sectionIcon}>
                <Ionicons name="list-outline" size={32} color="#FF9800" />
              </View>
              <Text style={styles.sectionCardTitle}>{staticData.sections?.tasks?.title}</Text>
              <Text style={styles.sectionCardSubtitle}>{staticData.sections?.tasks?.subtitle}</Text>
              <Button 
                title={staticData.sections?.tasks?.view_tasks || 'View Tasks'}
                onPress={() => handleApiCall(() => Promise.resolve())}
                
                variant="outline"
              />
            </TouchableOpacity>

            {/* Reports */}
            <TouchableOpacity 
              style={styles.sectionCard}
              onPress={() => handleApiCall(() => Promise.resolve())}
            >
              <View style={styles.sectionIcon}>
                <Ionicons name="bar-chart-outline" size={32} color="#9C27B0" />
              </View>
              <Text style={styles.sectionCardTitle}>{staticData.sections?.reports?.title}</Text>
              <Text style={styles.sectionCardSubtitle}>{staticData.sections?.reports?.subtitle}</Text>
              <Button 
                title={staticData.sections?.reports?.view_reports || 'View Reports'}
                onPress={() => handleApiCall(() => Promise.resolve())}
                
                variant="outline"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Performance Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{staticData.performance?.title}</Text>
          <View style={styles.performanceCard}>
            <View style={styles.performanceItem}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.performanceLabel}>{staticData.performance?.rating}</Text>
              <Text style={styles.performanceValue}>{stats.rating}/5</Text>
            </View>
            <View style={styles.performanceItem}>
              <Ionicons name="heart" size={20} color="#E91E63" />
              <Text style={styles.performanceLabel}>{staticData.performance?.customer_feedback}</Text>
              <Text style={styles.performanceValue}>95%</Text>
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
    paddingBottom: 20,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    fontSize: 22,
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
    fontSize: 13,
    color: COLORS.surface,
    opacity: 0.8,
    fontStyle: 'italic',
  },
  userInfoText: {
    fontSize: 12,
    color: COLORS.surface,
    opacity: 0.9,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyButton: {
    padding: 8,
    marginRight: 8,
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.surface,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.9,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: (width - 60) / 2,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  scheduleCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  scheduleTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  scheduleNote: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  sectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    width: (width - 60) / 2,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionIcon: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  sectionCardSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  performanceCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 6,
    textAlign: 'center',
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 4,
  },
});
