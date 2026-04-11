import { axiosInstance as api } from '@lib/axios';
import type {
  ProcessCashPaymentApiResponse,
  ProcessCashPaymentRequest,
} from '../types/payment.types';

/**
 * Service thao tác với API payment.
 * Giữ service thuần gọi API, không đặt logic nghiệp vụ tại đây.
 */
export const paymentService = {
  /**
   * Xử lý thanh toán tiền mặt cho đơn đã tạo.
   */
  processCashPayment: async (
    payload: ProcessCashPaymentRequest
  ): Promise<ProcessCashPaymentApiResponse> => {
    const response = await api.post<ProcessCashPaymentApiResponse>('/payments/cash', payload);
    return response.data;
  },
};
