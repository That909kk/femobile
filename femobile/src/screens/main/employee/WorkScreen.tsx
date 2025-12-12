import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MyAssignmentsScreen } from './MyAssignmentsScreen';
import AvailableBookingsScreen from './AvailableBookingsScreen';
import { COLORS, UI } from '../../../constants';

const TEAL_COLOR = '#1bb5a6';
const SCREEN_WIDTH = Dimensions.get('window').width;

type TabType = 'my-assignments' | 'available-bookings';

export const WorkScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('my-assignments');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Công việc</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'my-assignments' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('my-assignments')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'my-assignments' && styles.activeTabText,
            ]}
          >
            Công việc của tôi
          </Text>
          {activeTab === 'my-assignments' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'available-bookings' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('available-bookings')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'available-bookings' && styles.activeTabText,
            ]}
          >
            Bài đăng
          </Text>
          {activeTab === 'available-bookings' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'my-assignments' ? (
          <MyAssignmentsScreen />
        ) : (
          <AvailableBookingsScreen />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: UI.SPACING.lg,
    paddingVertical: UI.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: UI.SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: TEAL_COLOR,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: TEAL_COLOR,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  content: {
    flex: 1,
  },
});
