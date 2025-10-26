import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks';
import { COLORS } from '../constants';

// Import screens
import {
  CustomerHomeScreen,
  BookingScreen,
  OrdersScreen,
  EmployeeDashboard,
  ScheduleScreen,
  RequestsScreen,
  ProfileScreen,
} from '../screens/main';

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  const { user, role } = useAuth();
  
  console.log('MainTabNavigator rendered with role:', role);

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
      icon: 'home',
      focusedIcon: 'home',
    },
    {
      name: 'Schedule',
      component: ScheduleScreen,
      title: 'Lịch làm việc',
      icon: 'calendar-outline',
      focusedIcon: 'calendar',
    },
    {
      name: 'Requests',
      component: RequestsScreen,
      title: 'Yêu cầu',
      icon: 'notifications-outline',
      focusedIcon: 'notifications',
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
          }}
        />
      ))}
    </Tab.Navigator>
  );
};
