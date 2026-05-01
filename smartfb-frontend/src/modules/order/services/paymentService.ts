import axiosInstance from '@/lib/axios';
import type { 
  ApiResponse 
} from '@shared/types/api.types';
import type { 
  CashPaymentRequest, 
  QRPaymentApiResponse,
  PaymentApiResponse,
  PaymentMethod
} from '../types/order.types';

export const paymentService = {
  async initiatePayment(orderId: string, amount: number, method: PaymentMethod): Promise<PaymentApiResponse> {
    const response = await axiosInstance.post<PaymentApiResponse>('/payments', {
      orderId,
      amount,
      method
    });
    return response.data;
  },

  async confirmPayment(paymentId: string, payload: any): Promise<PaymentApiResponse> {
    const response = await axiosInstance.post<PaymentApiResponse>(`/payments/${paymentId}/confirm`, payload);
    return response.data;
  },

  async generateQRPayment(orderId: string): Promise<QRPaymentApiResponse> {
    const response = await axiosInstance.get<QRPaymentApiResponse>(`/payments/qr/${orderId}`);
    return response.data;
  },

  async checkPaymentStatus(orderId: string): Promise<ApiResponse<{ status: string }>> {
    const response = await axiosInstance.get<ApiResponse<{ status: string }>>(`/payments/status/${orderId}`);
    return response.data;
  }
};
