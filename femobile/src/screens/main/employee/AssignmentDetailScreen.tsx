import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth, useEnsureValidToken, useUserInfo } from '../../../hooks';
import { COLORS } from '../../../constants';
import { colors } from '../../../styles';
import {
  employeeAssignmentService,
  type EmployeeAssignment,
  type AssignmentStatus,
} from '../../../services';

const { width } = Dimensions.get('window');

// Component đồng hồ bấm giờ khi đang làm việc
const WorkingTimer: React.FC<{ checkInTime: string }> = ({ checkInTime }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkInDate = new Date(checkInTime);
    
    // Cập nhật thời gian mỗi giây
    intervalRef.current = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - checkInDate.getTime();
      setElapsedTime(Math.floor(diff / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkInTime]);

  // Format thời gian thành HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={timerStyles.container}>
      <Ionicons name="timer-outline" size={20} color="#fff" />
      <Text style={timerStyles.text}>{formatTime(elapsedTime)}</Text>
    </View>
  );
};

const timerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196f3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
});

interface RouteParams {
  assignmentId: string;
  assignment?: EmployeeAssignment;
}

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  PENDING: 'Chờ nhận',
  ASSIGNED: 'Đã nhận',
  IN_PROGRESS: 'Đang làm',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLORS: Record<AssignmentStatus, { bg: string; text: string }> = {
  PENDING: { bg: '#f5f5f5', text: '#9e9e9e' },
  ASSIGNED: { bg: '#fff3e0', text: '#ff9800' },
  IN_PROGRESS: { bg: '#e3f2fd', text: '#2196f3' },
  COMPLETED: { bg: '#e8f5e9', text: '#4caf50' },
  CANCELLED: { bg: '#ffebee', text: '#f44336' },
};

