import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { bookingService } from '../../../../services';
import { useUserInfo } from '../../../../hooks';
import { STORAGE_KEYS } from '../../../../constants';
import { useAuthStore } from '../../../../store/authStore';
import { type LocationData } from './types';
import { commonStyles } from './styles';

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

type LocationOption = 'default' | 'gps' | 'manual';

interface LocationSelectionProps {
  selectedLocation?: LocationData | null;
  preloadedDefaultAddress?: LocationData | null;
  onNext: (location: LocationData) => void;
  onBack: () => void;
}

export const LocationSelection: React.FC<LocationSelectionProps> = ({
  selectedLocation,
  preloadedDefaultAddress,
  onNext,
  onBack
}) => {
  const { userInfo } = useUserInfo();
  const { isAuthenticated, accessToken, user: authUser } = useAuthStore();
  const [selectedOption, setSelectedOption] = useState<LocationOption>('default');
  const [defaultAddress, setDefaultAddress] = useState<LocationData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [manualAddress, setManualAddress] = useState<LocationData>({
    fullAddress: '',
    ward: '',
    district: '',
    city: ''
  });
  const [mapRegion, setMapRegion] = useState<MapRegion>({
    latitude: 10.7769, // Default to Ho Chi Minh City
    longitude: 106.6601,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDefaultAddress, setLoadingDefaultAddress] = useState(false);
  const [hasTriedLoadingDefault, setHasTriedLoadingDefault] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [cachedLocation, setCachedLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    console.log('🎯 LocationSelection mounted:', {
      userInfo,
      isAuthenticated,
      hasAccessToken: !!accessToken,
      timestamp: new Date().toISOString()
    });
    
    // Preload location permissions for faster GPS access
    preloadLocationPermissions();
  }, []);

  // Debug auth state changes
  useEffect(() => {
    console.log('🔄 Auth state changed:', {
      isAuthenticated,
      hasAccessToken: !!accessToken,
      userInfoId: userInfo?.id,
      timestamp: new Date().toISOString()
    });
  }, [isAuthenticated, accessToken, userInfo]);

  useEffect(() => {
    // Use preloaded default address if available
    if (preloadedDefaultAddress) {
      console.log('✅ Using preloaded default address:', preloadedDefaultAddress);
      setDefaultAddress(preloadedDefaultAddress);
      setHasTriedLoadingDefault(true);
    } else if (isAuthenticated && accessToken && !hasTriedLoadingDefault) {
      console.log('🔐 No preloaded data, loading default address...', {
        isAuthenticated,
        hasAccessToken: !!accessToken,
        userInfo: userInfo?.id,
        timestamp: new Date().toISOString()
      });
      loadDefaultAddress();
    } else {
      console.log('⚠️ Authentication not ready yet:', {
        isAuthenticated,
        hasAccessToken: !!accessToken,
        userInfo: userInfo?.id,
        hasPreloaded: !!preloadedDefaultAddress,
        timestamp: new Date().toISOString()
      });
    }
  }, [isAuthenticated, accessToken, userInfo, preloadedDefaultAddress]);

  useEffect(() => {
    // Auto-select appropriate option based on available data
    if (defaultAddress && selectedOption !== 'default') {
      console.log('🎯 Auto-selecting default option');
      setSelectedOption('default');
    } else if (defaultAddress === null && selectedOption === 'default') {
      console.log('🎯 Auto-switching to GPS option - no default address');
      setSelectedOption('gps');
    }
  }, [defaultAddress]);

  const preloadLocationPermissions = async () => {
    try {
      await Location.getForegroundPermissionsAsync();
    } catch (error) {
      console.log('Preload permissions failed:', error);
    }
  };

  useEffect(() => {
    if (selectedLocation) {
      if (selectedLocation.isDefault) {
        setSelectedOption('default');
      } else if (selectedLocation.latitude && selectedLocation.longitude) {
        setSelectedOption('gps');
        setCurrentLocation(selectedLocation);
        setMapRegion({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        setSelectedOption('manual');
        setManualAddress(selectedLocation);
      }
    }
  }, [selectedLocation]);

  const loadDefaultAddress = async () => {
    // Prevent multiple concurrent calls
    if (loadingDefaultAddress || hasTriedLoadingDefault) {
      console.log('🚫 Skipping loadDefaultAddress - already loading or tried');
      return;
    }

    try {
      setLoadingDefaultAddress(true);
      setHasTriedLoadingDefault(true);
      
      // Check token availability for debugging
      let token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      console.log('🔍 Initial token check:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.slice(0, 20)}...` : 'none'
      });
      
      // If no token, wait and retry (authentication might still be in progress)
      if (!token) {
        console.log('⏳ No token found, waiting for authentication...');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
        
        token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        console.log('🔍 Retry token check:', {
          hasToken: !!token,
          tokenLength: token ? token.length : 0,
          tokenPreview: token ? `${token.slice(0, 20)}...` : 'none'
        });
        
        if (!token) {
          console.log('❌ Still no access token found after retry');
          setDefaultAddress(null);
          return;
        }
      }
      
      console.log('Loading default address for user:', userInfo?.id);
      console.log('API Base URL:', process.env.EXPO_PUBLIC_API_BASE_URL);
      console.log('User Info:', {
        id: userInfo?.id,
        roles: userInfo?.roles,
        fullUserInfo: userInfo
      });
      
      // Try multiple sources for customerId
      const customerId = userInfo?.id || (authUser as any)?.customerId;
      console.log('🔍 Customer ID sources:', {
        userInfoId: userInfo?.id,
        authUserCustomerId: (authUser as any)?.customerId,
        finalCustomerId: customerId
      });
      
      if (!customerId) {
        console.log('❌ No customerId available from any source');
        setDefaultAddress(null);
        return;
      }
      
      console.log('Using customerId:', customerId);
      const response = await bookingService.getDefaultAddress(customerId);
      console.log('Default address API response:', response);
      
      // Response is now DefaultAddressResponse directly (not wrapped in ApiResponse)
      const addressData: LocationData = {
        addressId: response.addressId,
        fullAddress: response.fullAddress || '',
        ward: response.ward || '',
        district: '', // Will be extracted from city if needed
        city: response.city || '',
        latitude: response.latitude || 0,
        longitude: response.longitude || 0,
        isDefault: response.isDefault
      };
        
      // Extract district from city if needed for service calls
      // For TP. Hồ Chí Minh, we can use the city itself as district
      if (response.city === 'TP. Hồ Chí Minh') {
        addressData.district = 'TP. Hồ Chí Minh';
      }
      
      setDefaultAddress(addressData);
      console.log('Default address loaded successfully:', addressData);
    } catch (error) {
      console.error('Error loading default address:', error);
      setDefaultAddress(null);
    } finally {
      setLoadingDefaultAddress(false);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập vị trí',
          'Ứng dụng cần quyền truy cập vị trí để sử dụng GPS. Vui lòng cấp quyền trong cài đặt.'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setGettingLocation(false);
        return;
      }

      console.log('Getting current location...');
      
      // Try to get last known location first for faster loading
      let location;
      try {
        const lastKnownLocation = await Location.getLastKnownPositionAsync({
          maxAge: 60000, // 1 minute cache
          requiredAccuracy: 1000, // 1km accuracy for initial load
        });
        
        if (lastKnownLocation) {
          location = lastKnownLocation;
          console.log('Using cached location:', location.coords);
        }
      } catch (error) {
        console.log('No cached location available');
      }

      // If no cached location, get fresh position with optimized settings
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Faster than High
        });
        console.log('Got fresh location:', location.coords);
      }

      const { latitude, longitude } = location.coords;

      // Set coordinates immediately for instant UI feedback
      const quickLocationData: LocationData = {
        fullAddress: `Tọa độ: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        ward: '',
        district: '',
        city: '',
        latitude,
        longitude,
        isDefault: false
      };

      setCurrentLocation(quickLocationData);
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Do reverse geocoding in background for better address
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        console.log('Reverse geocoded address:', address);

        const fullLocationData: LocationData = {
          fullAddress: `${address.name || ''} ${address.street || ''}, ${address.district || ''}, ${address.city || ''}, ${address.region || ''}`.trim() || quickLocationData.fullAddress,
          ward: address.district || '',
          district: address.subregion || '',
          city: address.city || address.region || '',
          latitude,
          longitude,
          isDefault: false
        };

        setCurrentLocation(fullLocationData);
        setCachedLocation(fullLocationData); // Cache for future use
        console.log('Address resolved and updated:', fullLocationData);
      } catch (geocodeError) {
        console.log('Reverse geocoding failed, keeping coordinate display:', geocodeError);
        setCachedLocation(quickLocationData); // Cache coordinates at least
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    console.log('Map pressed at:', { latitude, longitude });
    
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const locationData: LocationData = {
        fullAddress: `${address.name || ''} ${address.street || ''}, ${address.district || ''}, ${address.city || ''}, ${address.region || ''}`.trim(),
        ward: address.district || '',
        district: address.subregion || '',
        city: address.city || address.region || '',
        latitude,
        longitude,
        isDefault: false
      };

      setCurrentLocation(locationData);
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: mapRegion.latitudeDelta,
        longitudeDelta: mapRegion.longitudeDelta,
      });
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleOptionSelect = (option: LocationOption) => {
    // Don't allow selecting default if no default address available
    if (option === 'default' && !defaultAddress) {
      Alert.alert(
        'Không có địa chỉ mặc định', 
        'Bạn chưa có địa chỉ mặc định. Vui lòng sử dụng GPS hoặc nhập địa chỉ mới.'
      );
      return;
    }
    
    setSelectedOption(option);
    
    if (option === 'gps') {
      // Use cached location if available and recent (less than 5 minutes old)
      if (cachedLocation && cachedLocation.latitude && cachedLocation.longitude) {
        setCurrentLocation(cachedLocation);
        // Still get fresh location in background
        getCurrentLocation();
      } else if (!currentLocation) {
        getCurrentLocation();
      }
    }
  };

  const getSelectedLocationData = (): LocationData | null => {
    switch (selectedOption) {
      case 'default':
        return defaultAddress;
      case 'gps':
        return currentLocation;
      case 'manual':
        return manualAddress.fullAddress?.trim() ? manualAddress : null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const locationData = getSelectedLocationData();
    
    if (!locationData) {
      Alert.alert('Thông báo', 'Vui lòng chọn địa điểm hoặc nhập địa chỉ');
      return;
    }

    if (selectedOption === 'manual' && !locationData.fullAddress?.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin địa chỉ');
      return;
    }

    onNext(locationData);
  };

  const renderOptionCard = (
    option: LocationOption,
    title: string,
    subtitle: string,
    icon: string,
    isSelected: boolean,
    disabled: boolean = false
  ) => (
    <TouchableOpacity
      style={[
        commonStyles.card,
        isSelected && commonStyles.cardSelected,
        disabled && { opacity: 0.5 },
        { marginHorizontal: 20 }
      ]}
      onPress={() => !disabled && handleOptionSelect(option)}
      disabled={disabled}
    >
      <View style={commonStyles.flexRow}>
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: disabled ? '#CCC' : (isSelected ? '#007AFF' : '#F0F0F0'),
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16
        }}>
          <Ionicons 
            name={icon as any} 
            size={24} 
            color={disabled ? '#999' : (isSelected ? '#FFF' : '#007AFF')} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[
            commonStyles.cardTitle,
            disabled && { color: '#999' }
          ]}>
            {title}
          </Text>
          <Text style={[
            commonStyles.cardDescription,
            disabled && { color: '#CCC' }
          ]} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMapView = () => (
    <View style={[commonStyles.section, { margin: 20 }]}>
      <Text style={commonStyles.sectionTitle}>Sử dụng vị trí hiện tại</Text>
      <Text style={commonStyles.sectionSubtitle}>Lấy tọa độ GPS của thiết bị</Text>
      
      {gettingLocation && (
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={commonStyles.loadingText}>
            {currentLocation ? 'Đang tìm địa chỉ chính xác...' : 'Đang lấy vị trí hiện tại...'}
          </Text>
        </View>
      )}

      {currentLocation && (
        <View style={[commonStyles.card, { marginVertical: 16 }]}>
          <Text style={commonStyles.cardTitle}>Địa chỉ được chọn:</Text>
          <Text style={[commonStyles.cardDescription, { color: '#007AFF', fontWeight: '600' }]}>
            {currentLocation.fullAddress}
          </Text>
          <Text style={[commonStyles.cardDescription, { fontSize: 12, marginTop: 4 }]}>
            Tọa độ: {currentLocation.latitude?.toFixed(6)}, {currentLocation.longitude?.toFixed(6)}
          </Text>
        </View>
      )}

      {!currentLocation && !gettingLocation && (
        <TouchableOpacity
          style={[commonStyles.secondaryButton, commonStyles.flexRow, { justifyContent: 'center' }]}
          onPress={getCurrentLocation}
        >
          <Ionicons name="location" size={24} color="#007AFF" />
          <Text style={[commonStyles.secondaryButtonText, { marginLeft: 8 }]}>Lấy vị trí hiện tại</Text>
        </TouchableOpacity>
      )}

      {currentLocation && (
        <TouchableOpacity
          style={[commonStyles.secondaryButton, commonStyles.flexRow, { justifyContent: 'center', marginTop: 12 }]}
          onPress={getCurrentLocation}
        >
          <Ionicons name="refresh" size={20} color="#007AFF" />
          <Text style={[commonStyles.secondaryButtonText, { marginLeft: 6 }]}>Cập nhật vị trí</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderManualInput = () => (
    <View style={[commonStyles.section, { margin: 20 }]}>
      <Text style={commonStyles.sectionTitle}>Nhập địa chỉ mới</Text>
      
      <View style={commonStyles.inputContainer}>
        <Text style={commonStyles.inputLabel}>Địa chỉ đầy đủ *</Text>
        <TextInput
          style={[commonStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
          value={manualAddress.fullAddress}
          onChangeText={(text) => setManualAddress({ ...manualAddress, fullAddress: text })}
          placeholder="Ví dụ: 123 Nguyễn Văn Linh, Phường 1, Quận 1, TP.HCM"
          multiline
        />
      </View>

      <View style={commonStyles.flexRow}>
        <View style={[commonStyles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <Text style={commonStyles.inputLabel}>Phường/Xã</Text>
          <TextInput
            style={commonStyles.input}
            value={manualAddress.ward}
            onChangeText={(text) => setManualAddress({ ...manualAddress, ward: text })}
            placeholder="Phường 1"
          />
        </View>
        <View style={[commonStyles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <Text style={commonStyles.inputLabel}>Quận/Huyện</Text>
          <TextInput
            style={commonStyles.input}
            value={manualAddress.district}
            onChangeText={(text) => setManualAddress({ ...manualAddress, district: text })}
            placeholder="Quận 1"
          />
        </View>
      </View>

      <View style={commonStyles.inputContainer}>
        <Text style={commonStyles.inputLabel}>Tỉnh/Thành phố</Text>
        <TextInput
          style={commonStyles.input}
          value={manualAddress.city}
          onChangeText={(text) => setManualAddress({ ...manualAddress, city: text })}
          placeholder="TP. Hồ Chí Minh"
        />
      </View>
    </View>
  );

  return (
    <View style={commonStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Header */}
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={onBack} style={commonStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={commonStyles.headerContent}>
          <Text style={commonStyles.headerTitle}>Chọn địa điểm</Text>
          <Text style={commonStyles.headerSubtitle}>Xác định vị trí dịch vụ</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Option Cards */}
        <View style={{ paddingTop: 16 }}>
          {renderOptionCard(
            'default',
            'Địa chỉ mặc định',
            loadingDefaultAddress 
              ? 'Đang tải địa chỉ...' 
              : (defaultAddress ? (defaultAddress.fullAddress || 'Địa chỉ mặc định') : 'Chưa có địa chỉ mặc định - Vui lòng thêm địa chỉ'),
            'home',
            selectedOption === 'default' && !!defaultAddress,
            loadingDefaultAddress || !defaultAddress // disabled if loading or no default address
          )}

          {renderOptionCard(
            'gps',
            'Vị trí hiện tại',
            'Sử dụng GPS và bản đồ',
            'location',
            selectedOption === 'gps'
          )}

          {renderOptionCard(
            'manual',
            'Nhập địa chỉ mới',
            'Nhập thủ công thông tin địa chỉ',
            'create',
            selectedOption === 'manual'
          )}
        </View>

        {/* Conditional Content */}
        {selectedOption === 'gps' && renderMapView()}
        {selectedOption === 'manual' && renderManualInput()}

        {/* Default Address Details */}
        {selectedOption === 'default' && (
          <View style={[commonStyles.section, { margin: 20 }]}>
            {defaultAddress ? (
              <>
                <Text style={commonStyles.sectionTitle}>Thông tin địa chỉ:</Text>
                <Text style={[commonStyles.cardTitle, { fontWeight: '600' }]}>{defaultAddress.fullAddress}</Text>
                <Text style={commonStyles.cardDescription}>
                  {defaultAddress.ward}, {defaultAddress.district}, {defaultAddress.city}
                </Text>
              </>
            ) : (
              <>
                <Text style={commonStyles.sectionTitle}>
                  {loadingDefaultAddress ? 'Đang tải địa chỉ mặc định...' : 'Không tìm thấy địa chỉ mặc định'}
                </Text>
                {!loadingDefaultAddress && (
                  <TouchableOpacity 
                    style={[commonStyles.secondaryButton, { alignSelf: 'flex-start', marginTop: 8 }]}
                    onPress={() => {
                      setHasTriedLoadingDefault(false);
                      loadDefaultAddress();
                    }}
                  >
                    <Text style={commonStyles.secondaryButtonText}>Thử lại</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={commonStyles.buttonContainer}>
        <TouchableOpacity
          style={[
            commonStyles.primaryButton,
            commonStyles.flexRow,
            { justifyContent: 'center' },
            loading && commonStyles.primaryButtonDisabled
          ]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <Text style={commonStyles.primaryButtonText}>Đang tải...</Text>
          ) : (
            <>
              <Text style={commonStyles.primaryButtonText}>Tiếp tục</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Giữ lại một số styles đặc biệt cho LocationSelection
});