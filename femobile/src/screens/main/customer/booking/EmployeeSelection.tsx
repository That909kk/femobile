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
      
      const response = await serviceService.getSuitableEmployees({
        serviceId: selectedService.serviceId,
        bookingTime: bookingDateTime,
        ward: selectedLocation.ward,
        city: selectedLocation.city,
      });

      if (response && response.data && Array.isArray(response.data)) {
        // Extract the employee data array from response
        setSuitableEmployees(response.data);
      } else if (response && response.data) {
        // Handle case where response.data is the response object itself
        if (response.data.success && response.data.data) {
          setSuitableEmployees(response.data.data);
        } else {
          setError(response.data.message || 'Không thể tải danh sách nhân viên');
        }
      } else {
        setError('Không thể tải danh sách nhân viên');
      }
    } catch (err) {
      console.error('Error loading suitable employees:', err);
      setError('Có lỗi xảy ra khi tải danh sách nhân viên');
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

  const handleSkip = () => {
    onEmployeeSelect(null, null);
    onNext();
  };

  const renderEmployee = (employee: Employee) => (
    <TouchableOpacity
      key={employee.employeeId}
      style={[
        commonStyles.card,
        { marginBottom: 12 },
        selectedEmployeeId === employee.employeeId && commonStyles.cardSelected
      ]}
      onPress={() => handleEmployeeSelect(employee)}
    >
      <View style={commonStyles.flexRowBetween}>
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
          <View style={{ flex: 1 }}>
            <Text style={commonStyles.cardTitle}>{employee.fullName}</Text>
            <View style={[commonStyles.flexRow, { marginTop: 4 }]}>
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
        {selectedEmployeeId === employee.employeeId && (
          <Ionicons name="checkmark-circle" size={24} color={accentColor} />
        )}
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

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Service Info Summary */}
        <View style={[commonStyles.card, { margin: 20, marginBottom: 12 }]}>
          <Text style={commonStyles.cardTitle}>{selectedService?.name}</Text>
          <Text style={[commonStyles.cardDescription, { marginTop: 8 }]}>
            📅 {selectedDate} • ⏰ {selectedTime}
          </Text>
          <Text style={[commonStyles.cardDescription, { marginTop: 4 }]}>
            📍 {selectedLocation?.fullAddress}
          </Text>
        </View>

        {/* Section Header */}
        <View style={[commonStyles.section, { margin: 20, marginTop: 0, paddingTop: 12 }]}>
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
        <View style={commonStyles.flexRow}>
          <TouchableOpacity 
            onPress={handleSkip} 
            style={[commonStyles.secondaryButton, { flex: 1, marginRight: 8 }]}
          >
            <Text style={commonStyles.secondaryButtonText}>Bỏ qua</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNext}
            style={[commonStyles.primaryButton, { flex: 1, marginLeft: 8 }]}
          >
            <Text style={commonStyles.primaryButtonText}>
              {selectedEmployeeId ? "Tiếp tục" : "Hệ thống phân công"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

