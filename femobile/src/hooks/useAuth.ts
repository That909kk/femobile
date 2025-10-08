import { useAuthStore } from '../store/authStore';

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
    isAdmin: role === 'ADMIN',
    
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
