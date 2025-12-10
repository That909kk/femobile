import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, responsive, responsiveSpacing, responsiveFontSize } from '../../styles';

interface RebookModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (dateTime: string) => Promise<void>;
  originalDate?: string;
  originalTime?: string;
  serviceName?: string;
  bookingCode?: string;
}

export const RebookModal: React.FC<RebookModalProps> = ({
  visible,
  onClose,
  onConfirm,
  originalDate,
  originalTime,
  serviceName = 'Dịch vụ',
  bookingCode,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      // Set default date to tomorrow with original time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Parse original time if available
      if (originalTime) {
        const [hours, minutes] = originalTime.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          tomorrow.setHours(hours, minutes, 0, 0);
        } else {
          tomorrow.setHours(9, 0, 0, 0); // Default 9:00 AM
        }
      } else {
        tomorrow.setHours(9, 0, 0, 0);
      }
      
      setSelectedDate(tomorrow);
      setError(null);
    }
  }, [visible, originalTime]);

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      const newDate = new Date(selectedDate);
      newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setSelectedDate(newDate);
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (date) {
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
      setSelectedDate(newDate);
    }
  };

  const validateDateTime = (): string | null => {
    const now = new Date();
    const minBookingTime = new Date(now.getTime() + 60 * 60 * 1000); // At least 1 hour from now

    if (selectedDate < minBookingTime) {
      return 'Thời gian đặt lịch phải cách hiện tại ít nhất 1 giờ';
    }

    const hours = selectedDate.getHours();
    if (hours < 8 || hours >= 17) {
      return 'Thời gian đặt lịch phải trong giờ làm việc (8:00 - 17:00)';
    }

    return null;
  };

  const handleConfirm = async () => {
    const validationError = validateDateTime();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Format datetime as ISO string
      const dateTimeStr = selectedDate.toISOString();
      
      await onConfirm(dateTimeStr);
      onClose();
    } catch (err: any) {
      console.error('Error rebooking:', err);
      setError(err.message || 'Không thể đặt lại lịch. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Đặt lại lịch</Text>
              {bookingCode && (
                <Text style={styles.subtitle}>Dựa trên đơn: {bookingCode}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={responsive.moderateScale(24)} color={colors.neutral.label} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Service Info */}
            <View style={styles.serviceInfo}>
              <View style={styles.serviceIcon}>
                <Ionicons name="construct" size={responsive.moderateScale(24)} color={colors.highlight.teal} />
              </View>
              <View style={styles.serviceDetails}>
                <Text style={styles.serviceName}>{serviceName}</Text>
                {originalDate && (
                  <Text style={styles.originalDate}>
                    Lịch cũ: {originalDate} {originalTime && `lúc ${originalTime}`}
                  </Text>
                )}
              </View>
            </View>

            {/* Date Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Chọn ngày mới</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={responsive.moderateScale(22)} color={colors.highlight.teal} />
                <Text style={styles.dateTimeText}>{formatDate(selectedDate)}</Text>
                <Ionicons name="chevron-down" size={responsive.moderateScale(18)} color={colors.neutral.label} />
              </TouchableOpacity>
            </View>

            {/* Time Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Chọn giờ mới</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={responsive.moderateScale(22)} color={colors.highlight.teal} />
                <Text style={styles.dateTimeText}>{formatTime(selectedDate)}</Text>
                <Ionicons name="chevron-down" size={responsive.moderateScale(18)} color={colors.neutral.label} />
              </TouchableOpacity>
              <Text style={styles.timeHint}>Giờ làm việc: 8:00 - 17:00</Text>
            </View>

            {/* Info Note */}
            <View style={styles.infoNote}>
              <Ionicons name="information-circle" size={responsive.moderateScale(20)} color={colors.highlight.teal} />
              <Text style={styles.infoNoteText}>
                Đơn mới sẽ có cùng dịch vụ, địa chỉ và các tùy chọn như đơn cũ.
              </Text>
            </View>

            {/* Error */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={responsive.moderateScale(18)} color={colors.feedback.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.neutral.white} />
              ) : (
                <>
                  <Ionicons name="refresh" size={responsive.moderateScale(18)} color={colors.neutral.white} />
                  <Text style={styles.confirmButtonText}>Đặt lại</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={getMinDate()}
              onChange={handleDateChange}
            />
          )}

          {/* Time Picker */}
          {showTimePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              is24Hour={true}
              onChange={handleTimeChange}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: responsiveSpacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.neutral.white,
    borderRadius: responsive.moderateScale(20),
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: responsiveSpacing.lg,
    paddingTop: responsiveSpacing.lg,
    paddingBottom: responsiveSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: responsiveFontSize.heading2,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  subtitle: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
    marginTop: responsiveSpacing.xs,
  },
  closeButton: {
    padding: responsiveSpacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: responsiveSpacing.lg,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.background,
    borderRadius: responsive.moderateScale(12),
    padding: responsiveSpacing.md,
    marginBottom: responsiveSpacing.lg,
  },
  serviceIcon: {
    width: responsive.moderateScale(48),
    height: responsive.moderateScale(48),
    borderRadius: responsive.moderateScale(24),
    backgroundColor: colors.highlight.teal + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSpacing.md,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.xs,
  },
  originalDate: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
  },
  section: {
    marginBottom: responsiveSpacing.lg,
  },
  sectionLabel: {
    fontSize: responsiveFontSize.body,
    fontWeight: '500',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.sm,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.sm,
    paddingVertical: responsiveSpacing.md,
    paddingHorizontal: responsiveSpacing.md,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: responsive.moderateScale(12),
    backgroundColor: colors.neutral.white,
  },
  dateTimeText: {
    flex: 1,
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
  },
  timeHint: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.label,
    marginTop: responsiveSpacing.xs,
    marginLeft: responsiveSpacing.sm,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: responsiveSpacing.sm,
    padding: responsiveSpacing.md,
    backgroundColor: colors.highlight.teal + '10',
    borderRadius: responsive.moderateScale(12),
    marginBottom: responsiveSpacing.md,
  },
  infoNoteText: {
    flex: 1,
    fontSize: responsiveFontSize.caption,
    color: colors.primary.navy,
    lineHeight: responsiveFontSize.caption * 1.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing.sm,
    padding: responsiveSpacing.md,
    backgroundColor: colors.feedback.error + '15',
    borderRadius: responsive.moderateScale(8),
  },
  errorText: {
    flex: 1,
    fontSize: responsiveFontSize.caption,
    color: colors.feedback.error,
  },
  footer: {
    flexDirection: 'row',
    gap: responsiveSpacing.md,
    padding: responsiveSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(12),
    borderWidth: 1,
    borderColor: colors.neutral.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.neutral.label,
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveSpacing.sm,
    paddingVertical: responsiveSpacing.md,
    borderRadius: responsive.moderateScale(12),
    backgroundColor: colors.highlight.teal,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
    color: colors.neutral.white,
  },
});

export default RebookModal;
