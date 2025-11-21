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
  Switch,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../styles';
import { type Service } from '../../../../services';
import { type LocationData, BookingStep, type BookingMode, type RecurringBookingConfig } from './types';
import { commonStyles } from './styles';
import { ProgressIndicator } from './ProgressIndicator';

interface TimeSelectionProps {
  selectedService: Service | null;
  selectedLocation: LocationData | null;
  selectedDates: string[]; // Changed: now supports multiple dates
  selectedTime: string;
  bookingMode: BookingMode;
  recurringConfig: RecurringBookingConfig | null;
  totalPrice?: number;
  onDatesSelect: (dates: string[]) => void; // Changed
  onTimeSelect: (time: string) => void;
  onBookingModeChange: (mode: BookingMode) => void;
  onRecurringConfigChange: (config: RecurringBookingConfig | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export const TimeSelection: React.FC<TimeSelectionProps> = ({
  selectedService,
  selectedLocation,
  selectedDates,
  selectedTime,
  bookingMode,
  recurringConfig,
  totalPrice,
  onDatesSelect,
  onTimeSelect,
  onBookingModeChange,
  onRecurringConfigChange,
  onNext,
  onBack,
}) => {
  const accentColor = colors.highlight.teal;
  const warningColor = colors.feedback.warning;

  const [loading, setLoading] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  // Recurring booking states
  const [recurrenceType, setRecurrenceType] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([]);
  const [recurringTime, setRecurringTime] = useState('08:00:00');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Generate next 30 days for multiple selection
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextDays = [];
    for (let i = 0; i < 30; i++) {
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

  // Format date to dd/mm/yyyy
  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Update recurring config when relevant fields change
  useEffect(() => {
    if (bookingMode === 'recurring') {
      const days = recurrenceType === 'WEEKLY' ? selectedWeekdays : selectedMonthDays;
      
      if (days.length > 0 && recurringTime && startDate) {
        const config: RecurringBookingConfig = {
          recurrenceType,
          recurrenceDays: days,
          bookingTime: recurringTime,
          startDate,
          endDate: endDate || undefined,
        };
        onRecurringConfigChange(config);
        // Also update selectedTime so it shows in confirmation screen
        onTimeSelect(recurringTime);
      } else {
        onRecurringConfigChange(null);
      }
    }
  }, [bookingMode, recurrenceType, selectedWeekdays, selectedMonthDays, recurringTime, startDate, endDate]);

  const validateAndNext = () => {
    if (!selectedService || !selectedLocation) {
      Alert.alert('Lỗi', 'Vui lòng chọn dịch vụ và địa chỉ');
      return;
    }

    if (bookingMode === 'single') {
      if (selectedDates.length !== 1 || !selectedTime) {
        Alert.alert('Lỗi', 'Vui lòng chọn ngày và giờ');
        return;
      }
    } else if (bookingMode === 'multiple') {
      if (selectedDates.length === 0 || !selectedTime) {
        Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 ngày và giờ');
        return;
      }
    } else if (bookingMode === 'recurring') {
      // Validate directly from state instead of recurringConfig
      const days = recurrenceType === 'WEEKLY' ? selectedWeekdays : selectedMonthDays;
      
      if (days.length === 0) {
        const dayType = recurrenceType === 'WEEKLY' ? 'thứ' : 'ngày trong tháng';
        Alert.alert('Thiếu thông tin', `Vui lòng chọn ít nhất 1 ${dayType}`);
        return;
      }
      
      if (!recurringTime) {
        Alert.alert('Thiếu thông tin', 'Vui lòng chọn giờ thực hiện');
        return;
      }
      
      if (!startDate) {
        Alert.alert('Thiếu thông tin', 'Vui lòng chọn ngày bắt đầu');
        return;
      }
      
      // Force update recurringConfig before proceeding
      const config: RecurringBookingConfig = {
        recurrenceType,
        recurrenceDays: days,
        bookingTime: recurringTime,
        startDate,
        endDate: endDate || undefined,
      };
      onRecurringConfigChange(config);
      onTimeSelect(recurringTime);
    }

    onNext();
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

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
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (dateValue: string) => {
    if (bookingMode === 'single') {
      onDatesSelect([dateValue]);
    } else if (bookingMode === 'multiple') {
      const newDates = selectedDates.includes(dateValue)
        ? selectedDates.filter(d => d !== dateValue)
        : [...selectedDates, dateValue].sort();
      onDatesSelect(newDates);
    }
  };

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setTempDate(selectedDate);
      
      if (Platform.OS === 'android') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(selectedDate);
        checkDate.setHours(0, 0, 0, 0);
        
        if (checkDate < today) {
          Alert.alert('Lỗi', 'Không thể chọn ngày trong quá khứ');
          return;
        }
        
        const dateValue = getDateValue(selectedDate);
        handleDateSelect(dateValue);
      }
    }
  };

  const handleDatePickerDone = () => {
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
      
      const dateValue = getDateValue(tempDate);
      handleDateSelect(dateValue);
      setShowDatePicker(false);
    }
  };

