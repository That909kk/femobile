import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Animated,
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
  employeeRequestService,
  type EmployeeAssignment,
  type EmployeeRequest,
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
  const { user } = useAuth();
  const { userInfo } = useUserInfo();

  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([]);
  const [pendingRequests, setPendingRequests] = useState<EmployeeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const employeeId =
    userInfo?.id || (user && 'employeeId' in user ? (user as any).employeeId : undefined);

  const fetchDashboard = useCallback(async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    try {
      if (!refreshing) {
        setLoading(true);
      }

      await ensureValidToken.ensureValidToken();

      const [assignmentData, requestsData] = await Promise.all([
        employeeAssignmentService.getAssignments(employeeId, {
          size: 50,
          sort: 'scheduledDate,asc',
        }),
        employeeRequestService.getPendingRequests(),
      ]);

      setAssignments(assignmentData);
      setPendingRequests(requestsData);
    } catch (error) {
      console.error('Employee dashboard data error:', error);
      Alert.alert('Loi', 'Khong the tai du lieu dashboard nhan vien. Vui long thu lai.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [employeeId, ensureValidToken, refreshing]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
  };

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
      <Text style={styles.loadingText}>Dang tai du lieu...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[COLORS.gradient.secondary[0], COLORS.gradient.secondary[1]]}
        style={styles.heroGradient}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroTextGroup}>
            <Text style={styles.heroGreeting}>
              Xin chao, {userInfo?.fullName ?? 'nhan vien'}
            </Text>
            <Text style={styles.heroSubtitle}>
              Ban da hoan thanh {completedAssignments.length} cong viec trong thang nay
            </Text>
            {!!userInfo?.skills?.length && (
              <View style={styles.skillTags}>
                {userInfo.skills.slice(0, 3).map((skill) => (
                  <View key={skill} style={styles.skillTag}>
                    <Text style={styles.skillTagText}>{skill}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <Button
            title="Xem lich lam"
            onPress={() => navigation.navigate('Schedule')}
            variant="outline"
          />
        </View>
      </LinearGradient>

      {loading ? (
        renderLoading()
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          <Animated.View style={[styles.contentWrapper, { opacity: contentOpacity }]}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tong quan</Text>
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
              <Text style={styles.sectionTitle}>Cong viec sap toi</Text>
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
                      title="Chi tiet"
                      variant="outline"
                      size="small"
                      onPress={() => navigation.navigate('Requests')}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.emptyStateCard}>
                  <Ionicons name="sunny-outline" size={32} color={COLORS.secondary} />
                  <Text style={styles.emptyStateTitle}>Chua co lich sap toi</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Nhan cac yeu cau moi de tang thu nhap ngay hom nay.
                  </Text>
                  <Button title="Xem yeu cau" onPress={() => navigation.navigate('Requests')} fullWidth />
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Yeu cau moi</Text>
              {pendingRequests.length === 0 ? (
                <View style={styles.emptyInlineCard}>
                  <Text style={styles.emptyInlineText}>Khong co yeu cau dang cho</Text>
                </View>
              ) : (
                pendingRequests.slice(0, 3).map((request) => (
                  <View key={request.requestId} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <Text style={styles.requestService}>{request.serviceName}</Text>
                      <Text style={styles.requestPrice}>{formatCurrency(request.price)}</Text>
                    </View>
                    <Text style={styles.requestCustomer}>{request.customerName}</Text>
                    <View style={styles.requestMetaRow}>
                      <Ionicons name="calendar-outline" size={14} color={COLORS.text.secondary} />
                      <Text style={styles.requestMetaText}>
                        {request.bookingDate} · {request.bookingTime}
                      </Text>
                    </View>
                    <View style={styles.requestActions}>
                      <Button
                        title="Nhan viec"
                        onPress={() => navigation.navigate('Requests')}
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
                <Text style={styles.sectionTitle}>Cong viec dang hoat dong</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
                  <Text style={styles.sectionActionText}>Xem lich</Text>
                </TouchableOpacity>
              </View>
              {activeAssignments.length === 0 ? (
                <View style={styles.emptyInlineCard}>
                  <Text style={styles.emptyInlineText}>Ban khong co cong viec nao dang mo</Text>
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
                          {formatDateTime(startDate)} · {assignment.estimatedDuration} gio
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
                          title="Cap nhat"
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
          </Animated.View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const getAssignmentStatusLabel = (status: EmployeeAssignment['status']) => {
  switch (status) {
    case 'ASSIGNED':
      return 'Da nhan viec';
    case 'IN_PROGRESS':
      return 'Dang lam';
    case 'COMPLETED':
      return 'Hoan thanh';
    case 'CANCELLED':
      return 'Da huy';
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
  heroGradient: {
    paddingHorizontal: UI.SCREEN_PADDING,
    paddingTop: 16,
    paddingBottom: 20,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
  },
  heroTextGroup: {
    flex: 1,
    gap: 6,
  },
  heroGreeting: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.inverse,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.text.inverse,
    opacity: 0.85,
  },
  skillTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  skillTag: {
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: UI.SCREEN_PADDING,
    paddingBottom: 32,
    gap: 24,
  },
  contentWrapper: {
    gap: 28,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flexBasis: '48%',
    padding: 18,
    borderRadius: UI.BORDER_RADIUS.large,
    ...UI.SHADOW.small,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.inverse,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.text.inverse,
    opacity: 0.85,
    marginTop: 4,
  },
  nextJobCard: {
    padding: 20,
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
    fontSize: 18,
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
    fontSize: 12,
    fontWeight: '600',
  },
  nextJobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextJobMetaText: {
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  emptyStateSubtitle: {
    fontSize: 14,
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
    padding: 18,
    borderRadius: UI.BORDER_RADIUS.medium,
    backgroundColor: COLORS.surface,
    gap: 10,
    ...UI.SHADOW.small,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestService: {
    fontSize: 16,
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
    padding: 18,
    borderRadius: UI.BORDER_RADIUS.medium,
    backgroundColor: COLORS.surface,
    gap: 10,
    ...UI.SHADOW.small,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentService: {
    fontSize: 16,
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
    fontSize: 12,
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
