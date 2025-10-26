import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, responsive, responsiveSpacing, responsiveFontSize } from '../../../../styles';
import { type Service } from '../../../../services';
import { type LocationData } from './types';
import { commonStyles } from './styles';
import { ProgressIndicator } from './ProgressIndicator';
import { BookingStep } from './BookingNavigator';

interface TimeSelectionProps {
  selectedService: Service | null;
  selectedLocation: LocationData | null;
  selectedDate: string;
  selectedTime: string;
  selectedEmployeeId: string | null;
  totalPrice?: number; // Calculated price from service selection
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
  onEmployeeSelect: (employeeId: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export const TimeSelection: React.FC<TimeSelectionProps> = ({
  selectedService,
  selectedLocation,
  selectedDate,
  selectedTime,
  selectedEmployeeId,
  totalPrice,
  onDateSelect,
  onTimeSelect,
  onEmployeeSelect,
  onNext,
  onBack,
}) => {
  // Alias for backwards compatibility
  const selectedAddress = selectedLocation;

  const accentColor = colors.highlight.teal;
  const warningColor = colors.feedback.warning;

  const [loading, setLoading] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [selectedPickerDate, setSelectedPickerDate] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [selectedPickerTime, setSelectedPickerTime] = useState<string | null>(null);

  // Generate next 7 days
  useEffect(() => {
    const today = new Date();
    // Reset time to avoid timezone issues
    today.setHours(0, 0, 0, 0);
    
    const nextDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      nextDays.push(date);
    }
    setDates(nextDays);
  }, []);

  // Generate available times (8 AM to 5 PM, hourly)
  useEffect(() => {
    const times = [];
    for (let hour = 8; hour <= 17; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    setAvailableTimes(times);
  }, []);

  useEffect(() => {
    if (selectedService && selectedDate && selectedTime && selectedAddress) {
      console.log('All booking data ready for validation');
    }
  }, [selectedService, selectedDate, selectedTime, selectedAddress]);

  const validateAndNext = () => {
    const hasDate = selectedDate || selectedPickerDate;
    const hasTime = selectedTime || selectedPickerTime;
    if (!selectedService || !hasDate || !hasTime || !selectedAddress) return;

    // If using picker date, we need to call onDateSelect to sync with parent
    if (selectedPickerDate && !selectedDate) {
      onDateSelect(getDateValue(selectedPickerDate));
    }

    // If using picker time, we need to call onTimeSelect to sync with parent
    if (selectedPickerTime && !selectedTime) {
      onTimeSelect(selectedPickerTime);
    }

    // Additional validation can be added here
    onNext();
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0); // Reset time for accurate comparison

    if (compareDate.getTime() === today.getTime()) {
      return 'Hôm nay';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Ngày mai';
    } else {
      return date.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  const getDateValue = (date: Date) => {
    // Use local timezone instead of UTC
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    // On Android, close picker after any change
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setTempDate(selectedDate);
      
      // Only process on Android OR when user explicitly confirms on iOS (dismisses picker)
      // On iOS, onChange fires continuously while scrolling, we should not auto-close or show alerts
      if (Platform.OS === 'android') {
        // Check if date is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(selectedDate);
        checkDate.setHours(0, 0, 0, 0);
        
        if (checkDate < today) {
          Alert.alert('Lỗi', 'Không thể chọn ngày trong quá khứ');
          return;
        }
        
        // Set the picker date
        setSelectedPickerDate(selectedDate);
        
        const formattedDate = selectedDate.toLocaleDateString('vi-VN');
        Alert.alert('Thành công', `Đã chọn ngày ${formattedDate}`);
      }
    } else if (event.type === 'dismissed' && Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const handleDatePickerDone = () => {
    // This is called when iOS picker is dismissed
    if (Platform.OS === 'ios') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkDate = new Date(tempDate);
      checkDate.setHours(0, 0, 0, 0);
      
      if (checkDate < today) {
        Alert.alert('Lỗi', 'Không thể chọn ngày trong quá khứ');
        setShowDatePicker(false);
        return;
      }
      
      setSelectedPickerDate(tempDate);
      setShowDatePicker(false);
      
      const formattedDate = tempDate.toLocaleDateString('vi-VN');
      Alert.alert('Thành công', `Đã chọn ngày ${formattedDate}`);
    }
  };

  const openDatePicker = () => {
    const today = new Date();
    setTempDate(today);
    setShowDatePicker(true);
  };

  const handleDateCardSelect = (dateValue: string) => {
    onDateSelect(dateValue);
    setSelectedPickerDate(null); // Clear picker date when selecting from cards
  };

  const handleTimeSlotSelect = (time: string) => {
    onTimeSelect(time);
    setSelectedPickerTime(null); // Clear custom time when selecting from slots
    Alert.alert('Thành công', `Đã chọn giờ ${time}`);
  };

  const openTimePicker = () => {
    // Set initial time based on current selection or default to 8:00 AM
    const defaultTime = new Date();
    
    if (selectedTime) {
      // Parse existing selected time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      defaultTime.setHours(hours, minutes, 0, 0);
    } else {
      // Default to 8:00 AM
      defaultTime.setHours(8, 0, 0, 0);
    }
    
    setTempTime(defaultTime);
    setShowTimePicker(true);
  };

  const handleTimePickerChange = (event: any, selectedTime?: Date) => {
    // On Android, close picker after any change
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedTime) {
      setTempTime(selectedTime);
      
      // Only process on Android
      if (Platform.OS === 'android') {
        const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
        
        // Validate if this time is valid for selected date
        const currentDate = selectedPickerDate || new Date(selectedDate);
        if (!isValidBookingTime(currentDate, timeString)) {
          Alert.alert('Lỗi', 'Thời gian này không hợp lệ. Vui lòng chọn thời gian ít nhất 30 phút từ bây giờ.');
          return;
        }
        
        setSelectedPickerTime(timeString);
        onTimeSelect(timeString); // Update parent state immediately
        Alert.alert('Thành công', `Đã chọn giờ ${timeString}`);
      }
    } else if (event.type === 'dismissed' && Platform.OS === 'android') {
      setShowTimePicker(false);
    }
  };

  const handleTimePickerDone = () => {
    // This is called when iOS picker is dismissed
    if (Platform.OS === 'ios') {
      const timeString = `${tempTime.getHours().toString().padStart(2, '0')}:${tempTime.getMinutes().toString().padStart(2, '0')}`;
      
      // Validate if this time is valid for selected date
      const currentDate = selectedPickerDate || new Date(selectedDate);
      if (!isValidBookingTime(currentDate, timeString)) {
        Alert.alert('Lỗi', 'Thời gian này không hợp lệ. Vui lòng chọn thời gian ít nhất 30 phút từ bây giờ.');
        setShowTimePicker(false);
        return;
      }
      
      setSelectedPickerTime(timeString);
      onTimeSelect(timeString); // Update parent state immediately
      setShowTimePicker(false);
      Alert.alert('Thành công', `Đã chọn giờ ${timeString}`);
    }
  };

  const isValidBookingTime = (date: Date, time: string) => {
    const now = new Date();
    const selectedDate = new Date(date);
    
    // Parse time string (HH:MM format)
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create booking datetime using device timezone
    const bookingDateTime = new Date(selectedDate);
    bookingDateTime.setHours(hours, minutes, 0, 0);
    
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    if (isToday) {
      // For today: must be at least 30 minutes in advance from current device time
      const diffMinutes = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60);
      return diffMinutes >= 30;
    } else {
      // For future days: all times are valid
      return bookingDateTime > now;
    }
  };

  return (
    <View style={commonStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Header */}
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={onBack} style={commonStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary.navy} />
        </TouchableOpacity>
        <View style={commonStyles.headerContent}>
          <Text style={commonStyles.headerTitle}>Chọn thời gian</Text>
          <Text style={commonStyles.headerSubtitle}>Xác định ngày giờ thực hiện</Text>
        </View>
      </View>

      {/* Progress Indicator */}
      <ProgressIndicator currentStep={BookingStep.TIME_SELECTION} />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Service Summary */}
        {selectedService && (
          <View style={[commonStyles.card, { margin: 20, marginBottom: 12 }]}>
            <Text style={[commonStyles.cardDescription, { marginBottom: 4 }]}>Dịch vụ đã chọn</Text>
            <Text style={commonStyles.cardTitle}>{selectedService.name}</Text>
            <Text style={commonStyles.cardPrice}>
              {(totalPrice || selectedService.basePrice)?.toLocaleString('vi-VN')}đ
            </Text>
          </View>
        )}

        {/* Address Summary */}
        {selectedAddress && (
          <View style={[commonStyles.card, { margin: 20, marginTop: 0, marginBottom: 12 }]}>
            <Text style={[commonStyles.cardDescription, { marginBottom: 4 }]}>Địa chỉ</Text>
            <Text style={commonStyles.cardTitle}>{selectedAddress.fullAddress}</Text>
            <Text style={commonStyles.cardDescription}>
              {[selectedAddress.ward, selectedAddress.city]
                .filter(item => item && item.trim())
                .join(', ')}
            </Text>
          </View>
        )}

        {/* Date Selection */}
        <View style={[commonStyles.section, { margin: 20, marginTop: 0 }]}>
          <Text style={commonStyles.sectionTitle}>Chọn ngày</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
            {dates.map((date, index) => {
              const dateValue = getDateValue(date);
              const isSelected = selectedDate === dateValue && !selectedPickerDate; // Only show selected if not using picker
              
              // More accurate today detection
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const checkDate = new Date(date);
              checkDate.setHours(0, 0, 0, 0);
              const isToday = checkDate.getTime() === today.getTime();
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    commonStyles.card,
                    { 
                      width: 80, 
                      height: 80, 
                      marginRight: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 12
                    },
                    isSelected && commonStyles.cardSelected,
                    isToday && { borderColor: warningColor, borderWidth: 2 }
                  ]}
                  onPress={() => handleDateCardSelect(dateValue)}
                >
                  <Text style={[
                    {
                      fontSize: 12,
                      color: colors.neutral.textSecondary,
                      fontWeight: '500',
                    },
                    isToday && { color: warningColor },
                    isSelected && { color: accentColor }
                  ]}>
                    {formatDate(date)}
                  </Text>
                  <Text style={[
                    {
                      fontSize: 20,
                      fontWeight: '700',
                      color: colors.primary.navy,
                      marginTop: 4,
                    },
                    isToday && { color: warningColor },
                    isSelected && { color: accentColor }
                  ]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
          {/* Custom Date Picker */}
          <View style={{ marginTop: 16 }}>
            <Text style={[commonStyles.cardDescription, { marginBottom: 8 }]}>Hoặc chọn ngày khác:</Text>
            <TouchableOpacity
              style={[commonStyles.secondaryButton, commonStyles.flexRow, { justifyContent: 'center' }]}
              onPress={openDatePicker}
            >
              <Ionicons name="calendar-outline" size={20} color={accentColor} />
              <Text style={[commonStyles.secondaryButtonText, { marginLeft: 8 }]}>Chọn ngày từ lịch</Text>
            </TouchableOpacity>
            
            {/* Display selected date */}
            {selectedPickerDate && (
              <Text style={[commonStyles.cardDescription, { textAlign: 'center', marginTop: 8, color: accentColor, fontWeight: '600' }]}>
                Đã chọn: {formatDisplayDate(selectedPickerDate)}
              </Text>
            )}
            {selectedDate && !selectedPickerDate && (
              <Text style={[commonStyles.cardDescription, { textAlign: 'center', marginTop: 8, color: accentColor, fontWeight: '600' }]}>
                Ngày đã chọn: {selectedDate.split('-').reverse().join('/')}
              </Text>
            )}
          </View>
          
          {/* DateTimePicker */}
          {showDatePicker && (
            <>
              {Platform.OS === 'ios' && (
                <View style={{ backgroundColor: colors.neutral.white, borderRadius: 12, overflow: 'hidden', marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.neutral.border }}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={{ color: colors.feedback.error, fontSize: 16, fontWeight: '600' }}>Hủy</Text>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary.navy }}>Chọn ngày</Text>
                    <TouchableOpacity onPress={handleDatePickerDone}>
                      <Text style={{ color: colors.highlight.teal, fontSize: 16, fontWeight: '600' }}>Xong</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDatePickerChange}
                    minimumDate={new Date()}
                    maximumDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
                  />
                </View>
              )}
              {Platform.OS === 'android' && (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="default"
                  onChange={handleDatePickerChange}
                  minimumDate={new Date()}
                  maximumDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
                />
              )}
            </>
          )}
        </View>

