// Payment related types

export interface PaymentMethod {
  methodId: number;
  methodCode: string;
  methodName: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
}

export interface Payment {
  paymentId: string;
  bookingId: string;
  amount: number;
  formattedAmount: string;
  paymentMethod: PaymentMethod | string;
  paymentStatus: PaymentStatus;
  transactionCode?: string;
  vnpayTransactionId?: string;
  vnpayResponseCode?: string;
  createdAt: string;
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export interface PaymentRequest {
  bookingId: string;
  paymentMethodId: number;
  amount: number;
  returnUrl?: string;
}

export interface VNPayPaymentRequest {
  bookingId: string;
  amount: number;
  orderInfo: string;
  returnUrl: string;
}

export interface VNPayPaymentResponse {
  success: boolean;
  message: string;
  paymentUrl?: string;
  transactionId?: string;
}

export interface VNPayCallbackParams {
  vnp_TxnRef: string;
  vnp_Amount: string;
  vnp_OrderInfo: string;
  vnp_ResponseCode: string;
  vnp_TransactionNo: string;
  vnp_BankCode: string;
  vnp_PayDate: string;
  vnp_SecureHash: string;
}

export interface PaymentHistory {
  payments: Payment[];
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  page: number;
  totalPages: number;
}

export interface PaymentConfirmation {
  success: boolean;
  paymentId: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
  message: string;
}
