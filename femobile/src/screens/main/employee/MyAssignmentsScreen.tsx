import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth, useEnsureValidToken, useUserInfo } from '../../../hooks';
import { COLORS, UI } from '../../../constants';
import {
  employeeAssignmentService,
  type EmployeeAssignment,
  type AssignmentStatus,
} from '../../../services';

const TEAL_COLOR = '#1bb5a6';

const FILTER_OPTIONS: { label: string; value: AssignmentStatus | 'ALL' }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ nhận', value: 'PENDING' },
  { label: 'Đã nhận', value: 'ASSIGNED' },
  { label: 'Đang làm', value: 'IN_PROGRESS' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
];

interface FilterChipsProps {
  selectedFilter: AssignmentStatus | 'ALL';
  onFilterChange: (filter: AssignmentStatus | 'ALL') => void;
}

const FilterChips = memo<FilterChipsProps>(({ selectedFilter, onFilterChange }) => (
  <View style={styles.filterContainer}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces={false}
      scrollEventThrottle={16}
      contentContainerStyle={styles.filterContent}
    >
      {FILTER_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.filterChip,
            selectedFilter === option.value && styles.filterChipActive,
          ]}
          onPress={() => onFilterChange(option.value)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedFilter === option.value && styles.filterChipTextActive,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
));

