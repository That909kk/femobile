import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, responsive, responsiveSpacing, responsiveFontSize } from '../../../../styles';
import { BookingResponse } from '../../../../types/booking';
import { commonStyles } from './styles';
import { ProgressIndicator } from './ProgressIndicator';
import { BookingStep } from './BookingNavigator';

interface BookingSuccessProps {
  bookingData: BookingResponse;
  onViewBookings: () => void;
  onBookMore: () => void;
  onGoHome: () => void;
}

const InfoRow: React.FC<{ icon: string; label: string; value: string; valueStyle?: any }> = ({
  icon,
  label,
  value,
  valueStyle,
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconContainer}>
      <Ionicons name={icon as any} size={20} color={colors.highlight.teal} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
  </View>
);

export const BookingSuccess: React.FC<BookingSuccessProps> = ({
  bookingData,
  onViewBookings,
  onBookMore,
  onGoHome,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Đặt dịch vụ thành công!\nMã: ${bookingData.bookingCode}\nThời gian: ${bookingData.bookingTime}\nTổng tiền: ${bookingData.formattedTotalAmount}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateTimeString;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={BookingStep.SUCCESS} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Icon với Animation */}
        <Animated.View style={[styles.successIconContainer, { 
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim 
        }]}>
          <View style={styles.successIconBg}>
            <Ionicons name="checkmark-circle" size={100} color={colors.feedback.success} />
          </View>
        </Animated.View>

        {/* Success Message */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.successTitle}>Đặt dịch vụ thành công!</Text>
          <Text style={styles.successSubtitle}>
            Chúng tôi đã nhận được yêu cầu của bạn
          </Text>
        </Animated.View>

        {/* Booking Details Card */}
        <Animated.View style={[styles.detailsCard, { opacity: fadeAnim }]}>
          <InfoRow
            icon="receipt-outline"
            label="Mã đặt dịch vụ"
            value={bookingData.bookingCode}
          />
          <View style={styles.divider} />
          
          <InfoRow
            icon="calendar-outline"
            label="Thời gian"
            value={formatDateTime(bookingData.bookingTime)}
          />
          <View style={styles.divider} />
          
          <InfoRow
            icon="location-outline"
            label="Địa chỉ"
            value={bookingData.customerInfo.fullAddress}
          />
          <View style={styles.divider} />
          
          <InfoRow
            icon="cash-outline"
            label="Tổng tiền"
            value={bookingData.formattedTotalAmount}
            valueStyle={styles.priceValue}
          />
        </Animated.View>

        {/* Share Button */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={colors.highlight.teal} />
            <Text style={styles.shareText}>Chia sẻ</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Action Buttons */}
      <Animated.View style={[commonStyles.buttonContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity style={commonStyles.primaryButton} onPress={onViewBookings}>
          <Text style={commonStyles.primaryButtonText}>Xem chi tiết</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[commonStyles.secondaryButton, { marginTop: responsiveSpacing.sm }]} onPress={onBookMore}>
          <Text style={commonStyles.secondaryButtonText}>Đặt thêm dịch vụ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.textButton} onPress={onGoHome}>
          <Text style={styles.textButtonText}>Về trang chủ</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  scrollContent: {
    padding: responsiveSpacing.lg,
    alignItems: 'center',
  },
  successIconContainer: {
    marginVertical: responsiveSpacing.xxl,
    alignItems: 'center',
  },
  successIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.feedback.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: responsiveFontSize.heading1,
    fontWeight: '700',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.xs,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textSecondary,
    marginBottom: responsiveSpacing.xl,
    textAlign: 'center',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: responsiveSpacing.lg,
    marginBottom: responsiveSpacing.md,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: responsiveSpacing.xs,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.highlight.teal + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveSpacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: responsiveFontSize.caption,
    color: colors.neutral.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: responsiveFontSize.body,
    color: colors.primary.navy,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: '700',
    color: colors.highlight.teal,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral.border,
    marginVertical: responsiveSpacing.sm,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsiveSpacing.sm,
    paddingHorizontal: responsiveSpacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.highlight.teal,
    backgroundColor: colors.neutral.white,
  },
  shareText: {
    fontSize: responsiveFontSize.body,
    color: colors.highlight.teal,
    fontWeight: '700',
    marginLeft: responsiveSpacing.xs,
  },
  textButton: {
    paddingVertical: responsiveSpacing.sm,
    alignItems: 'center',
    marginTop: responsiveSpacing.sm,
  },
  textButtonText: {
    color: colors.neutral.textSecondary,
    fontSize: responsiveFontSize.caption,
    fontWeight: '600',
  },
});
