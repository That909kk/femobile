import { httpClient } from './httpClient';
import type { ApiResponse } from '../types/auth';

/**
 * OTP Service cho Mobile App
 * Base URL: /api/v1/otp
 * Tương tự như web src/api/otp.ts
 */

// Request/Response Types
export interface SendOtpRequest {
  email: string;
  otpType: 'VERIFY_EMAIL';
}

export interface SendOtpResponse extends ApiResponse {
  success: boolean;
  message: string;
  expirationSeconds: number;
  cooldownSeconds: number;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse extends ApiResponse {
  success: boolean;
  message: string;
}

export interface ResendCooldownResponse extends ApiResponse {
  success: boolean;
  cooldownSeconds: number;
  canResend: boolean;
}

class OtpService {
  /**
   * Gửi OTP xác thực email
   * POST /otp/email/send
   */
  async sendEmailOtp(data: SendOtpRequest): Promise<SendOtpResponse> {
    console.log('[OtpService] Sending OTP to email:', data.email);
    const response = await httpClient.post<SendOtpResponse>('/otp/email/send', data);
    return response as SendOtpResponse;
  }

  /**
   * Xác thực OTP email
   * POST /otp/email/verify
   */
  async verifyEmailOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    console.log('[OtpService] Verifying OTP for email:', data.email);
    const response = await httpClient.post<VerifyOtpResponse>('/otp/email/verify', data);
    return response as VerifyOtpResponse;
  }

  /**
   * Kiểm tra thời gian cooldown gửi lại OTP
   * GET /otp/email/resend-cooldown
   */
  async checkResendCooldown(email: string): Promise<ResendCooldownResponse> {
    console.log('[OtpService] Checking resend cooldown for email:', email);
    const response = await httpClient.get<ResendCooldownResponse>('/otp/email/resend-cooldown', {
      params: { email }
    });
    return response as ResendCooldownResponse;
  }
}

export const otpService = new OtpService();
