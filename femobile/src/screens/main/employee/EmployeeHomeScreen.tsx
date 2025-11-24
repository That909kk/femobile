import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Button } from '../../../components';
import { useAuth, useEnsureValidToken, useUserInfo } from '../../../hooks';
import { COLORS, UI } from '../../../constants';
import { colors, responsive } from '../../../styles';
import { useNotificationStore } from '../../../store/notificationStore';
import {
  employeeAssignmentService,
  type EmployeeAssignment,
} from '../../../services';

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat('vi-VN').format(value || 0)} VND`;

const parseBookingTime = (bookingTime?: string) => {
  if (!bookingTime) return null;
  const date = new Date(bookingTime);
  return Number.isNaN(date.getTime()) ? null : date;
};

const combineDateTime = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return null;
  const isoCandidate = timeStr ? `${dateStr}T${timeStr}` : dateStr;
  const date = new Date(isoCandidate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (date?: Date | null) => {
  if (!date) return '--';
  return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const EmployeeDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const ensureValidToken = useEnsureValidToken();
  const { user, logout } = useAuth();
  const { userInfo } = useUserInfo();

  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([]);
  const [statistics, setStatistics] = useState<{
    todayCount: number;
    upcomingCount: number;
    inProgressCount: number;
    completedCount: number;
    totalRevenue: number;
  }>({ todayCount: 0, upcomingCount: 0, inProgressCount: 0, completedCount: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasServerError = useRef(false);
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const unreadCount = useNotificationStore(state => state.unreadCount);
  const getUnreadCount = useNotificationStore(state => state.getUnreadCount);

  // Lấy employeeId từ user object (giống như web)
  const employeeId = user && 'employeeId' in user 
    ? (user as any).employeeId 
    : userInfo?.id;
  
  const userAvatar = userInfo?.avatar || (user && 'avatar' in user ? (user as any).avatar : undefined);
  const userFullName = userInfo?.fullName || user?.fullName || user?.username || 'Nhân viên';
  
  console.log('[EmployeeDashboard] 🔑 EmployeeId:', employeeId);
  console.log('[EmployeeDashboard] 👤 User:', user);

  // Refresh unread count when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[EmployeeHomeScreen] 🔔 Screen focused, refreshing unread count');
      getUnreadCount();
    }, [getUnreadCount]),
  );

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    if (!employeeId) {
      setLoading(false);
      setError('Không tìm thấy thông tin nhân viên');
      return;
    }

    // Không gọi lại API nếu đã có lỗi server (500)
    if (hasServerError.current) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await ensureValidToken.ensureValidToken();

      const assignmentData = await employeeAssignmentService.getAssignments(employeeId, {
        size: 50,
        sort: 'scheduledDate,asc',
      });

      console.log('[EmployeeDashboard] 📊 API Response - Assignments:', assignmentData?.length || 0);

      setAssignments(assignmentData || []);
      
      // Tính toán statistics từ assignments data (fallback vì API statistics chưa có)
      const today = new Date().toISOString().split('T')[0];
      const todayAssignments = (assignmentData || []).filter(a => {
        const bookingDate = a.bookingTime?.split(' ')[0];
        return bookingDate === today;
      });
      const upcomingAssignments = (assignmentData || []).filter(a => a.status === 'ASSIGNED');
      const inProgressAssignments = (assignmentData || []).filter(a => a.status === 'IN_PROGRESS');
      const completedAssignments = (assignmentData || []).filter(a => a.status === 'COMPLETED');
      const totalRevenue = completedAssignments.reduce((sum, a) => sum + (a.totalAmount || 0), 0);

      setStatistics({
        todayCount: todayAssignments.length,
        upcomingCount: upcomingAssignments.length,
        inProgressCount: inProgressAssignments.length,
        completedCount: completedAssignments.length,
        totalRevenue,
      });

      console.log('[EmployeeDashboard] 📊 Statistics calculated:', {
        todayCount: todayAssignments.length,
        upcomingCount: upcomingAssignments.length,
        inProgressCount: inProgressAssignments.length,
        completedCount: completedAssignments.length,
        totalRevenue,
      });
      hasServerError.current = false; // Reset error flag khi thành công
    } catch (error: any) {
      console.error('Employee dashboard data error:', error);
      
      // Xử lý lỗi 401/403 - Token hết hạn hoặc không có quyền
      if (error?.status === 401 || error?.status === 403) {
        setError('Phiên đăng nhập đã hết hạn. Đang đăng xuất...');
        hasServerError.current = true;
        // Delay 1 giây để user đọc message, sau đó logout
        setTimeout(async () => {
          await logout();
        }, 1000);
      } else if (error?.status === 500) {
        // Lỗi server - dừng retry
        hasServerError.current = true;
        setError('Server đang gặp sự cố. Vui lòng thử lại sau.');
      } else {
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = useCallback(async (isRefreshing = false) => {
    if (!employeeId) {
      return;
    }

    // Không gọi lại API nếu đã có lỗi server (500) và không phải refresh
    if (hasServerError.current && !isRefreshing) {
      return;
    }

    try {
      if (isRefreshing) {
        setRefreshing(true);
      }
      setError(null);

      await ensureValidToken.ensureValidToken();

      const assignmentData = await employeeAssignmentService.getAssignments(employeeId, {
        size: 50,
        sort: 'scheduledDate,asc',
      });

      setAssignments(assignmentData || []);
      hasServerError.current = false; // Reset error flag khi thành công
    } catch (error: any) {
      console.error('Employee dashboard data error:', error);
      
      // Xử lý lỗi 401/403 - Token hết hạn hoặc không có quyền
      if (error?.status === 401 || error?.status === 403) {
        setError('Phiên đăng nhập đã hết hạn. Đang đăng xuất...');
        hasServerError.current = true;
        // Delay 1 giây để user đọc message, sau đó logout
        setTimeout(async () => {
          await logout();
        }, 1000);
      } else if (error?.status === 500) {
        // Lỗi server - dừng retry
        hasServerError.current = true;
        setError('Server đang gặp sự cố. Vui lòng thử lại sau.');
      } else {
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      }
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  }, [employeeId, ensureValidToken, logout]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      contentOpacity.setValue(0);
    }
  }, [loading, contentOpacity]);

  const upcomingAssignments = useMemo(
    () =>
      assignments.filter((assignment) => assignment.status === 'ASSIGNED').sort((a, b) => {
        const first = parseBookingTime(a.bookingTime)?.getTime() ?? 0;
        const second = parseBookingTime(b.bookingTime)?.getTime() ?? 0;
        return first - second;
      }),
    [assignments],
  );

  const inProgressAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'IN_PROGRESS'),
    [assignments],
  );

  const nextAssignment =
    upcomingAssignments[0] ??
    inProgressAssignments.slice().sort((a, b) => {
      const first = parseBookingTime(a.bookingTime)?.getTime() ?? 0;
      const second = parseBookingTime(b.bookingTime)?.getTime() ?? 0;
      return first - second;
    })[0] ??
    null;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard(true);
  }, [fetchDashboard]);

  const statsCards = [
    {
      key: 'today' as const,
      label: 'Ca hôm nay',
      value: statistics.todayCount,
      icon: 'time-outline' as const,
      accent: COLORS.accent,
      isCurrency: false,
    },
    {
      key: 'upcoming' as const,
      label: 'Sắp tới',
      value: statistics.upcomingCount,
      icon: 'calendar-outline' as const,
      accent: COLORS.secondaryLight,
      isCurrency: false,
    },
    {
      key: 'inProgress' as const,
      label: 'Đang làm',
      value: statistics.inProgressCount,
      icon: 'play-outline' as const,
      accent: COLORS.secondary,
      isCurrency: false,
    },
    {
      key: 'revenue' as const,
      label: 'Thu nhập',
      value: formatCurrency(statistics.totalRevenue),
      icon: 'wallet-outline' as const,
      accent: COLORS.primaryLight,
      isCurrency: true,
    },
  ];

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status !== 'COMPLETED').slice(0, 5),
    [assignments],
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.userInfo}>
          <Image
            source={{
              uri: userAvatar || 'https://picsum.photos/40/40?random=1',
            }}
            style={styles.avatar}
          />
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>Xin chào</Text>
            <Text style={styles.userName}>{userFullName}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => {
            console.log('[EmployeeHomeScreen] 🔔 Notification bell tapped, unreadCount:', unreadCount);
            navigation.navigate('EmployeeNotifications');
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="notifications-outline"
            size={responsive.moderateScale(24)}
            color={colors.primary.navy}
          />
          {unreadCount > 0 ? (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          ) : (
            console.log('[EmployeeHomeScreen] 🔔 Badge hidden, unreadCount:', unreadCount) as any
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.walletCard}>
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>
            Bạn đã hoàn thành {statistics.completedCount} công việc trong {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{statistics.todayCount}</Text>
                <Text style={styles.statLabel}>Ca hôm nay</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{statistics.upcomingCount}</Text>
                <Text style={styles.statLabel}>Sắp tới</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{statistics.inProgressCount}</Text>
                <Text style={styles.statLabel}>Đang làm</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderErrorMessage = () => {
    if (!error) return null;
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={20} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={() => {
            hasServerError.current = false;
            loadDashboard();
          }}
        >
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        renderLoading()
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}
          {renderErrorMessage()}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Công việc sắp tới</Text>
              {nextAssignment ? (
                <View style={styles.nextJobCard}>
                  <View style={styles.nextJobHeader}>
                    <Text style={styles.nextJobService}>{nextAssignment.serviceName}</Text>
                    <View style={[styles.statusBadge, getStatusColorStyle(nextAssignment.status)]}>
                      <Text style={[styles.statusBadgeText, getStatusTextStyle(nextAssignment.status)]}>
                        {getAssignmentStatusLabel(nextAssignment.status)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.nextJobMetaRow}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.secondary} />
                    <Text style={styles.nextJobMetaText}>
                      {formatDateTime(parseBookingTime(nextAssignment.bookingTime))}
                    </Text>
                  </View>
                  <View style={styles.nextJobMetaRow}>
                    <Ionicons name="location-outline" size={16} color={COLORS.secondary} />
                    <Text style={styles.nextJobMetaText} numberOfLines={2}>
                      {nextAssignment.serviceAddress}
                    </Text>
                  </View>
                  <View style={styles.nextJobFooter}>
                    <Text style={styles.nextJobPrice}>{formatCurrency(nextAssignment.totalAmount)}</Text>
                    <Button
                      title="Chi tiết"
                      variant="outline"
                      size="small"
                      onPress={() => navigation.navigate('Requests')}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.emptyStateCard}>
                  <Ionicons name="sunny-outline" size={32} color={COLORS.secondary} />
                  <Text style={styles.emptyStateTitle}>Chưa có lịch sắp tới</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Nhận các yêu cầu mới để tăng thu nhập ngay hôm nay.
                  </Text>
                  <Button title="Xem yêu cầu" onPress={() => navigation.navigate('Requests')} fullWidth />
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bài đăng mới</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Work')}>
                  <Text style={styles.sectionActionText}>Xem tất cả</Text>
                </TouchableOpacity>
              </View>
              {assignments.filter(a => a.status === 'ASSIGNED').length === 0 ? (
                <View style={styles.emptyInlineCard}>
                  <Text style={styles.emptyInlineText}>Không có bài đăng đang chờ</Text>
                </View>
              ) : (
                assignments.filter(a => a.status === 'ASSIGNED').slice(0, 3).map((booking, index) => (
                  <View key={booking.assignmentId || `booking-${index}`} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <Text style={styles.requestService}>{booking.serviceName}</Text>
                      <Text style={styles.requestPrice}>
                        {booking.totalAmount ? formatCurrency(booking.totalAmount) : 'Liên hệ'}
                      </Text>
                    </View>
                    <Text style={styles.requestCustomer}>#{booking.bookingCode}</Text>
                    <View style={styles.requestMetaRow}>
                      <Ionicons name="calendar-outline" size={14} color={COLORS.text.secondary} />
                      <Text style={styles.requestMetaText}>
                        {booking.bookingTime ? new Date(booking.bookingTime).toLocaleDateString('vi-VN') : 'N/A'} ·{' '}
                        {booking.bookingTime ? new Date(booking.bookingTime).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.requestMetaRow}>
                      <Ionicons name="location-outline" size={14} color={COLORS.text.secondary} />
                      <Text style={styles.requestMetaText} numberOfLines={1}>
                        {booking.serviceAddress}
                      </Text>
                    </View>
                    <View style={styles.requestActions}>
                      <Button
                        title="Nhận việc"
                        onPress={() => navigation.navigate('Work')}
                        size="small"
                        fullWidth
                      />
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Công việc đang hoạt động</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
                  <Text style={styles.sectionActionText}>Xem lịch</Text>
                </TouchableOpacity>
              </View>
              {activeAssignments.length === 0 ? (
                <View style={styles.emptyInlineCard}>
                  <Text style={styles.emptyInlineText}>Bạn không có công việc nào đang mở</Text>
                </View>
              ) : (
                activeAssignments.map((assignment) => {
                  const startDate = parseBookingTime(assignment.bookingTime);
                  return (
                    <View key={assignment.assignmentId} style={styles.assignmentCard}>
                      <View style={styles.assignmentHeader}>
                        <Text style={styles.assignmentService}>{assignment.serviceName}</Text>
                        <View style={[styles.statusPill, getStatusColorStyle(assignment.status)]}>
                          <Text style={[styles.statusPillText, getStatusTextStyle(assignment.status)]}>
                            {getAssignmentStatusLabel(assignment.status)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.assignmentCustomer}>{assignment.customerName}</Text>
                      <View style={styles.assignmentMetaRow}>
                        <Ionicons name="calendar-outline" size={14} color={COLORS.text.secondary} />
                        <Text style={styles.assignmentMetaText}>
                          {formatDateTime(startDate)} · {assignment.estimatedDurationHours} giờ
                        </Text>
                      </View>
                      <View style={styles.assignmentMetaRow}>
                        <Ionicons name="location-outline" size={14} color={COLORS.text.secondary} />
                        <Text style={styles.assignmentMetaText} numberOfLines={2}>
                          {assignment.serviceAddress}
                        </Text>
                      </View>
                      <View style={styles.assignmentFooter}>
                        <Text style={styles.assignmentPrice}>{formatCurrency(assignment.totalAmount)}</Text>
                        <Button
                          title="Cập nhật"
                          size="small"
                          variant="outline"
                          onPress={() => navigation.navigate('Schedule')}
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Phần tính năng đang phát triển */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thống kê hiệu suất</Text>
              <View style={styles.placeholderCard}>
                <Ionicons name="bar-chart-outline" size={24} color={colors.highlight.teal} />
                <Text style={styles.placeholderText}>Tính năng đang được phát triển</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Phần thưởng & Khuyến mãi</Text>
              <View style={styles.placeholderCard}>
                <Ionicons name="gift-outline" size={24} color={colors.highlight.teal} />
                <Text style={styles.placeholderText}>Tính năng đang được phát triển</Text>
              </View>
            </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const getAssignmentStatusLabel = (status: EmployeeAssignment['status']) => {
  switch (status) {
    case 'ASSIGNED':
      return 'Đã nhận việc';
    case 'IN_PROGRESS':
      return 'Đang làm';
    case 'COMPLETED':
      return 'Hoàn thành';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return status;
  }
};

const getStatusColorStyle = (status: EmployeeAssignment['status']) => {
  switch (status) {
    case 'IN_PROGRESS':
      return { backgroundColor: COLORS.secondary + '22' };
    case 'COMPLETED':
      return { backgroundColor: COLORS.success + '22' };
    case 'CANCELLED':
      return { backgroundColor: COLORS.error + '22' };
    default:
      return { backgroundColor: COLORS.accent };
  }
};

const getStatusTextStyle = (status: EmployeeAssignment['status']) => {
  switch (status) {
    case 'IN_PROGRESS':
      return { color: COLORS.secondary };
    case 'COMPLETED':
      return { color: COLORS.success };
    case 'CANCELLED':
      return { color: COLORS.error };
    default:
      return { color: COLORS.text.primary };
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: UI.SCREEN_PADDING,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: colors.warm.beige,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundDark,
  },
  greetingContainer: {
    gap: 2,
  },
  greetingText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: COLORS.text.inverse,
    fontSize: 10,
    fontWeight: '700',
  },
  walletCard: {
    padding: 16,
    borderRadius: UI.BORDER_RADIUS.medium,
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  walletInfo: {
    gap: 12,
  },
  walletLabel: {
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary.navy,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.neutral.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.neutral.border,
    marginHorizontal: 8,
  },
  skillTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.highlight.teal + '15',
  },
  skillTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.highlight.teal,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginHorizontal: UI.SCREEN_PADDING,
    marginTop: 16,
    borderRadius: UI.BORDER_RADIUS.medium,
    backgroundColor: COLORS.error + '15',
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: colors.primary.navy,
    fontWeight: '600',
  },
  sectionActionText: {
    fontSize: 13,
    color: colors.highlight.teal,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flexBasis: '48%',
    padding: 16,
    borderRadius: UI.BORDER_RADIUS.medium,
    ...UI.SHADOW.small,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  nextJobCard: {
    padding: 18,
    borderRadius: 12,
    backgroundColor: colors.neutral.white,
    gap: 12,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  nextJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextJobService: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  nextJobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextJobMetaText: {
    fontSize: 13,
    color: colors.neutral.textSecondary,
    flex: 1,
  },
  nextJobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  nextJobPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.highlight.teal,
  },
  emptyStateCard: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    gap: 12,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral.textPrimary,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },
  emptyInlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyInlineText: {
    flex: 1,
    fontSize: 13,
    color: colors.neutral.textSecondary,
    fontWeight: '500',
  },
  requestCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.neutral.white,
    gap: 10,
    marginBottom: 10,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestService: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral.textPrimary,
  },
  requestPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.highlight.teal,
  },
  requestCustomer: {
    fontSize: 13,
    color: colors.neutral.textSecondary,
  },
  requestMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestMetaText: {
    fontSize: 12,
    color: colors.neutral.textSecondary,
  },
  requestActions: {
    marginTop: 4,
  },
  assignmentCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.neutral.white,
    gap: 10,
    marginBottom: 10,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentService: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral.textPrimary,
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  assignmentCustomer: {
    fontSize: 13,
    color: colors.neutral.textSecondary,
  },
  assignmentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assignmentMetaText: {
    fontSize: 12,
    color: colors.neutral.textSecondary,
    flex: 1,
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  assignmentPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.highlight.teal,
  },
  placeholderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  placeholderText: {
    flex: 1,
    fontSize: 13,
    color: colors.neutral.textSecondary,
    fontWeight: '500',
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
});