FilterChips.displayName = 'FilterChips';

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat('vi-VN').format(value || 0)} VND`;

const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return '';
  
  // Handle format: "2025-11-25 08:00:00"
  const date = new Date(dateTimeStr);
  if (Number.isNaN(date.getTime())) return dateTimeStr;
  
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return '#9E9E9E';
    case 'ASSIGNED':
      return '#FF9800';
    case 'IN_PROGRESS':
      return '#2196F3';
    case 'COMPLETED':
      return '#4CAF50';
    case 'CANCELLED':
      return '#F44336';
    default:
      return '#757575';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'Chờ nhận';
    case 'ASSIGNED':
      return 'Đã nhận';
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

const getStatusPriority = (status: string): number => {
  switch (status) {
    case 'IN_PROGRESS':
      return 1;
    case 'ASSIGNED':
      return 2;
    case 'PENDING':
      return 3;
    case 'CANCELLED':
      return 4;
    case 'COMPLETED':
      return 5;
    default:
      return 6;
  }
};

export const MyAssignmentsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const ensureValidToken = useEnsureValidToken();
  const { user, logout } = useAuth();
  const { userInfo } = useUserInfo();

  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<AssignmentStatus | 'ALL'>('ALL');
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  
  // Reject reason modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingAssignment, setRejectingAssignment] = useState<EmployeeAssignment | null>(null);

  // Accept assignment modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptingAssignment, setAcceptingAssignment] = useState<EmployeeAssignment | null>(null);

  const employeeId =
    userInfo?.id || (user && 'employeeId' in user ? (user as any).employeeId : undefined);

  console.log('[MyAssignments] Component rendered, employeeId:', employeeId);
  console.log('[MyAssignments] Loading:', loading, 'Error:', error);
  console.log('[MyAssignments] Assignments count:', assignments.length);
  console.log('[MyAssignments] Selected filter:', selectedFilter);

  const fetchAssignments = useCallback(async (isFilterChange = false) => {
    if (!employeeId) {
      console.warn('[MyAssignments] No employeeId found');
      setLoading(false);
      return;
    }

    try {
      if (isFilterChange) {
        setIsFilterLoading(true);
      } else if (!refreshing) {
        setLoading(true);
      }
      setError(null);

      await ensureValidToken.ensureValidToken();

      console.log('[MyAssignments] Fetching assignments for employeeId:', employeeId);
      console.log('[MyAssignments] Filter params:', {
        status: selectedFilter !== 'ALL' ? selectedFilter : undefined,
        page: 0,
        size: 50,
      });
      
      const data = await employeeAssignmentService.getAssignments(employeeId, {
        status: selectedFilter !== 'ALL' ? selectedFilter : undefined,
        page: 0,
        size: 50,
        sort: 'scheduledTime,desc',
      });

      console.log('[MyAssignments] ===== API Response =====');
      console.log('[MyAssignments] Total items from API:', data.length);
      console.log('[MyAssignments] Filter applied:', selectedFilter);
      console.log('[MyAssignments] First item:', data[0]?.bookingCode);
      console.log('[MyAssignments] Last item:', data[data.length - 1]?.bookingCode);
      console.log('[MyAssignments] ========================');

      // Sort assignments by status priority
      const sortedData = [...data].sort((a, b) => {
        const priorityA = getStatusPriority(a.status);
        const priorityB = getStatusPriority(b.status);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // If same priority, sort by booking time (closest to current time first)
        const timeA = new Date(a.bookingTime).getTime();
        const timeB = new Date(b.bookingTime).getTime();
        const now = Date.now();
        
        return Math.abs(timeA - now) - Math.abs(timeB - now);
      });

      setAssignments(sortedData);
    } catch (error: any) {
      console.error('[MyAssignments] Fetch error:', error);
      console.error('[MyAssignments] Error status:', error?.status);
      console.error('[MyAssignments] Error message:', error?.message);
      
      // Handle authentication errors
      if (error?.status === 401 || error?.status === 403) {
        setError('Phiên đăng nhập đã hết hạn');
        setTimeout(() => {
          logout();
        }, 1500);
      } else {
        setError(error?.message || 'Không thể tải danh sách công việc');
      }
      setAssignments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsFilterLoading(false);
    }
  }, [employeeId, ensureValidToken, logout, refreshing, selectedFilter]);

  useEffect(() => {
    fetchAssignments(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAssignments(false);
  }, [fetchAssignments]);

  const handleAcceptAssignment = async (assignment: EmployeeAssignment) => {
    if (!employeeId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin nhân viên');
      return;
    }

    setAcceptingAssignment(assignment);
    setShowAcceptModal(true);
  };

  const confirmAcceptAssignment = async () => {
    if (!employeeId || !acceptingAssignment) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin nhân viên');
      return;
    }

    try {
      await ensureValidToken.ensureValidToken();
      await employeeAssignmentService.acceptAssignment(
        acceptingAssignment.assignmentId,
        employeeId,
      );

      setShowAcceptModal(false);
      setAcceptingAssignment(null);

      Alert.alert('Thành công', 'Đã nhận công việc thành công!', [
        {
          text: 'OK',
          onPress: () => fetchAssignments(),
        },
      ]);
    } catch (error: any) {
      console.error('Accept assignment error:', error);
      Alert.alert(
        'Lỗi',
        error?.message || 'Không thể nhận công việc. Vui lòng thử lại.',
      );
    }
  };

  const handleRejectAssignment = (assignment: EmployeeAssignment) => {
    setRejectingAssignment(assignment);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmRejectAssignment = async () => {
    if (!employeeId || !rejectingAssignment) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin nhân viên');
      return;
    }

    if (!rejectReason || rejectReason.trim() === '') {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do từ chối');
      return;
    }

    // Show confirmation alert before rejecting
    Alert.alert(
      'Xác nhận từ chối',
      `Bạn có chắc chắn muốn từ chối công việc này?\n\n` +
        `Dịch vụ: ${rejectingAssignment.serviceName}\n` +
        `Mã booking: ${rejectingAssignment.bookingCode}\n` +
        `Lý do: ${rejectReason.trim()}`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xác nhận từ chối',
          style: 'destructive',
          onPress: async () => {
            try {
              await ensureValidToken.ensureValidToken();
              await employeeAssignmentService.cancelAssignment(
                rejectingAssignment.assignmentId,
                employeeId,
                rejectReason.trim(),
              );

              setShowRejectModal(false);
              setRejectReason('');
              setRejectingAssignment(null);

              Alert.alert('Thành công', 'Đã từ chối công việc thành công!', [
                {
                  text: 'OK',
                  onPress: () => fetchAssignments(true),
                },
              ]);
            } catch (error: any) {
              console.error('Reject assignment error:', error);
              Alert.alert(
                'Lỗi',
                error?.message || 'Không thể từ chối công việc. Vui lòng thử lại.',
              );
            }
          },
        },
      ],
    );
  };

  const handleCancelAssignment = (assignment: EmployeeAssignment) => {
    if (!employeeId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin nhân viên');
      return;
    }

    Alert.alert(
      'Xác nhận hủy công việc',
      `Bạn có chắc muốn hủy công việc "${assignment.serviceName}"?\n\n` +
        `Mã booking: ${assignment.bookingCode}\n` +
        `Khách hàng: ${assignment.customerName}\n` +
        `Thời gian: ${formatDateTime(assignment.bookingTime)}`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy công việc',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Lý do hủy',
              'Vui lòng nhập lý do hủy công việc:',
              async (reason) => {
                if (!reason || reason.trim() === '') {
                  Alert.alert('Lỗi', 'Vui lòng nhập lý do hủy');
                  return;
                }

                try {
                  await ensureValidToken.ensureValidToken();
                  await employeeAssignmentService.cancelAssignment(
                    assignment.assignmentId,
                    employeeId,
                    reason,
                  );

                  Alert.alert('Thành công', 'Đã hủy công việc thành công!', [
                    {
                      text: 'OK',
                      onPress: () => fetchAssignments(),
                    },
                  ]);
                } catch (error: any) {
                  console.error('Cancel assignment error:', error);
                  Alert.alert(
                    'Lỗi',
                    error?.message || 'Không thể hủy công việc. Vui lòng thử lại.',
                  );
                }
              },
              'plain-text',
            );
          },
        },
      ],
    );
  };

  const handleCheckIn = async (assignment: EmployeeAssignment) => {
    if (!employeeId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin nhân viên');
      return;
    }

    Alert.alert(
      'Check-in',
      `Bạn có chắc muốn check-in công việc "${assignment.serviceName}"?\n\n` +
        `Mã booking: ${assignment.bookingCode}\n` +
        `Khách hàng: ${assignment.customerName}\n` +
        `Địa chỉ: ${assignment.serviceAddress || 'N/A'}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Check-in',
          onPress: async () => {
            try {
              await ensureValidToken.ensureValidToken();
              await employeeAssignmentService.checkIn(
                assignment.assignmentId,
                employeeId,
              );

              Alert.alert('Thành công', 'Đã check-in thành công!', [
                {
                  text: 'OK',
                  onPress: () => fetchAssignments(),
                },
              ]);
            } catch (error: any) {
              console.error('Check-in error:', error);
              Alert.alert(
                'Lỗi',
                error?.message || 'Không thể check-in. Vui lòng thử lại.',
              );
            }
          },
        },
      ],
    );
  };

  const handleCheckOut = async (assignment: EmployeeAssignment) => {
    if (!employeeId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin nhân viên');
      return;
    }

    Alert.alert(
      'Check-out',
      `Bạn có chắc muốn check-out công việc "${assignment.serviceName}"?\n\n` +
        `Mã booking: ${assignment.bookingCode}\n` +
        `Khách hàng: ${assignment.customerName}\n` +
        `Địa chỉ: ${assignment.serviceAddress || 'N/A'}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Check-out',
          onPress: async () => {
            try {
              await ensureValidToken.ensureValidToken();
              await employeeAssignmentService.checkOut(
                assignment.assignmentId,
                employeeId,
              );

              Alert.alert('Thành công', 'Đã check-out thành công!', [
                {
                  text: 'OK',
                  onPress: () => fetchAssignments(),
                },
              ]);
            } catch (error: any) {
              console.error('Check-out error:', error);
              Alert.alert(
                'Lỗi',
                error?.message || 'Không thể check-out. Vui lòng thử lại.',
              );
            }
          },
        },
      ],
    );
  };

  const renderAssignmentCard = ({ item }: { item: EmployeeAssignment }) => {
    const isPending = item.status === 'PENDING';
    const canCheckIn = item.status === 'ASSIGNED';
    const canCheckOut = item.status === 'IN_PROGRESS';

    return (
      <View style={styles.assignmentCard}>
        {/* Header với Service Name và Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.serviceName}>{item.serviceName || 'Dịch vụ'}</Text>
            <Text style={styles.bookingCode}>#{item.bookingCode || 'N/A'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.customerSection}>
          <View style={styles.customerRow}>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.customerName || 'Khách hàng'}</Text>
              {item.customerPhone && (
                <Text style={styles.customerPhone}>{item.customerPhone}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Time & Location Section */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar" size={16} color={TEAL_COLOR} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Thời gian</Text>
              <Text style={styles.detailValue}>{formatDateTime(item.bookingTime)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={16} color={TEAL_COLOR} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Địa chỉ</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {item.serviceAddress || 'Chưa có địa chỉ'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {item.estimatedDurationHours ? item.estimatedDurationHours.toFixed(1) : '0.0'} giờ
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={[styles.statItem, styles.priceItem]}>
            <Text style={styles.priceValue}>
              {formatCurrency(item.totalAmount || 0)}
            </Text>
          </View>
        </View>

        {/* Note Section */}
        {item.note && (
          <>
            <View style={styles.divider} />
            <View style={styles.noteSection}>
              <Ionicons name="chatbox-ellipses-outline" size={16} color="#FF9800" />
              <Text style={styles.noteText} numberOfLines={2}>
                {item.note}
              </Text>
            </View>
          </>
        )}

        {/* Action Buttons */}
        {isPending && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptAssignment(item)}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Nhận việc</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectAssignment(item)}
            >
              <Ionicons name="close-circle" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        )}

        {canCheckIn && (
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => handleCheckIn(item)}
          >
            <Ionicons name="location" size={20} color="#FFF" />
            <Text style={styles.checkInButtonText}>Check-in</Text>
          </TouchableOpacity>
        )}

        {canCheckOut && (
          <TouchableOpacity
            style={styles.checkOutButton}
            onPress={() => handleCheckOut(item)}
          >
            <Ionicons name="checkmark-done" size={20} color="#FFF" />
            <Text style={styles.checkOutButtonText}>Check-out</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={TEAL_COLOR} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            fetchAssignments();
          }}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Chips */}
      <FilterChips selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} />

      {/* List */}
      {isFilterLoading ? (
        <View style={styles.centerLoadingContainer}>
          <ActivityIndicator size="large" color={TEAL_COLOR} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={assignments}
          renderItem={renderAssignmentCard}
          keyExtractor={(item) => item.assignmentId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[TEAL_COLOR]}
              tintColor={TEAL_COLOR}
            />
          }
          ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có công việc nào</Text>
            <Text style={styles.emptySubtext}>
              {selectedFilter === 'ALL'
                ? 'Các công việc bạn nhận sẽ xuất hiện ở đây'
                : `Không có công việc với trạng thái "${FILTER_OPTIONS.find(f => f.value === selectedFilter)?.label}"`}
            </Text>
          </View>
        }
        />
      )}

      {/* Reject Reason Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Từ chối công việc</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>
                Vui lòng cho biết lý do để chúng tôi sắp xếp lịch phù hợp hơn trong tương lai.
              </Text>
            </View>

            <Text style={styles.inputLabel}>Lý do từ chối <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Nhập lý do từ chối công việc..."
              placeholderTextColor="#999"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setRejectingAssignment(null);
                }}
              >
                <Text style={styles.cancelModalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  !rejectReason.trim() && styles.confirmButtonDisabled,
                ]}
                onPress={confirmRejectAssignment}
                disabled={!rejectReason.trim()}
              >
                <Text style={[
                  styles.confirmButtonText,
                  !rejectReason.trim() && styles.confirmButtonTextDisabled,
                ]}>Xác nhận từ chối</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Accept Assignment Modal */}
      <Modal
        visible={showAcceptModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAcceptModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.acceptModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Xác nhận nhận việc</Text>
              <TouchableOpacity onPress={() => setShowAcceptModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.acceptModalScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.warningContainer}>
                <Ionicons name="warning" size={24} color="#ff9800" />
                <Text style={styles.warningTitle}>Vui lòng đọc kỹ thông tin trước khi xác nhận</Text>
              </View>

              <View style={styles.importantNotice}>
                <Text style={styles.noticeTitle}>⚠️ Lưu ý quan trọng:</Text>
                
                <View style={styles.noticeItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.noticeText}>
                    Sau khi nhận việc, bạn <Text style={styles.boldText}>KHÔNG THỂ HỦY</Text> công việc này.
                  </Text>
                </View>

                <View style={styles.noticeItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.noticeText}>
                    Hãy đảm bảo bạn có thể hoàn thành công việc đúng thời gian đã hẹn.
                  </Text>
                </View>

                <View style={styles.noticeItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.noticeText}>
                    Việc không thực hiện đúng cam kết sẽ ảnh hưởng đến uy tín của bạn.
                  </Text>
                </View>
              </View>

              <View style={styles.supportInfo}>
                <Text style={styles.supportTitle}>📞 Thông tin liên hệ hỗ trợ:</Text>
                
                <View style={styles.contactItem}>
                  <Ionicons name="call" size={16} color={TEAL_COLOR} />
                  <Text style={styles.contactLabel}>Hotline:</Text>
                  <Text style={styles.contactValue}>0825371577</Text>
                </View>

                <View style={styles.contactItem}>
                  <Ionicons name="logo-whatsapp" size={16} color={TEAL_COLOR} />
                  <Text style={styles.contactLabel}>Zalo:</Text>
                  <Text style={styles.contactValue}>0342287853 (Minh That)</Text>
                </View>

                <View style={styles.contactItem}>
                  <Ionicons name="mail" size={16} color={TEAL_COLOR} />
                  <Text style={styles.contactLabel}>Email:</Text>
                  <Text style={styles.contactValue}>mthat456@gmail.com</Text>
                </View>

                <Text style={styles.supportFooter}>
                  Liên hệ nếu bạn có bất kỳ thắc mắc hoặc vấn đề gì.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setShowAcceptModal(false);
                  setAcceptingAssignment(null);
                }}
              >
                <Text style={styles.cancelModalButtonText}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.acceptConfirmButton]}
                onPress={confirmAcceptAssignment}
              >
                <Text style={styles.acceptConfirmButtonText}>Xác nhận nhận việc</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: UI.SPACING.sm,
  },
  filterContent: {
    paddingHorizontal: UI.SPACING.md,
  },
  filterChip: {
    paddingHorizontal: UI.SPACING.md + 2,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: UI.SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: TEAL_COLOR,
    borderColor: TEAL_COLOR,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UI.SPACING.lg,
  },
  loadingText: {
    marginTop: UI.SPACING.md,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    marginTop: UI.SPACING.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: UI.SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: UI.SPACING.md,
    paddingTop: 0,
    paddingBottom: UI.SPACING.md,
    flexGrow: 1,
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
  assignmentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: UI.SPACING.lg,
    marginTop: UI.SPACING.sm,
    marginBottom: UI.SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: UI.SPACING.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: UI.SPACING.sm,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  bookingCode: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  customerSection: {
    marginBottom: UI.SPACING.sm,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: UI.SPACING.md,
  },
  detailsSection: {
    gap: UI.SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8f5f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UI.SPACING.sm,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 2,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e0e0e0',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  priceItem: {
    flex: 1.2,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: TEAL_COLOR,
  },
  noteSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: UI.SPACING.sm,
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
    gap: UI.SPACING.sm,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  actionButtonsRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: TEAL_COLOR,
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  checkInButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: TEAL_COLOR,
    borderRadius: 8,
    gap: 6,
  },
  checkInButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  checkOutButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    gap: 6,
  },
  checkOutButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: UI.SPACING.md,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F44336',
  },
  centerLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI.SPACING.lg,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: UI.SPACING.lg,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI.SPACING.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  messageContainer: {
    backgroundColor: '#f0f8ff',
    padding: UI.SPACING.md,
    borderRadius: 12,
    marginBottom: UI.SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: TEAL_COLOR,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1a1a1a',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: UI.SPACING.xs,
  },
  required: {
    color: '#F44336',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: UI.SPACING.md,
    fontSize: 14,
    color: '#1a1a1a',
    minHeight: 100,
    marginBottom: UI.SPACING.lg,
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: UI.SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelModalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#F44336',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  confirmButtonTextDisabled: {
    color: '#999',
  },
  acceptModalContent: {
    maxHeight: '85%',
  },
  acceptModalScroll: {
    maxHeight: 450,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: UI.SPACING.md,
    borderRadius: 12,
    marginBottom: UI.SPACING.lg,
    gap: UI.SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  warningTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#e65100',
    lineHeight: 20,
  },
  importantNotice: {
    backgroundColor: '#ffebee',
    padding: UI.SPACING.lg,
    borderRadius: 12,
    marginBottom: UI.SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#c62828',
    marginBottom: UI.SPACING.md,
  },
  noticeItem: {
    flexDirection: 'row',
    marginBottom: UI.SPACING.sm,
    paddingLeft: UI.SPACING.xs,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#F44336',
    marginRight: UI.SPACING.sm,
    fontWeight: '700',
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
    color: '#c62828',
  },
  supportInfo: {
    backgroundColor: '#e8f5e9',
    padding: UI.SPACING.lg,
    borderRadius: 12,
    marginBottom: UI.SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: TEAL_COLOR,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: UI.SPACING.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI.SPACING.sm,
    gap: UI.SPACING.xs,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    minWidth: 60,
  },
  contactValue: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
  },
  supportFooter: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: UI.SPACING.sm,
    lineHeight: 18,
  },
  acceptConfirmButton: {
    backgroundColor: TEAL_COLOR,
  },
  acceptConfirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
