import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingNavigator } from './booking';
import { useEnsureValidToken } from '../../../hooks';

interface BookingScreenProps {
  navigation: any;
  route?: any;
}

export const BookingScreen: React.FC<BookingScreenProps> = ({ navigation, route }) => {
  // Ensure token is valid when component mounts
  useEnsureValidToken();

  const handleClose = () => {
    navigation.goBack();
  };

  // Get serviceId from route params if available
  const initialServiceId = route?.params?.serviceId;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <BookingNavigator 
        navigation={navigation} 
        onClose={handleClose} 
        initialServiceId={initialServiceId}
      />
    </SafeAreaView>
  );
};