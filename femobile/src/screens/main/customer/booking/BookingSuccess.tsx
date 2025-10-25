import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../../components';
import { colors, responsive, responsiveSpacing, responsiveFontSize } from '../../../../styles';
import { BookingResponse } from '../../../../types/booking';
import { commonStyles } from './styles';

interface BookingSuccessProps {
  bookingData: BookingResponse;
  onViewBookings: () => void;
  onBookMore: () => void;
  onGoHome: () => void;
}

export const BookingSuccess: React.FC<BookingSuccessProps> = ({
  bookingData,
  onViewBookings,
  onBookMore,
  onGoHome,
}) => {
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Đặt lịch thành công!\nMã đặt lịch: ${bookingData.bookingCode}\nTổng tiền: ${bookingData.formattedTotalAmount}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Đặt lịch thành công!</Text>
      </View>

      <ScrollView style={commonStyles.scrollContainer}>
        {/* Success Icon */}
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color={colors.feedback.success} />
        </View>

        {/* Success Message */}
        <View style={commonStyles.section}>
          <Text style={styles.successTitle}>Chúc mừng!</Text>
          <Text style={styles.successSubtitle}>
            Bạn đã đặt lịch thành công. Thông tin chi tiết:
          </Text>
        </View>

        {/* Booking Information */}
        <View style={commonStyles.section}>
          <View style={commonStyles.card}>
            <Text style={styles.infoTitle}>Thông tin đặt lịch</Text>
            
            <Text style={styles.infoText}>
              Mã đặt lịch: {bookingData.bookingCode}
            </Text>
            
            <Text style={styles.infoText}>
              Thời gian đặt: {bookingData.bookingTime}
            </Text>
            
            <Text style={styles.infoText}>
              Địa chỉ: {bookingData.customerInfo.fullAddress}
            </Text>
            
            <Text style={styles.infoText}>
              Số dịch vụ: {bookingData.totalServices}
            </Text>
            
            <Text style={styles.totalAmount}>
              Tổng tiền: {bookingData.formattedTotalAmount}
            </Text>
          </View>
        </View>

        {/* Share Button */}
        <View style={commonStyles.section}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={colors.neutral.white} />
            <Text style={styles.shareButtonText}>Chia sẻ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={commonStyles.buttonContainer}>
        <Button
          title="Xem đặt lịch"
          onPress={onViewBookings}
        />
        <Button
          title="Đặt lịch khác"
          onPress={onBookMore}
        />
        <Button
          title="Về trang chủ"
          onPress={onGoHome}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  successIcon: {
    alignItems: 'center',
    marginVertical: responsiveSpacing.xxl,
  },
  successTitle: {
    fontSize: responsiveFontSize.heading1,
    fontWeight: 'bold',
    color: colors.highlight.teal,
    textAlign: 'center',
    marginBottom: responsiveSpacing.sm,
  },
  successSubtitle: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textPrimary,
    textAlign: 'center',
    marginBottom: responsiveSpacing.md,
  },
  infoTitle: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: 'bold',
    color: colors.primary.navy,
    marginBottom: responsiveSpacing.md,
  },
  infoText: {
    fontSize: responsiveFontSize.body,
    color: colors.neutral.textPrimary,
    marginBottom: responsiveSpacing.sm,
    lineHeight: responsiveFontSize.body * 1.5,
  },
  totalAmount: {
    fontSize: responsiveFontSize.heading3,
    fontWeight: 'bold',
    color: colors.highlight.teal,
    marginTop: responsiveSpacing.sm,
    paddingTop: responsiveSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.highlight.teal,
    paddingVertical: responsiveSpacing.sm,
    paddingHorizontal: responsiveSpacing.lg,
    borderRadius: responsive.moderateScale(8),
    gap: responsiveSpacing.sm,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: responsive.moderateScale(2) },
    shadowOpacity: 0.15,
    shadowRadius: responsive.moderateScale(6),
    elevation: 3,
  },
  shareButtonText: {
    color: colors.neutral.white,
    fontSize: responsiveFontSize.body,
    fontWeight: '600',
  },
  button: {
    marginBottom: responsiveSpacing.sm,
  },
  secondaryButton: {
    backgroundColor: colors.highlight.teal,
  },
  secondaryButtonText: {
    color: colors.neutral.white,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.highlight.teal,
  },
  outlineButtonText: {
    color: colors.highlight.teal,
  },
});
