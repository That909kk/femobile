import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../styles';
import { serviceService, type Service, type Employee } from '../../../../services';
import { type LocationData } from './types';
import { commonStyles } from './styles';
import { ProgressIndicator } from './ProgressIndicator';
import { BookingStep } from './BookingNavigator';

interface EmployeeSelectionProps {
  selectedService: Service | null;
  selectedLocation: LocationData | null;
  selectedDate: string;
  selectedTime: string;
  selectedEmployeeId: string | null;
  onEmployeeSelect: (employeeId: string | null, employee: Employee | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export const EmployeeSelection: React.FC<EmployeeSelectionProps> = ({
  selectedService,
  selectedLocation,
  selectedDate,
  selectedTime,
  selectedEmployeeId,
  onEmployeeSelect,
  onNext,
  onBack,
}) => {
  const accentColor = colors.highlight.teal;
  const successColor = colors.feedback.success;
  const warningColor = colors.feedback.warning;
  const errorColor = colors.feedback.error;

  const [loading, setLoading] = useState(false);
  const [suitableEmployees, setSuitableEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string>('');

  // Load suitable employees when component mounts
  useEffect(() => {
    if (selectedService && selectedLocation && selectedDate && selectedTime) {
      loadSuitableEmployees();
    }
  }, [selectedService, selectedLocation, selectedDate, selectedTime]);

  const loadSuitableEmployees = async () => {
    if (!selectedService || !selectedLocation || !selectedDate || !selectedTime) {
      return;
    }

    // Validate required location data
    if (!selectedLocation.ward || !selectedLocation.city) {
      setError('Thiếu thông tin địa chỉ để tìm nhân viên phù hợp');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Format booking time for API
      const bookingDateTime = `${selectedDate}T${selectedTime}:00`;
      
      console.log('[EmployeeSelection] Loading suitable employees with:', {
        serviceId: selectedService.serviceId,
        bookingTime: bookingDateTime,
        ward: selectedLocation.ward,
        city: selectedLocation.city,
      });
      
      const response = await serviceService.getSuitableEmployees({
        serviceId: selectedService.serviceId,
        bookingTime: bookingDateTime,
        ward: selectedLocation.ward,
        city: selectedLocation.city,
      });

      console.log('[EmployeeSelection] Response received:', response);

      // httpClient.get returns ApiResponse<T> where T is SuitableEmployee[]
      if (response.success && response.data && Array.isArray(response.data)) {
        setSuitableEmployees(response.data);
        console.log('[EmployeeSelection] Set employees:', response.data.length);
      } else {
        const errorMsg = response.message || 'Không thể tải danh sách nhân viên';
        setError(errorMsg);
        console.warn('[EmployeeSelection] Error response:', errorMsg);
        setSuitableEmployees([]);
      }
    } catch (err) {
      console.error('[EmployeeSelection] Error loading suitable employees:', err);
      setError('Có lỗi xảy ra khi tải danh sách nhân viên');
      setSuitableEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    // Allow deselecting by clicking the same employee
    if (selectedEmployeeId === employee.employeeId) {
      onEmployeeSelect(null, null);
    } else {
      onEmployeeSelect(employee.employeeId, employee);
    }
  };

  const renderEmployee = (employee: Employee) => (
    <TouchableOpacity
      key={employee.employeeId}
      style={[
        commonStyles.card,
        { marginBottom: 12, position: 'relative' },
        selectedEmployeeId === employee.employeeId && commonStyles.cardSelected
      ]}
      onPress={() => handleEmployeeSelect(employee)}
    >
      {/* Selected Badge */}
      {selectedEmployeeId === employee.employeeId && (
        <View style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <Ionicons name="checkmark-circle" size={28} color={accentColor} />
        </View>
      )}
      
      <View style={commonStyles.flexRow}>
        <Image
          source={{ uri: employee.avatar || 'https://picsum.photos/200' }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            marginRight: 12,
            backgroundColor: colors.warm.beige,
          }}
          defaultSource={{ uri: 'https://picsum.photos/200' }}
        />
        <View style={{ flex: 1, paddingRight: 36 }}>
          <Text style={commonStyles.cardTitle}>{employee.fullName}</Text>
          <View style={[commonStyles.flexRow, { marginTop: 4, flexWrap: 'wrap' }]}>
            <Ionicons name="star" size={16} color={colors.feedback.warning} />
            <Text style={[commonStyles.cardDescription, { marginLeft: 4 }]}>
              {employee.rating === 'HIGHEST' ? '5.0' : employee.rating}
            </Text>
            <Text style={[commonStyles.cardDescription, { marginLeft: 4 }]}>
              ({employee.completedJobs} công việc)
            </Text>
          </View>
          <Text
            style={[
              commonStyles.cardDescription,
              {
                marginTop: 4,
                color: employee.status === 'AVAILABLE' ? successColor : warningColor,
                fontWeight: '500',
              },
            ]}
          >
            {employee.status}
          </Text>
        </View>
      </View>
      
      {/* Skills */}
      {employee.skills && employee.skills.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={[commonStyles.cardDescription, { marginBottom: 8, fontWeight: '500' }]}>Kỹ năng:</Text>
          <View style={commonStyles.flexRow}>
            {employee.skills.slice(0, 3).map((skill, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: 'rgba(27, 181, 166, 0.12)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginRight: 8,
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: accentColor,
                    fontWeight: '500',
                  }}
                >
                  {skill}
                </Text>
              </View>
            ))}
            {employee.skills.length > 3 && (
              <Text style={[commonStyles.cardDescription, { alignSelf: 'center' }]}>
                +{employee.skills.length - 3} khác
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Working Area */}
      {employee.workingWards && employee.workingCity && (
        <View style={{ marginTop: 12 }}>
          <Text style={[commonStyles.cardDescription, { fontWeight: '500' }]}>Khu vực làm việc:</Text>
          <Text style={[commonStyles.cardDescription, { marginTop: 2 }]}>
            {employee.workingWards.join(', ')} - {employee.workingCity}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={commonStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.warm.beige} />
      
      {/* Header */}
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={onBack} style={commonStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary.navy} />
        </TouchableOpacity>
        <View style={commonStyles.headerContent}>
          <Text style={commonStyles.headerTitle}>Chọn nhân viên</Text>
          <Text style={commonStyles.headerSubtitle}>Tìm nhân viên phù hợp</Text>
        </View>
      </View>

      {/* Progress Indicator */}
      <ProgressIndicator currentStep={BookingStep.EMPLOYEE_SELECTION} />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Service Summary */}
        {selectedService && (
          <View style={[commonStyles.card, { margin: 20, marginBottom: 12 }]}>
            <Text style={[commonStyles.cardDescription, { marginBottom: 4 }]}>Dịch vụ đã chọn</Text>
            <Text style={commonStyles.cardTitle}>{selectedService.name}</Text>
            {selectedService.basePrice && (
              <Text style={[commonStyles.cardPrice, { marginTop: 4 }]}>
                {selectedService.basePrice.toLocaleString('vi-VN')}đ
              </Text>
            )}
          </View>
        )}

        {/* Time & Date Summary */}
        {selectedDate && selectedTime && (
          <View style={[commonStyles.card, { margin: 20, marginTop: 0, marginBottom: 12 }]}>
            <View style={commonStyles.flexRowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.cardDescription, { marginBottom: 4 }]}>Ngày thực hiện</Text>
                <View style={[commonStyles.flexRow, { marginTop: 4 }]}>
                  <Ionicons name="calendar-outline" size={16} color={colors.highlight.teal} />
                  <Text style={[commonStyles.cardTitle, { marginLeft: 6, fontSize: 15 }]}>
                    {new Date(selectedDate).toLocaleDateString('vi-VN', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[commonStyles.cardDescription, { marginBottom: 4 }]}>Giờ bắt đầu</Text>
                <View style={[commonStyles.flexRow, { marginTop: 4 }]}>
                  <Ionicons name="time-outline" size={16} color={colors.highlight.teal} />
                  <Text style={[commonStyles.cardTitle, { marginLeft: 6, fontSize: 15 }]}>
                    {selectedTime}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Location Summary */}
        {selectedLocation && (
          <View style={[commonStyles.card, { margin: 20, marginTop: 0, marginBottom: 12 }]}>
            <Text style={[commonStyles.cardDescription, { marginBottom: 4 }]}>Địa chỉ thực hiện</Text>
            <View style={[commonStyles.flexRow, { marginTop: 4 }]}>
              <Ionicons name="location-outline" size={16} color={colors.highlight.teal} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={[commonStyles.cardTitle, { fontSize: 15 }]}>
                  {selectedLocation.fullAddress}
                </Text>
                {(selectedLocation.ward || selectedLocation.city) && (
                  <Text style={[commonStyles.cardDescription, { marginTop: 4 }]}>
                    {[selectedLocation.ward, selectedLocation.city]
                      .filter(item => item && item.trim())
                      .join(', ')}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Section Header */}
        <View style={[commonStyles.section, { margin: 20, marginTop: 0, paddingTop: 0 }]}>
          <Text style={commonStyles.sectionTitle}>Nhân viên được đề xuất</Text>
          <Text style={commonStyles.sectionSubtitle}>
            Bạn có thể chọn nhân viên cụ thể hoặc bỏ qua để hệ thống tự động phân công
          </Text>

          {loading ? (
            <View style={commonStyles.loadingContainer}>
              <ActivityIndicator size="large" color={accentColor} />
              <Text style={commonStyles.loadingText}>Đang tìm nhân viên phù hợp...</Text>
            </View>
          ) : error ? (
            <View style={commonStyles.errorContainer}>
              <Ionicons name="warning-outline" size={48} color={errorColor} />
              <Text style={commonStyles.errorText}>{error}</Text>
              <TouchableOpacity onPress={loadSuitableEmployees} style={[commonStyles.secondaryButton, { marginTop: 16 }]}>
                <Text style={commonStyles.secondaryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : suitableEmployees.length === 0 ? (
            <View style={[commonStyles.loadingContainer, { paddingVertical: 40 }]}>
              <Ionicons name="people-outline" size={48} color="#8E8E93" />
              <Text style={[commonStyles.loadingText, { marginTop: 16 }]}>Không tìm thấy nhân viên phù hợp</Text>
              <Text style={[commonStyles.cardDescription, { textAlign: 'center', marginTop: 8 }]}>
                Đừng lo lắng, hệ thống sẽ tự động phân công nhân viên tốt nhất cho bạn
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 16 }}>
              {suitableEmployees.map(renderEmployee)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Button Container */}
      <View style={commonStyles.buttonContainer}>
        <TouchableOpacity
          onPress={onNext}
          style={[commonStyles.primaryButton, commonStyles.flexRow, { justifyContent: 'center' }]}
        >
          <Text style={commonStyles.primaryButtonText}>
            {selectedEmployeeId ? "Tiếp tục với nhân viên đã chọn" : "Tiếp tục - Hệ thống tự phân công"}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={colors.neutral.white}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

