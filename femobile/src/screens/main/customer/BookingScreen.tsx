import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingNavigator } from './booking';
import { useEnsureValidToken } from '../../../hooks';

interface BookingScreenProps {
  navigation: any;
}

export const BookingScreen: React.FC<BookingScreenProps> = ({ navigation }) => {
  // Ensure token is valid when component mounts
  useEnsureValidToken();

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <BookingNavigator navigation={navigation} onClose={handleClose} />
    </SafeAreaView>
  );
};