  const handleTimeSlotSelect = (time: string) => {
    onTimeSelect(time);
  };

  const handleTimePickerChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedTime) {
      setTempTime(selectedTime);
      
      if (Platform.OS === 'android') {
        const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
        onTimeSelect(timeString);
      }
    }
  };

  const handleTimePickerDone = () => {
    if (Platform.OS === 'ios') {
      const hours = tempTime.getUTCHours();
      const minutes = tempTime.getUTCMinutes();
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      onTimeSelect(timeString);
      setShowTimePicker(false);
    }
  };

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const toggleMonthDay = (day: number) => {
    setSelectedMonthDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const weekdayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const renderBookingModeSelector = () => (
    <View style={[commonStyles.section, { margin: 20 }]}>
      <Text style={commonStyles.sectionTitle}>Loại đặt lịch</Text>
      <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
        <TouchableOpacity
          style={[
            commonStyles.card,
            { flex: 1, padding: 16, alignItems: 'center' },
            bookingMode === 'single' && commonStyles.cardSelected
          ]}
          onPress={() => {
            onBookingModeChange('single');
            onDatesSelect([]);
          }}
        >
          <Ionicons name="calendar-outline" size={24} color={bookingMode === 'single' ? accentColor : colors.neutral.textSecondary} />
          <Text style={[commonStyles.cardTitle, { fontSize: 14, marginTop: 8 }, bookingMode === 'single' && { color: accentColor }]}>
            Đơn lẻ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            commonStyles.card,
            { flex: 1, padding: 16, alignItems: 'center' },
            bookingMode === 'multiple' && commonStyles.cardSelected
          ]}
          onPress={() => {
            onBookingModeChange('multiple');
            onDatesSelect([]);
          }}
        >
          <Ionicons name="calendar-number-outline" size={24} color={bookingMode === 'multiple' ? accentColor : colors.neutral.textSecondary} />
          <Text style={[commonStyles.cardTitle, { fontSize: 14, marginTop: 8 }, bookingMode === 'multiple' && { color: accentColor }]}>
            Nhiều ngày
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            commonStyles.card,
            { flex: 1, padding: 16, alignItems: 'center' },
            bookingMode === 'recurring' && commonStyles.cardSelected
          ]}
          onPress={() => {
            onBookingModeChange('recurring');
            onDatesSelect([]);
          }}
        >
          <Ionicons name="repeat-outline" size={24} color={bookingMode === 'recurring' ? accentColor : colors.neutral.textSecondary} />
          <Text style={[commonStyles.cardTitle, { fontSize: 14, marginTop: 8 }, bookingMode === 'recurring' && { color: accentColor }]}>
            Định kỳ
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSingleMultipleMode = () => (
    <>
      {/* Date Selection */}
      <View style={[commonStyles.section, { margin: 20, marginTop: 0 }]}>
        <Text style={commonStyles.sectionTitle}>
          {bookingMode === 'single' ? 'Chọn ngày' : 'Chọn các ngày'}
        </Text>
        {bookingMode === 'multiple' && (
          <Text style={commonStyles.sectionSubtitle}>
            Chọn nhiều ngày (đã chọn: {selectedDates.length})
          </Text>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
          {dates.slice(0, 14).map((date, index) => {
            const dateValue = getDateValue(date);
            const isSelected = selectedDates.includes(dateValue);
            
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
                onPress={() => handleDateSelect(dateValue)}
              >
                {isSelected && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={accentColor} 
                    style={{ position: 'absolute', top: 4, right: 4 }} 
                  />
                )}
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
        
        {/* Custom Date Picker Button */}
        <TouchableOpacity
          style={[commonStyles.secondaryButton, { marginTop: 8 }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={accentColor} />
          <Text style={[commonStyles.secondaryButtonText, { marginLeft: 8 }]}>Chọn ngày từ lịch</Text>
        </TouchableOpacity>
      </View>

      {/* Time Selection */}
      {selectedDates.length > 0 && (
        <View style={[commonStyles.section, { margin: 20 }]}>
          <Text style={commonStyles.sectionTitle}>Chọn giờ</Text>
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            justifyContent: 'space-between',
            marginTop: 16
          }}>
            {availableTimes.map((time) => {
              const isSelected = selectedTime === time;
              
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
                    },
                    isSelected && commonStyles.cardSelected,
                  ]}
                  onPress={() => handleTimeSlotSelect(time)}
                >
                  <Text style={[
                    commonStyles.cardTitle,
                    { fontSize: 16 },
                    isSelected && { color: accentColor },
                  ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Custom Time Picker */}
          <TouchableOpacity
            style={[commonStyles.secondaryButton, { marginTop: 16 }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color={accentColor} />
            <Text style={[commonStyles.secondaryButtonText, { marginLeft: 8 }]}>Chọn giờ khác</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const renderRecurringMode = () => (
    <View style={[commonStyles.section, { margin: 20, marginTop: 0 }]}>
      {/* Header với icon */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: accentColor + '15',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12
        }}>
          <Ionicons name="repeat" size={22} color={accentColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[commonStyles.sectionTitle, { marginBottom: 2 }]}>Lịch định kỳ</Text>
          <Text style={[commonStyles.cardDescription, { fontSize: 13 }]}>
            Đặt lịch lặp lại hàng tuần hoặc hàng tháng
          </Text>
        </View>
      </View>
      
      {/* Recurrence Type - Improved */}
      <View style={commonStyles.card}>
        <Text style={[commonStyles.cardDescription, { marginBottom: 12, fontWeight: '600' }]}>
          Loại lặp lại
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={[
              {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: recurrenceType === 'WEEKLY' ? accentColor : colors.neutral.border,
                backgroundColor: recurrenceType === 'WEEKLY' ? accentColor + '10' : colors.neutral.white,
              }
            ]}
            onPress={() => {
              setRecurrenceType('WEEKLY');
              setSelectedMonthDays([]);
            }}
          >
            <Ionicons 
              name="calendar-outline" 
              size={20} 
              color={recurrenceType === 'WEEKLY' ? accentColor : colors.neutral.textSecondary} 
              style={{ marginRight: 8 }}
            />
            <Text style={[
              { fontSize: 15, fontWeight: '600' },
              { color: recurrenceType === 'WEEKLY' ? accentColor : colors.neutral.textPrimary }
            ]}>
              Hàng tuần
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: recurrenceType === 'MONTHLY' ? accentColor : colors.neutral.border,
                backgroundColor: recurrenceType === 'MONTHLY' ? accentColor + '10' : colors.neutral.white,
              }
            ]}
            onPress={() => {
              setRecurrenceType('MONTHLY');
              setSelectedWeekdays([]);
            }}
          >
            <Ionicons 
              name="calendar" 
              size={20} 
              color={recurrenceType === 'MONTHLY' ? accentColor : colors.neutral.textSecondary}
              style={{ marginRight: 8 }}
            />
            <Text style={[
              { fontSize: 15, fontWeight: '600' },
              { color: recurrenceType === 'MONTHLY' ? accentColor : colors.neutral.textPrimary }
            ]}>
              Hàng tháng
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekly Selection - Improved */}
      {recurrenceType === 'WEEKLY' && (
        <View style={[commonStyles.card, { marginTop: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[commonStyles.cardDescription, { fontWeight: '600', flex: 1 }]}>
              Chọn các ngày trong tuần
            </Text>
            {selectedWeekdays.length > 0 && (
              <View style={{
                backgroundColor: accentColor + '15',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12
              }}>
                <Text style={{ color: accentColor, fontSize: 12, fontWeight: '600' }}>
                  {selectedWeekdays.length} ngày
                </Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
            {[1, 2, 3, 4, 5, 6, 7].map((day, index) => {
              const isSelected = selectedWeekdays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    {
                      flex: 1,
                      aspectRatio: 1,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isSelected ? accentColor : colors.neutral.border,
                      backgroundColor: isSelected ? accentColor : colors.neutral.white,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: isSelected ? accentColor : 'transparent',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: isSelected ? 3 : 0,
                    }
                  ]}
                  onPress={() => toggleWeekday(day)}
                >
                  <Text style={[
                    { 
                      fontSize: 15, 
                      fontWeight: '700',
                      color: isSelected ? colors.neutral.white : colors.neutral.textPrimary
                    }
                  ]}>
                    {weekdayNames[index]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedWeekdays.length === 0 && (
            <View style={{ 
              marginTop: 12, 
              padding: 12, 
              backgroundColor: colors.feedback.warning + '10',
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Ionicons name="information-circle" size={18} color={colors.feedback.warning} style={{ marginRight: 8 }} />
              <Text style={{ color: colors.feedback.warning, fontSize: 13, flex: 1 }}>
                Vui lòng chọn ít nhất 1 ngày trong tuần
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Monthly Selection - Improved */}
      {recurrenceType === 'MONTHLY' && (
        <View style={[commonStyles.card, { marginTop: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[commonStyles.cardDescription, { fontWeight: '600', flex: 1 }]}>
              Chọn các ngày trong tháng
            </Text>
            {selectedMonthDays.length > 0 && (
              <View style={{
                backgroundColor: accentColor + '15',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12
              }}>
                <Text style={{ color: accentColor, fontSize: 12, fontWeight: '600' }}>
                  {selectedMonthDays.length} ngày
                </Text>
              </View>
            )}
          </View>
          
          {/* Calendar Grid Style */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const isSelected = selectedMonthDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    {
                      width: '12.5%',
                      aspectRatio: 1,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: isSelected ? accentColor : colors.neutral.border,
                      backgroundColor: isSelected ? accentColor : colors.neutral.white,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                      shadowColor: isSelected ? accentColor : 'transparent',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 3,
                      elevation: isSelected ? 2 : 0,
                    }
                  ]}
                  onPress={() => toggleMonthDay(day)}
                >
                  <Text style={[
                    { 
                      fontSize: 14, 
                      fontWeight: isSelected ? '700' : '600',
                      color: isSelected ? colors.neutral.white : colors.neutral.textPrimary
                    }
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {selectedMonthDays.length === 0 && (
            <View style={{ 
              marginTop: 8, 
              padding: 12, 
              backgroundColor: colors.feedback.warning + '10',
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Ionicons name="information-circle" size={18} color={colors.feedback.warning} style={{ marginRight: 8 }} />
              <Text style={{ color: colors.feedback.warning, fontSize: 13, flex: 1 }}>
                Vui lòng chọn ít nhất 1 ngày trong tháng
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Time Selection for Recurring - Improved */}
      <View style={[commonStyles.card, { marginTop: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="time" size={20} color={accentColor} style={{ marginRight: 8 }} />
          <Text style={[commonStyles.cardDescription, { fontWeight: '600', flex: 1 }]}>
            Giờ thực hiện
          </Text>
          <Text style={{ color: accentColor, fontSize: 14, fontWeight: '600' }}>
            {recurringTime.substring(0, 5)}
          </Text>
        </View>
        <View style={{ 
          flexDirection: 'row', 
          flexWrap: 'wrap', 
          gap: 8,
        }}>
          {availableTimes.map((time) => {
            const timeWithSeconds = `${time}:00`;
            const isSelected = recurringTime === timeWithSeconds;
            
            return (
              <TouchableOpacity
                key={time}
                style={[
                  {
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: isSelected ? accentColor : colors.neutral.border,
                    backgroundColor: isSelected ? accentColor : colors.neutral.white,
                    shadowColor: isSelected ? accentColor : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                    elevation: isSelected ? 2 : 0,
                  }
                ]}
                onPress={() => setRecurringTime(timeWithSeconds)}
              >
                <Text style={[
                  { fontSize: 14, fontWeight: '600' },
                  { color: isSelected ? colors.neutral.white : colors.neutral.textPrimary }
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Date Range - Improved */}
      <View style={[commonStyles.card, { marginTop: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="calendar-number" size={20} color={accentColor} style={{ marginRight: 8 }} />
          <Text style={[commonStyles.cardDescription, { fontWeight: '600' }]}>
            Khoảng thời gian
          </Text>
        </View>
        
        {/* Start Date */}
        <TouchableOpacity
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              padding: 14,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: startDate ? accentColor : colors.neutral.border,
              backgroundColor: startDate ? accentColor + '08' : colors.neutral.background,
            }
          ]}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Ionicons name="calendar" size={22} color={startDate ? accentColor : colors.neutral.textSecondary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 12, color: colors.neutral.textSecondary, marginBottom: 2 }}>
              Ngày bắt đầu
            </Text>
            <Text style={{ 
              fontSize: 15, 
              fontWeight: '600',
              color: startDate ? colors.neutral.textPrimary : colors.neutral.textSecondary 
            }}>
              {startDate ? formatDateDisplay(startDate) : 'Chọn ngày bắt đầu'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.neutral.textSecondary} />
        </TouchableOpacity>

        {/* End Date (Optional) */}
        <TouchableOpacity
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              padding: 14,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: endDate ? accentColor : colors.neutral.border,
              backgroundColor: endDate ? accentColor + '08' : colors.neutral.background,
              marginTop: 12,
            }
          ]}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Ionicons name="calendar" size={22} color={endDate ? accentColor : colors.neutral.textSecondary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 12, color: colors.neutral.textSecondary, marginBottom: 2 }}>
              Ngày kết thúc (tùy chọn)
            </Text>
            <Text style={{ 
              fontSize: 15, 
              fontWeight: '600',
              color: endDate ? colors.neutral.textPrimary : colors.neutral.textSecondary 
            }}>
              {endDate ? formatDateDisplay(endDate) : 'Không giới hạn'}
            </Text>
          </View>
          {endDate ? (
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                setEndDate('');
              }}
              style={{ padding: 4 }}
            >
              <Ionicons name="close-circle" size={22} color={colors.feedback.error} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors.neutral.textSecondary} />
          )}
        </TouchableOpacity>
        
        {/* Info */}
        <View style={{ 
          marginTop: 12, 
          padding: 10, 
          backgroundColor: colors.primary.navy + '08',
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'flex-start'
        }}>
          <Ionicons name="information-circle" size={16} color={colors.primary.navy} style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={{ color: colors.primary.navy, fontSize: 12, flex: 1, lineHeight: 18 }}>
            {endDate 
              ? 'Lịch sẽ lặp lại từ ngày bắt đầu đến ngày kết thúc theo cấu hình đã chọn'
              : 'Lịch sẽ lặp lại không giới hạn. Bạn có thể hủy bất kỳ lúc nào'}
          </Text>
        </View>
      </View>
    </View>
  );

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
        {selectedLocation && (
          <View style={[commonStyles.card, { margin: 20, marginTop: 0, marginBottom: 12 }]}>
            <Text style={[commonStyles.cardDescription, { marginBottom: 4 }]}>Địa chỉ</Text>
            <Text style={commonStyles.cardTitle}>{selectedLocation.fullAddress}</Text>
            <Text style={commonStyles.cardDescription}>
              {[selectedLocation.ward, selectedLocation.city]
                .filter(item => item && item.trim())
                .join(', ')}
            </Text>
          </View>
        )}

        {/* Booking Mode Selector */}
        {renderBookingModeSelector()}

        {/* Render based on booking mode */}
        {(bookingMode === 'single' || bookingMode === 'multiple') && renderSingleMultipleMode()}
        {bookingMode === 'recurring' && renderRecurringMode()}

      </ScrollView>

      {/* Next Button */}
      <View style={commonStyles.buttonContainer}>
        <TouchableOpacity
          style={[
            commonStyles.primaryButton,
            { justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
            loading && commonStyles.primaryButtonDisabled
          ]}
          onPress={validateAndNext}
          disabled={loading}
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

      {/* Date Pickers */}
      {showDatePicker && (
        <>
          {Platform.OS === 'ios' && (
            <View style={{ backgroundColor: colors.neutral.white, borderRadius: 12, overflow: 'hidden', margin: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.neutral.border }}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={{ color: colors.feedback.error, fontSize: 16, fontWeight: '600' }}>Hủy</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary.navy }}>Chọn ngày</Text>
                <TouchableOpacity onPress={handleDatePickerDone}>
                  <Text style={{ color: accentColor, fontSize: 16, fontWeight: '600' }}>Xong</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDatePickerChange}
                minimumDate={new Date()}
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
            />
          )}
        </>
      )}

      {showTimePicker && (
        <>
          {Platform.OS === 'ios' && (
            <View style={{ backgroundColor: colors.neutral.white, borderRadius: 12, overflow: 'hidden', margin: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.neutral.border }}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={{ color: colors.feedback.error, fontSize: 16, fontWeight: '600' }}>Hủy</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary.navy }}>Chọn giờ</Text>
                <TouchableOpacity onPress={handleTimePickerDone}>
                  <Text style={{ color: accentColor, fontSize: 16, fontWeight: '600' }}>Xong</Text>
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

      {/* Start Date Picker Modal */}
      <Modal
        visible={showStartDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStartDatePicker(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowStartDatePicker(false)}
        >
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 20,
            width: '90%',
            maxWidth: 400,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#000000',
              marginBottom: 16,
              textAlign: 'center',
            }}>
              Chọn ngày bắt đầu
            </Text>
            
            <DateTimePicker
              value={startDate ? new Date(startDate) : new Date()}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                if (date) setStartDate(getDateValue(date));
              }}
              minimumDate={new Date()}
              themeVariant="light"
            />

            <TouchableOpacity
              style={{
                backgroundColor: accentColor,
                borderRadius: 12,
                padding: 16,
                marginTop: 16,
                alignItems: 'center',
              }}
              onPress={() => setShowStartDatePicker(false)}
            >
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
              }}>
                Xong
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* End Date Picker Modal */}
      <Modal
        visible={showEndDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndDatePicker(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowEndDatePicker(false)}
        >
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 20,
            width: '90%',
            maxWidth: 400,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#000000',
              marginBottom: 16,
              textAlign: 'center',
            }}>
              Chọn ngày kết thúc
            </Text>
            
            <DateTimePicker
              value={endDate ? new Date(endDate) : new Date()}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                if (date) setEndDate(getDateValue(date));
              }}
              minimumDate={startDate ? new Date(startDate) : new Date()}
              themeVariant="light"
            />

            <TouchableOpacity
              style={{
                backgroundColor: accentColor,
                borderRadius: 12,
                padding: 16,
                marginTop: 16,
                alignItems: 'center',
              }}
              onPress={() => setShowEndDatePicker(false)}
            >
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
              }}>
                Xong
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
