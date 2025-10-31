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
import { useNavigation } from '@react-navigation/native';
import { Button } from '../../../components';
import { useAuth, useEnsureValidToken, useUserInfo } from '../../../hooks';
import { COLORS, UI } from '../../../constants';
import {
  employeeAssignmentService,
  type EmployeeAssignment,
  type AvailableBookingDetail,
} from '../../../services';

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat('vi-VN').format(value || 0)} VND`;

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
  const [availableBookings, setAvailableBookings] = useState<AvailableBookingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasServerError = useRef(false);
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const employeeId =
    userInfo?.id || (user && 'employeeId' in user ? (user as any).employeeId : undefined);
  
  const userAvatar = userInfo?.avatar || (user && 'avatar' in user ? (user as any).avatar : undefined);
  const userFullName = userInfo?.fullName || user?.fullName || user?.username || 'Nhân viên';

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

      const [assignmentData, availableData] = await Promise.all([
        employeeAssignmentService.getAssignments(employeeId, {
          size: 50,
          sort: 'scheduledDate,asc',
        }),
        employeeAssignmentService
          .getAvailableBookings(employeeId, { size: 10 })
          .then((res) => res.data || [])
          .catch(() => []),
      ]);

      setAssignments(assignmentData || []);
      setAvailableBookings(availableData || []);
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

      const [assignmentData, requestsData] = await Promise.all([
        employeeAssignmentService.getAssignments(employeeId, {
          size: 50,
          sort: 'scheduledDate,asc',
        }),
        employeeAssignmentService
          .getAvailableBookings(employeeId, { size: 10 })
          .then((res) => res.data || [])
          .catch(() => []),
      ]);

      setAssignments(assignmentData || []);
      setAvailableBookings(requestsData || []);
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
        const first = combineDateTime(a.scheduledDate, a.scheduledTime)?.getTime() ?? 0;
        const second = combineDateTime(b.scheduledDate, b.scheduledTime)?.getTime() ?? 0;
        return first - second;
      }),
    [assignments],
  );

  const inProgressAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'IN_PROGRESS'),
    [assignments],
  );

  const completedAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'COMPLETED'),
    [assignments],
  );

  const nextAssignment =
    upcomingAssignments[0] ??
    inProgressAssignments.slice().sort((a, b) => {
      const first = combineDateTime(a.scheduledDate, a.scheduledTime)?.getTime() ?? 0;
      const second = combineDateTime(b.scheduledDate, b.scheduledTime)?.getTime() ?? 0;
      return first - second;
    })[0] ??
    null;

  const totalRevenue = useMemo(
    () => completedAssignments.reduce((sum, assignment) => sum + (assignment.price || 0), 0),
    [completedAssignments],
  );

  const todayAssignmentCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return assignments.filter((assignment) => assignment.scheduledDate === today).length;
  }, [assignments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard(true);
  }, [fetchDashboard]);

  const statsCards = [
    {
      key: 'today' as const,
      label: 'Ca hom nay',
      value: todayAssignmentCount,
      icon: 'time-outline' as const,
      accent: COLORS.accent,
      isCurrency: false,
    },
    {
      key: 'upcoming' as const,
      label: 'Sap toi',
      value: upcomingAssignments.length,
      icon: 'calendar-outline' as const,
      accent: COLORS.secondaryLight,
      isCurrency: false,
    },
    {
      key: 'inProgress' as const,
      label: 'Dang lam',
      value: inProgressAssignments.length,
      icon: 'play-outline' as const,
      accent: COLORS.secondary,
      isCurrency: false,
    },
    {
      key: 'revenue' as const,
      label: 'Thu nhap',
      value: formatCurrency(totalRevenue),
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
          onPress={() => navigation.navigate('NotificationList')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <View style={styles.walletCard}>
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>
            Bạn đã hoàn thành {completedAssignments.length} công việc trong tháng này
          </Text>
          {!!userInfo?.skills?.length && (
            <View style={styles.skillTags}>
              {userInfo.skills.slice(0, 3).map((skill) => (
                <View key={skill} style={styles.skillTag}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                  <Text style={styles.skillTagText}>{skill}</Text>
                </View>
              ))}
            </View>
          )}
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

          <Animated.View style={[styles.contentWrapper, { opacity: contentOpacity }]}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tổng quan</Text>
              <View style={styles.statsGrid}>
                {statsCards.map((card) => (
                  <View key={card.key} style={[styles.statCard, { backgroundColor: card.accent }]}>
                    <View style={styles.statIcon}>
                      <Ionicons name={card.icon as any} size={20} color={COLORS.text.inverse} />
                    </View>
                    <Text style={styles.statValue}>
                      {card.isCurrency ? card.value : String(card.value)}
                    </Text>
                    <Text style={styles.statLabel}>{card.label}</Text>
                  </View>
                ))}
              </View>
            </View>

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
                      {formatDateTime(combineDateTime(nextAssignment.scheduledDate, nextAssignment.scheduledTime))}
                    </Text>
                  </View>
                  <View style={styles.nextJobMetaRow}>
                    <Ionicons name="location-outline" size={16} color={COLORS.secondary} />
                    <Text style={styles.nextJobMetaText} numberOfLines={2}>
                      {nextAssignment.address}
                    </Text>
                  </View>
                  <View style={styles.nextJobFooter}>
                    <Text style={styles.nextJobPrice}>{formatCurrency(nextAssignment.price)}</Text>
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
                <TouchableOpacity onPress={() => navigation.navigate('AvailableBookings')}>
                  <Text style={styles.sectionActionText}>Xem tất cả</Text>
                </TouchableOpacity>
              </View>
              {availableBookings.length === 0 ? (
                <View style={styles.emptyInlineCard}>
                  <Text style={styles.emptyInlineText}>Không có bài đăng đang chờ</Text>
                </View>
              ) : (
                availableBookings.slice(0, 3).map((booking) => (
                  <View key={booking.detailId} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <Text style={styles.requestService}>{booking.serviceName}</Text>
                      <Text style={styles.requestPrice}>
                        {booking.price ? formatCurrency(booking.price) : 'Liên hệ'}
                      </Text>
                    </View>
                    <Text style={styles.requestCustomer}>#{booking.bookingCode}</Text>
                    <View style={styles.requestMetaRow}>
                      <Ionicons name="calendar-outline" size={14} color={COLORS.text.secondary} />
                      <Text style={styles.requestMetaText}>
                        {new Date(booking.bookingTime).toLocaleDateString('vi-VN')} ·{' '}
                        {new Date(booking.bookingTime).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View style={styles.requestMetaRow}>
                      <Ionicons name="location-outline" size={14} color={COLORS.text.secondary} />
                      <Text style={styles.requestMetaText} numberOfLines={1}>
                        {booking.address}
                      </Text>
                    </View>
                    <View style={styles.requestActions}>
                      <Button
                        title="Nhận việc"
                        onPress={() => navigation.navigate('AvailableBookings')}
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
                  const startDate = combineDateTime(assignment.scheduledDate, assignment.scheduledTime);
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
                          {formatDateTime(startDate)} · {assignment.estimatedDuration} giờ
                        </Text>
                      </View>
                      <View style={styles.assignmentMetaRow}>
                        <Ionicons name="location-outline" size={14} color={COLORS.text.secondary} />
                        <Text style={styles.assignmentMetaText} numberOfLines={2}>
                          {assignment.address}
                        </Text>
                      </View>
                      <View style={styles.assignmentFooter}>
                        <Text style={styles.assignmentPrice}>{formatCurrency(assignment.price)}</Text>
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
                <Ionicons name="bar-chart-outline" size={24} color={COLORS.primary} />
                <Text style={styles.placeholderText}>Tính năng đang được phát triển</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Phần thưởng & Khuyến mãi</Text>
              <View style={styles.placeholderCard}>
                <Ionicons name="gift-outline" size={24} color={COLORS.primary} />
                <Text style={styles.placeholderText}>Tính năng đang được phát triển</Text>
              </View>
            </View>
          </Animated.View>
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
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  contentWrapper: {
    gap: 24,
    paddingHorizontal: UI.SCREEN_PADDING,
  },
  header: {
    paddingHorizontal: UI.SCREEN_PADDING,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...UI.SHADOW.small,
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
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  walletCard: {
    padding: 16,
    borderRadius: UI.BORDER_RADIUS.medium,
    backgroundColor: COLORS.primaryLight + '15',
    borderWidth: 1,
    borderColor: COLORS.primaryLight + '30',
  },
  walletInfo: {
    gap: 12,
  },
  walletLabel: {
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
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
    backgroundColor: COLORS.surface,
  },
  skillTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
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
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
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
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.inverse,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.inverse,
    opacity: 0.85,
    marginTop: 2,
  },
  nextJobCard: {
    padding: 18,
    borderRadius: UI.BORDER_RADIUS.large,
    backgroundColor: COLORS.surface,
    gap: 12,
    ...UI.SHADOW.medium,
  },
  nextJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextJobService: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
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
    color: COLORS.text.secondary,
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
    color: COLORS.primary,
  },
  emptyStateCard: {
    padding: 24,
    borderRadius: UI.BORDER_RADIUS.large,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    gap: 12,
    ...UI.SHADOW.small,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  emptyInlineCard: {
    padding: 16,
    borderRadius: UI.BORDER_RADIUS.medium,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  emptyInlineText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  requestCard: {
    padding: 16,
    borderRadius: UI.BORDER_RADIUS.medium,
    backgroundColor: COLORS.surface,
    gap: 10,
    ...UI.SHADOW.small,
    marginBottom: 10,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestService: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  requestPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  requestCustomer: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  requestMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestMetaText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  requestActions: {
    marginTop: 4,
  },
  assignmentCard: {
    padding: 16,
    borderRadius: UI.BORDER_RADIUS.medium,
    backgroundColor: COLORS.surface,
    gap: 10,
    ...UI.SHADOW.small,
    marginBottom: 10,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentService: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
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
    color: COLORS.text.secondary,
  },
  assignmentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assignmentMetaText: {
    fontSize: 12,
    color: COLORS.text.secondary,
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
    color: COLORS.primary,
  },
  placeholderCard: {
    padding: 20,
    borderRadius: UI.BORDER_RADIUS.medium,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    gap: 8,
    ...UI.SHADOW.small,
  },
  placeholderText: {
    fontSize: 13,
    color: COLORS.text.secondary,
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
