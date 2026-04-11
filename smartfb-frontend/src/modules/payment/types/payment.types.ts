import type { ApiResponse } from '@shared/types/api.types';

/**
 * Trạng thái giao dịch thanh toán theo contract backend.
 */
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

/**
 * Phương thức thanh toán backend đang hỗ trợ.
 */
export type PaymentMethod = 'CASH' | 'VIETQR' | 'MOMO' | 'ZALOPAY';

/**
 * Payload xử lý thanh toán tiền mặt.
 * `amount` là số tiền khách thực đưa tại quầy.
 */
export interface ProcessCashPaymentRequest {
  orderId: string;
  amount: number;
}

/**
 * Response payment backend trả về sau khi thanh toán thành công.
 */
export interface PaymentResponse {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  paidAt?: string | null;
  createdAt?: string | null;
}

export type ProcessCashPaymentApiResponse = ApiResponse<PaymentResponse>;
