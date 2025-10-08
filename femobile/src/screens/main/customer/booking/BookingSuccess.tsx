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
import { COLORS } from '../../../../constants';
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
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
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
            <Ionicons name="share-outline" size={20} color={COLORS.text.inverse} />
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
    marginVertical: 30,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginBottom: 8,
    lineHeight: 24,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  shareButtonText: {
    color: COLORS.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  secondaryButtonText: {
    color: COLORS.text.inverse,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  outlineButtonText: {
    color: COLORS.primary,
  },
});
