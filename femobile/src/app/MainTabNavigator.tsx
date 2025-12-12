import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../constants';

// Import screens
import {
  CustomerHomeScreen,
  BookingScreen,
  OrdersScreen,
  ConversationListScreen,
  EmployeeDashboard,
  ScheduleScreen,
  RequestsScreen,
  ProfileScreen,
} from '../screens/main';
import { WorkScreen } from '../screens/main/employee';

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  const { user, role, loading } = useAuth();
  const { totalUnread, fetchTotalUnread } = useChatStore();
  const authUser = useAuthStore(state => state.user);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get receiverId based on role
  const receiverId = role === 'CUSTOMER' 
    ? (authUser as any)?.customerId 
    : role === 'EMPLOYEE' 
    ? (authUser as any)?.employeeId 
    : null;

  // Fetch unread count on mount and periodically
  useEffect(() => {
    if (receiverId) {
      // Initial fetch
      fetchTotalUnread(receiverId);
      
      // Auto-refresh every 30 seconds
      intervalRef.current = setInterval(() => {
        fetchTotalUnread(receiverId);
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [receiverId, fetchTotalUnread]);

  // Show loading while determining role
  if (loading || !role) {
    return null; // Or a loading spinner
  }

  // Customer tabs configuration
  const customerTabs = [
    {
      name: 'CustomerHome',
      component: CustomerHomeScreen,
      title: 'Trang chủ',
      icon: 'home',
      focusedIcon: 'home',
    },
    {
      name: 'Booking',
      component: BookingScreen,
      title: 'Đặt lịch',
      icon: 'calendar-outline',
      focusedIcon: 'calendar',
    },
    {
      name: 'Orders',
      component: OrdersScreen,
      title: 'Đơn hàng',
      icon: 'list-outline',
      focusedIcon: 'list',
    },
    {
      name: 'Messages',
      component: ConversationListScreen,
      title: 'Tin nhắn',
      icon: 'chatbubbles-outline',
      focusedIcon: 'chatbubbles',
    },
    {
      name: 'CustomerProfile',
      component: ProfileScreen,
      title: 'Hồ sơ',
      icon: 'person-outline',
      focusedIcon: 'person',
    },
  ];

  // Employee tabs configuration
  const employeeTabs = [
    {
      name: 'EmployeeHome',
      component: EmployeeDashboard,
      title: 'Trang chủ',
      icon: 'home-outline',
      focusedIcon: 'home',
    },
    {
      name: 'Schedule',
      component: ScheduleScreen,
      title: 'Lịch trình',
      icon: 'calendar-outline',
      focusedIcon: 'calendar',
    },
    {
      name: 'Work',
      component: WorkScreen,
      title: 'Công việc',
      icon: 'briefcase-outline',
      focusedIcon: 'briefcase',
    },
    {
      name: 'EmployeeMessages',
      component: ConversationListScreen,
      title: 'Tin nhắn',
      icon: 'chatbubbles-outline',
      focusedIcon: 'chatbubbles',
    },
    {
      name: 'EmployeeProfile',
      component: ProfileScreen,
      title: 'Hồ sơ',
      icon: 'person-outline',
      focusedIcon: 'person',
    },
  ];

  // Choose tabs based on user role
  const tabs = role === 'EMPLOYEE' ? employeeTabs : customerTabs;

  // Safety check to prevent map errors
  if (!tabs || !Array.isArray(tabs)) {
    return null;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingTop: 8,
          paddingBottom: 24, // Increased for iOS home indicator
          height: 86, // Increased to accommodate bottom padding
          elevation: 10,
          shadowColor: COLORS.shadow,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.tertiary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const tab = tabs.find(tab => tab.name === route.name);
          if (!tab) return null;

          const iconName = focused ? tab.focusedIcon : tab.icon;
          
          return (
            <Ionicons 
              name={iconName as any} 
              size={size} 
              color={color}
            />
          );
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      })}
      initialRouteName={role === 'EMPLOYEE' ? 'EmployeeHome' : 'CustomerHome'}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            title: tab.title,
            tabBarLabel: tab.title,
            // Show badge for Messages tab if there are unread messages
            tabBarBadge: (tab.name === 'Messages' || tab.name === 'EmployeeMessages') && totalUnread > 0 
              ? (totalUnread > 99 ? '99+' : totalUnread) 
              : undefined,
            tabBarBadgeStyle: {
              backgroundColor: COLORS.error || '#EF4444',
              fontSize: 10,
              fontWeight: '600',
              minWidth: 18,
              height: 18,
              borderRadius: 9,
            },
          }}
        />
      ))}
    </Tab.Navigator>
  );
};