        {/* Time Selection */}
        {(selectedDate || selectedPickerDate) && (
          <View style={[commonStyles.section, { margin: 20 }]}>
            <Text style={commonStyles.sectionTitle}>Chọn giờ</Text>
            <Text style={commonStyles.sectionSubtitle}>
              Nhấn vào giờ để chọn hoặc nhập giờ tùy chỉnh bên dưới
            </Text>
            <View style={{ 
              flexDirection: 'row', 
              flexWrap: 'wrap', 
              justifyContent: 'space-between',
              marginTop: 16
            }}>
              {availableTimes.map((time) => {
                // Use picker date if available, otherwise use selected date
                const currentDate = selectedPickerDate || new Date(selectedDate);
                const isSelected = selectedTime === time && !selectedPickerTime; // Only highlight if not using picker
                const isValidTime = isValidBookingTime(currentDate, time);
                
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      commonStyles.card,
                      { 
                        width: '30%', 
                        height: 50,
                        marginBottom: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 12
                      },
                      isSelected && commonStyles.cardSelected,
                      !isValidTime && { opacity: 0.3 }
                    ]}
                    onPress={() => isValidTime && handleTimeSlotSelect(time)}
                    disabled={!isValidTime}
                  >
                    <Text style={[
                      commonStyles.cardTitle,
                      { fontSize: 16 },
                      isSelected && { color: accentColor },
                      !isValidTime && { color: colors.neutral.label }
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {/* Custom Time Picker */}
            <View style={{ marginTop: 16 }}>
              <Text style={[commonStyles.cardDescription, { marginBottom: 8 }]}>Hoặc chọn giờ khác:</Text>
              <TouchableOpacity
                style={[commonStyles.secondaryButton, commonStyles.flexRow, { justifyContent: 'center' }]}
                onPress={openTimePicker}
              >
                <Ionicons name="time-outline" size={20} color={accentColor} />
                <Text style={[commonStyles.secondaryButtonText, { marginLeft: 8 }]}>Chọn giờ từ đồng hồ</Text>
              </TouchableOpacity>
              
              {/* Display selected time */}
              {selectedPickerTime && (
                <Text style={[commonStyles.cardDescription, { textAlign: 'center', marginTop: 8, color: accentColor, fontWeight: '600' }]}>
                  Đã chọn: {selectedPickerTime}
                </Text>
              )}
              {selectedTime && !selectedPickerTime && (
                <Text style={[commonStyles.cardDescription, { textAlign: 'center', marginTop: 8, color: accentColor, fontWeight: '600' }]}>
                  Giờ đã chọn: {selectedTime}
                </Text>
              )}
            </View>
            
            {/* TimePicker */}
            {showTimePicker && (
              <>
                {Platform.OS === 'ios' && (
                  <View style={{ backgroundColor: colors.neutral.white, borderRadius: 12, overflow: 'hidden', marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.neutral.border }}>
                      <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                        <Text style={{ color: colors.feedback.error, fontSize: 16, fontWeight: '600' }}>Hủy</Text>
                      </TouchableOpacity>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary.navy }}>Chọn giờ</Text>
                      <TouchableOpacity onPress={handleTimePickerDone}>
                        <Text style={{ color: colors.highlight.teal, fontSize: 16, fontWeight: '600' }}>Xong</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={tempTime}
                      mode="time"
                      is24Hour={true}
                      display="spinner"
                      onChange={handleTimePickerChange}
                    />
                  </View>
                )}
                {Platform.OS === 'android' && (
                  <DateTimePicker
                    value={tempTime}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={handleTimePickerChange}
                  />
                )}
              </>
            )}
          </View>
        )}

      </ScrollView>

      {/* Next Button */}
      <View style={commonStyles.buttonContainer}>
        <TouchableOpacity
          style={[
            commonStyles.primaryButton,
            commonStyles.flexRow,
            { justifyContent: 'center' },
            (!selectedDate || !selectedTime || loading) && commonStyles.primaryButtonDisabled
          ]}
          onPress={validateAndNext}
          disabled={!selectedDate || !selectedTime || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.neutral.white} />
          ) : (
            <>
              <Text style={commonStyles.primaryButtonText}>Tiếp tục</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={colors.neutral.white}
                style={{ marginLeft: 8 }}
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

