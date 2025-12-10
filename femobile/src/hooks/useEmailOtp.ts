import { useState, useCallback, useEffect, useRef } from 'react';
import { otpService } from '../services/otpService';
import type { SendOtpResponse, VerifyOtpResponse } from '../services/otpService';

/**
 * Hook xử lý Email OTP cho Mobile App
 * Tương tự như web src/hooks/useEmailOtp.ts
 */

interface UseEmailOtpReturn {
  // State
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  cooldownSeconds: number;
  expirationSeconds: number;
  canResend: boolean;
  
  // Actions
  sendOtp: (email: string) => Promise<SendOtpResponse>;
  verifyOtp: (email: string, otp: string) => Promise<VerifyOtpResponse>;
  checkCooldown: (email: string) => Promise<void>;
  clearError: () => void;
  clearSuccessMessage: () => void;
}

export const useEmailOtp = (): UseEmailOtpReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [expirationSeconds, setExpirationSeconds] = useState(0);
  const [canResend, setCanResend] = useState(true);
  
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expirationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
      if (expirationIntervalRef.current) {
        clearInterval(expirationIntervalRef.current);
      }
    };
  }, []);

  // Start cooldown countdown
  const startCooldownCountdown = useCallback((seconds: number) => {
    setCooldownSeconds(seconds);
    setCanResend(false);
    
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }
    
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
          }
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Start expiration countdown
  const startExpirationCountdown = useCallback((seconds: number) => {
    setExpirationSeconds(seconds);
    
    if (expirationIntervalRef.current) {
      clearInterval(expirationIntervalRef.current);
    }
    
    expirationIntervalRef.current = setInterval(() => {
      setExpirationSeconds((prev) => {
        if (prev <= 1) {
          if (expirationIntervalRef.current) {
            clearInterval(expirationIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Send OTP
  const sendOtp = useCallback(async (email: string): Promise<SendOtpResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await otpService.sendEmailOtp({
        email,
        otpType: 'VERIFY_EMAIL'
      });
      
      if (response.success) {
        setSuccessMessage(response.message);
        startCooldownCountdown(response.cooldownSeconds);
        startExpirationCountdown(response.expirationSeconds);
      } else {
        setError(response.message);
      }
      
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Gửi OTP thất bại. Vui lòng thử lại.';
      setError(errorMessage);
      
      // Handle 429 rate limit - extract remaining cooldown from message if available
      if (err.response?.status === 429) {
        const match = errorMessage.match(/(\d+)\s*giây/);
        if (match) {
          startCooldownCountdown(parseInt(match[1], 10));
        }
      }
      
      // Handle 400 error - có thể là do cooldown hoặc lý do khác
      if (err.response?.status === 400) {
        const match = errorMessage.match(/(\d+)\s*giây/);
        if (match) {
          startCooldownCountdown(parseInt(match[1], 10));
        }
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [startCooldownCountdown, startExpirationCountdown]);

  // Verify OTP
  const verifyOtp = useCallback(async (email: string, otp: string): Promise<VerifyOtpResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await otpService.verifyEmailOtp({ email, otp });
      
      if (response.success) {
        setSuccessMessage(response.message);
        // Clear expiration countdown on success
        if (expirationIntervalRef.current) {
          clearInterval(expirationIntervalRef.current);
        }
        setExpirationSeconds(0);
      } else {
        setError(response.message);
      }
      
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Xác thực OTP thất bại. Vui lòng thử lại.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check cooldown
  const checkCooldown = useCallback(async (email: string): Promise<void> => {
    try {
      const response = await otpService.checkResendCooldown(email);
      
      if (response.success) {
        if (response.cooldownSeconds > 0) {
          startCooldownCountdown(response.cooldownSeconds);
        } else {
          setCanResend(true);
        }
      }
    } catch (err: any) {
      console.warn('Failed to check cooldown:', err);
    }
  }, [startCooldownCountdown]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  return {
    loading,
    error,
    successMessage,
    cooldownSeconds,
    expirationSeconds,
    canResend,
    sendOtp,
    verifyOtp,
    checkCooldown,
    clearError,
    clearSuccessMessage
  };
};