export const AssignmentDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { userInfo } = useUserInfo();
  const ensureValidToken = useEnsureValidToken();

  const { assignmentId, assignment: initialAssignment } = route.params as RouteParams;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [assignment, setAssignment] = useState<EmployeeAssignment | null>(initialAssignment || null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check-in/out modal states
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [checkInImages, setCheckInImages] = useState<string[]>([]);
  const [checkOutImages, setCheckOutImages] = useState<string[]>([]);
  const [checkInDescription, setCheckInDescription] = useState('');
  const [checkOutDescription, setCheckOutDescription] = useState('');

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Image preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const employeeId =
    userInfo?.id || (user && 'employeeId' in user ? (user as any).employeeId : undefined);

  const loadAssignmentDetail = useCallback(async () => {
    if (!assignment && !assignmentId) return;
    // For now, we use the passed assignment data
    // TODO: Implement API to get single assignment detail if needed
  }, [assignmentId, assignment]);

  useEffect(() => {
    loadAssignmentDetail();
  }, [loadAssignmentDetail]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssignmentDetail();
    setRefreshing(false);
  };

  const formatDateTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) return '--';
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

  const formatCurrency = (value?: number) => {
    if (value === undefined) return '--';
    return new Intl.NumberFormat('vi-VN').format(value) + ' VND';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Kiểm tra xem có thể check-in không (sớm 10 phút, trễ 5 phút so với giờ hẹn)
  const canCheckIn = useCallback(() => {
    if (!assignment?.bookingTime || assignment.status !== 'ASSIGNED') return false;
    
    const now = new Date();
    const bookingTime = new Date(assignment.bookingTime);
    const earliestCheckIn = new Date(bookingTime.getTime() - 10 * 60000); // -10 phút
    const latestCheckIn = new Date(bookingTime.getTime() + 5 * 60000); // +5 phút
    
    return now >= earliestCheckIn && now <= latestCheckIn;
  }, [assignment?.bookingTime, assignment?.status]);

  // Lấy thời gian check-in sớm nhất và trễ nhất
  const getCheckInTimeRange = useCallback(() => {
    if (!assignment?.bookingTime) return null;
    
    const bookingTime = new Date(assignment.bookingTime);
    const earliestCheckIn = new Date(bookingTime.getTime() - 10 * 60000);
    const latestCheckIn = new Date(bookingTime.getTime() + 5 * 60000);
    
    return {
      earliest: formatTime(earliestCheckIn),
      latest: formatTime(latestCheckIn),
    };
  }, [assignment?.bookingTime]);

  const handleCall = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenMap = (address?: string) => {
    if (!address) return;
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
  };

  const pickImage = async (type: 'checkIn' | 'checkOut') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
      });

      if (result.canceled) return;

      const newImages = result.assets.map(asset => asset.uri);
      
      if (type === 'checkIn') {
        setCheckInImages(prev => [...prev, ...newImages].slice(0, 5));
      } else {
        setCheckOutImages(prev => [...prev, ...newImages].slice(0, 5));
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const takePhoto = async (type: 'checkIn' | 'checkOut') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền sử dụng camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (result.canceled) return;

      const newImage = result.assets[0].uri;
      
      if (type === 'checkIn') {
        setCheckInImages(prev => [...prev, newImage].slice(0, 5));
      } else {
        setCheckOutImages(prev => [...prev, newImage].slice(0, 5));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const removeImage = (type: 'checkIn' | 'checkOut', index: number) => {
    if (type === 'checkIn') {
      setCheckInImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setCheckOutImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Action handlers
  const handleAccept = async () => {
    if (!assignmentId || !employeeId) return;

    try {
      setActionLoading('accept');
      await ensureValidToken.ensureValidToken();
      await employeeAssignmentService.acceptAssignment(assignmentId, employeeId);
      
      setAssignment(prev => prev ? { ...prev, status: 'ASSIGNED' } : null);
      Alert.alert('Thành công', 'Đã nhận công việc');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể nhận công việc');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckIn = async () => {
    if (!assignmentId || !employeeId) return;

    try {
      setActionLoading('checkin');
      await ensureValidToken.ensureValidToken();

      // Convert images to blobs for upload
      const imageBlobs = await Promise.all(
        checkInImages.map(async (uri) => {
          const response = await fetch(uri);
          return response.blob();
        })
      );

      await employeeAssignmentService.checkIn(
        assignmentId,
        employeeId,
        imageBlobs.length > 0 ? imageBlobs : undefined,
        checkInDescription || undefined
      );

      setAssignment(prev => prev ? { 
        ...prev, 
        status: 'IN_PROGRESS',
        checkInTime: new Date().toISOString()
      } : null);
      
      setShowCheckInModal(false);
      setCheckInImages([]);
      setCheckInDescription('');
      Alert.alert('Thành công', 'Check-in thành công! Chúc bạn làm việc hiệu quả.');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể check-in');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async () => {
    if (!assignmentId || !employeeId) return;

    try {
      setActionLoading('checkout');
      await ensureValidToken.ensureValidToken();

      // Convert images to blobs for upload
      const imageBlobs = await Promise.all(
        checkOutImages.map(async (uri) => {
          const response = await fetch(uri);
          return response.blob();
        })
      );

      await employeeAssignmentService.checkOut(
        assignmentId,
        employeeId,
        imageBlobs.length > 0 ? imageBlobs : undefined,
        checkOutDescription || undefined
      );

      setAssignment(prev => prev ? { 
        ...prev, 
        status: 'COMPLETED',
        checkOutTime: new Date().toISOString()
      } : null);
      
      setShowCheckOutModal(false);
      setCheckOutImages([]);
      setCheckOutDescription('');
      Alert.alert('Thành công', 'Check-out thành công! Cảm ơn bạn đã hoàn thành công việc.');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể check-out');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!assignmentId || !employeeId || !cancelReason.trim()) return;

    try {
      setActionLoading('cancel');
      await ensureValidToken.ensureValidToken();
      await employeeAssignmentService.cancelAssignment(assignmentId, employeeId, cancelReason);

      setAssignment(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
      setShowCancelModal(false);
      setCancelReason('');
      Alert.alert('Đã hủy', 'Công việc đã được hủy');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể hủy công việc');
    } finally {
      setActionLoading(null);
    }
  };

  const renderImagePicker = (type: 'checkIn' | 'checkOut') => {
    const images = type === 'checkIn' ? checkInImages : checkOutImages;
    
    return (
      <View style={styles.imagePickerContainer}>
        <Text style={styles.imagePickerLabel}>
          Ảnh minh chứng (tối đa 5 ảnh)
        </Text>
        
        <View style={styles.imageGrid}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imagePreviewContainer}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(type, index)}
              >
                <Ionicons name="close-circle" size={24} color="#f44336" />
              </TouchableOpacity>
            </View>
          ))}
          
          {images.length < 5 && (
            <View style={styles.addImageButtons}>
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={() => takePhoto(type)}
              >
                <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
                <Text style={styles.addImageText}>Chụp ảnh</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={() => pickImage(type)}
              >
                <Ionicons name="images-outline" size={24} color={COLORS.primary} />
                <Text style={styles.addImageText}>Thư viện</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!assignment) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_COLORS[assignment.status];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết công việc</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusConfig.bg }]}>
          <Ionicons 
            name={assignment.status === 'COMPLETED' ? 'checkmark-circle' : 
                  assignment.status === 'IN_PROGRESS' ? 'play-circle' :
                  assignment.status === 'CANCELLED' ? 'close-circle' : 'time'}
            size={24} 
            color={statusConfig.text} 
          />
          <Text style={[styles.statusText, { color: statusConfig.text }]}>
            {STATUS_LABELS[assignment.status]}
          </Text>
        </View>

        {/* Working Timer - hiển thị khi đang làm việc */}
        {assignment.status === 'IN_PROGRESS' && assignment.checkInTime && (
          <View style={styles.timerSection}>
            <WorkingTimer checkInTime={assignment.checkInTime} />
            <Text style={styles.timerHint}>Đang tính thời gian làm việc...</Text>
          </View>
        )}

        {/* Booking Code & Service */}
        <View style={styles.section}>
          <View style={styles.codeContainer}>
            <Text style={styles.bookingCode}>#{assignment.bookingCode}</Text>
            <Text style={styles.serviceName}>{assignment.serviceName}</Text>
          </View>
        </View>

        {/* Time Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Thời gian làm việc</Text>
              <Text style={styles.infoValue}>{formatDateTime(assignment.bookingTime)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Thời lượng dự kiến</Text>
              <Text style={styles.infoValue}>{assignment.estimatedDurationHours} giờ</Text>
            </View>
          </View>
          {assignment.checkInTime && (
            <View style={styles.infoRow}>
              <Ionicons name="log-in-outline" size={20} color={COLORS.success} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Check-in</Text>
                <Text style={[styles.infoValue, { color: COLORS.success }]}>
                  {formatDateTime(assignment.checkInTime)}
                </Text>
              </View>
            </View>
          )}
          {assignment.checkOutTime && (
            <View style={styles.infoRow}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Check-out</Text>
                <Text style={[styles.infoValue, { color: COLORS.primary }]}>
                  {formatDateTime(assignment.checkOutTime)}
                </Text>
              </View>
            </View>
          )}

          {/* Thông tin thời gian check-in cho trạng thái ASSIGNED */}
          {assignment.status === 'ASSIGNED' && assignment.bookingTime && (
            <View style={[
              styles.checkInTimeInfo,
              { backgroundColor: canCheckIn() ? '#e3f2fd' : '#fff3e0' }
            ]}>
              <View style={styles.checkInTimeHeader}>
                <Ionicons 
                  name="time-outline" 
                  size={18} 
                  color={canCheckIn() ? '#2196f3' : '#ff9800'} 
                />
                <Text style={[
                  styles.checkInTimeTitle,
                  { color: canCheckIn() ? '#1976d2' : '#e65100' }
                ]}>
                  Thời gian check-in
                </Text>
              </View>
              {getCheckInTimeRange() && (
                <View style={styles.checkInTimeRanges}>
                  <Text style={styles.checkInTimeText}>
                    • Sớm nhất: <Text style={styles.checkInTimeBold}>{getCheckInTimeRange()?.earliest}</Text> (trước 10 phút)
                  </Text>
                  <Text style={styles.checkInTimeText}>
                    • Muộn nhất: <Text style={styles.checkInTimeBold}>{getCheckInTimeRange()?.latest}</Text> (sau 5 phút)
                  </Text>
                </View>
              )}
              <View style={styles.checkInStatusBadge}>
                <Ionicons 
                  name={canCheckIn() ? 'checkmark-circle' : 'alert-circle'} 
                  size={14} 
                  color={canCheckIn() ? '#4caf50' : '#ff9800'} 
                />
                <Text style={[
                  styles.checkInStatusText,
                  { color: canCheckIn() ? '#2e7d32' : '#e65100' }
                ]}>
                  {canCheckIn() ? 'Có thể check-in ngay bây giờ' : 'Chưa đến thời gian check-in'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerInfo}>
              <Ionicons name="person-circle-outline" size={48} color={COLORS.primary} />
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{assignment.customerName}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ</Text>
          <TouchableOpacity
            style={styles.addressCard}
            onPress={() => handleOpenMap(assignment.serviceAddress)}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={24} color={COLORS.primary} />
            <Text style={styles.addressText}>{assignment.serviceAddress}</Text>
            <Ionicons name="navigate-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentTotalLabel}>Tổng cộng</Text>
              <Text style={styles.paymentTotalValue}>{formatCurrency(assignment.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Note */}
        {assignment.note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú</Text>
            <View style={styles.noteCard}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.text.secondary} />
              <Text style={styles.noteText}>{assignment.note}</Text>
            </View>
          </View>
        )}

        {/* Check-in/out Images */}
        {assignment.checkInImages && assignment.checkInImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ảnh check-in</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {assignment.checkInImages.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setPreviewImage(img.imageUrl)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: img.imageUrl }} style={styles.evidenceImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {assignment.checkOutImages && assignment.checkOutImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ảnh check-out</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {assignment.checkOutImages.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setPreviewImage(img.imageUrl)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: img.imageUrl }} style={styles.evidenceImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {(assignment.status === 'PENDING' || assignment.status === 'ASSIGNED' || assignment.status === 'IN_PROGRESS') && (
        <View style={styles.actionContainer}>
          {assignment.status === 'PENDING' && (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.primaryButton, styles.acceptButton]}
                onPress={handleAccept}
                disabled={!!actionLoading}
              >
                {actionLoading === 'accept' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>Nhận việc</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, styles.cancelButton]}
                onPress={() => setShowCancelModal(true)}
                disabled={!!actionLoading}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.error} />
                <Text style={[styles.secondaryButtonText, { color: COLORS.error }]}>Hủy</Text>
              </TouchableOpacity>
            </View>
          )}

          {assignment.status === 'ASSIGNED' && (
            <TouchableOpacity
              style={[
                styles.primaryButton, 
                styles.checkInButton,
                styles.fullWidthButton,
                !canCheckIn() && styles.disabledButton
              ]}
              onPress={() => {
                if (!canCheckIn()) {
                  Alert.alert(
                    'Chưa đến thời gian',
                    'Bạn chỉ có thể check-in trong khoảng từ 10 phút trước đến 5 phút sau giờ hẹn.',
                    [{ text: 'OK' }]
                  );
                  return;
                }
                setShowCheckInModal(true);
              }}
              disabled={!!actionLoading}
            >
              <Ionicons name="log-in" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Check-in</Text>
            </TouchableOpacity>
          )}

          {assignment.status === 'IN_PROGRESS' && (
            <TouchableOpacity
              style={[styles.primaryButton, styles.checkOutButton, styles.fullWidthButton]}
              onPress={() => setShowCheckOutModal(true)}
              disabled={!!actionLoading}
            >
              {actionLoading === 'checkout' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="log-out" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Check-out</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Check-in Modal */}
      <Modal
        visible={showCheckInModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCheckInModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCheckInModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Check-in</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {renderImagePicker('checkIn')}
            
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Mô tả (tùy chọn)</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Ghi chú khi bắt đầu công việc..."
                value={checkInDescription}
                onChangeText={setCheckInDescription}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.primaryButton, styles.checkInButton, { flex: 1 }]}
              onPress={handleCheckIn}
              disabled={!!actionLoading}
            >
              {actionLoading === 'checkin' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Xác nhận Check-in</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Check-out Modal */}
      <Modal
        visible={showCheckOutModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCheckOutModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCheckOutModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Check-out</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {renderImagePicker('checkOut')}
            
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Mô tả công việc đã hoàn thành (tùy chọn)</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Mô tả kết quả công việc..."
                value={checkOutDescription}
                onChangeText={setCheckOutDescription}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.primaryButton, styles.checkOutButton, { flex: 1 }]}
              onPress={handleCheckOut}
              disabled={!!actionLoading}
            >
              {actionLoading === 'checkout' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Xác nhận hoàn thành</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.cancelModalOverlay}>
          <View style={styles.cancelModalContainer}>
            <Text style={styles.cancelModalTitle}>Hủy công việc</Text>
            <Text style={styles.cancelModalSubtitle}>
              Vui lòng cho chúng tôi biết lý do bạn muốn hủy
            </Text>
            
            <TextInput
              style={styles.cancelReasonInput}
              placeholder="Nhập lý do hủy..."
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.cancelModalActions}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelModalButton, styles.cancelConfirmButton]}
                onPress={handleCancel}
                disabled={!cancelReason.trim() || !!actionLoading}
              >
                {actionLoading === 'cancel' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.cancelConfirmButtonText}>Xác nhận hủy</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={!!previewImage}
        transparent
        onRequestClose={() => setPreviewImage(null)}
      >
        <TouchableOpacity
          style={styles.imagePreviewOverlay}
          activeOpacity={1}
          onPress={() => setPreviewImage(null)}
        >
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={styles.fullImagePreview}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  timerHint: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  codeContainer: {
    alignItems: 'center',
  },
  bookingCode: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  serviceName: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginTop: 2,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  customerPhone: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  customerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  paymentCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  paymentTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  paymentTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  // Check-in time info styles
  checkInTimeInfo: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
  },
  checkInTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  checkInTimeTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkInTimeRanges: {
    marginLeft: 26,
    gap: 4,
  },
  checkInTimeText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  checkInTimeBold: {
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  checkInStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginLeft: 26,
  },
  checkInStatusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  evidenceImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fullWidthButton: {
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  checkInButton: {
    backgroundColor: COLORS.primary,
  },
  checkOutButton: {
    backgroundColor: COLORS.success,
  },
  cancelButton: {
    borderColor: COLORS.error,
  },
  disabledButton: {
    backgroundColor: '#9e9e9e',
    opacity: 0.7,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  imagePickerContainer: {
    marginBottom: 24,
  },
  imagePickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: (width - 56) / 3,
    height: (width - 56) / 3,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addImageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addImageButton: {
    width: (width - 56) / 3,
    height: (width - 56) / 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  descriptionInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Cancel modal
  cancelModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cancelModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  cancelModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  cancelModalSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  cancelReasonInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  cancelModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  cancelConfirmButton: {
    backgroundColor: COLORS.error,
  },
  cancelConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Image preview
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImagePreview: {
    width: '100%',
    height: '100%',
  },
});

export default AssignmentDetailScreen;
