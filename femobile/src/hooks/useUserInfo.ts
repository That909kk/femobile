import { useState, useEffect } from 'react';
import { userInfoService, UserInfo } from '../services/userInfoService';
import { useAuth } from './useAuth';

export interface UseUserInfoResult {
  userInfo: UserInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserInfo = (): UseUserInfoResult => {
  const { user, role } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = async () => {
    if (!user || !role) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let userId: string;
      
      // Extract user ID based on role
      if (role === 'CUSTOMER') {
        userId = (user as any).customerId || (user as any).id || 'c1000001-0000-0000-0000-000000000003';
      } else if (role === 'EMPLOYEE') {
        userId = (user as any).employeeId || (user as any).id || 'e1000001-0000-0000-0000-000000000001';
      } else {
        throw new Error('Unsupported user role');
      }

      console.log('Attempting to fetch user info for:', { 
        role, 
        userId, 
        user: user ? {
          customerId: (user as any).customerId,
          employeeId: (user as any).employeeId,
          id: (user as any).id,
          username: (user as any).username
        } : null
      });

      const info = await userInfoService.getUserInfo(role, userId);
      setUserInfo(info);
    } catch (err) {
      // Set error and clear user info
      console.error('Failed to fetch user info from API:', err);
      setError(err instanceof Error ? err.message : 'Không thể tải thông tin người dùng');
      setUserInfo(null); // No fallback data
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchUserInfo();
  };

  useEffect(() => {
    if (user && role) {
      fetchUserInfo();
    }
  }, [user, role]);

  return {
    userInfo,
    loading,
    error,
    refetch,
  };
};