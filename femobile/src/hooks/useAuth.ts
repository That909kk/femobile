import { useAuthStore } from '../store/authStore';

/**
 * Custom hook for authentication and user data access
 * 
 * @example
 * ```tsx
 * const { isAuthenticated, user, accountId, userId, role } = useAuth();
 * 
 * // Use accountId for API calls that need it
 * const { fetchConversations } = useChatStore();
 * useEffect(() => {
 *   if (accountId) {
 *     fetchConversations(accountId);
 *   }
 * }, [accountId]);
 * 
 * // Use userId for role-specific API calls
 * if (isCustomer && userId) {
 *   // userId is customerId
 *   bookingService.getCustomerBookings(userId);
 * }
 * ```
 */
export const useAuth = () => {
  const {
    // State
    isAuthenticated,
    user,
    role,
    loading,
    error,
    
    // Actions
    login,
    register,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyOTP,
    resendOTP,
    refreshSession,
    checkAuthStatus,
    setLoading,
    setError,
    clearError,
    clearAuth,
  } = useAuthStore();

  return {
    // State
    isAuthenticated,
    user,
    role,
    loading,
    error,
    
    // Computed values
    isCustomer: role === 'CUSTOMER',
    isEmployee: role === 'EMPLOYEE',
    isAdmin: false, // ADMIN role not supported in mobile app
    accountId: user?.accountId || null,
    userId: role === 'CUSTOMER' 
      ? (user as any)?.customerId 
      : role === 'EMPLOYEE' 
      ? (user as any)?.employeeId 
      : role === 'ADMIN'
      ? (user as any)?.adminId
      : null,
    
    // Actions
    login,
    register,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyOTP,
    resendOTP,
    refreshSession,
    checkAuthStatus,
    setLoading,
    setError,
    clearError,
    clearAuth,
  };
};
