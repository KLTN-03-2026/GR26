import { axiosInstance as api } from '@lib/axios';
import type {
  InvoiceApiResponse,
  ProcessCashPaymentApiResponse,
  ProcessCashPaymentRequest,
  SearchInvoiceApiResponse,
  SearchInvoicesParams,
  PaymentApiResponse,
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

  /**
   * Tìm kiếm danh sách invoice trong chi nhánh hiện tại.
   */
  searchInvoices: async (params?: SearchInvoicesParams): Promise<SearchInvoiceApiResponse> => {
    const response = await api.get<SearchInvoiceApiResponse>('/payments/invoices', {
      params,
    });
    return response.data;
  },

  /**
   * Lấy chi tiết một invoice theo id.
   */
  getInvoice: async (invoiceId: string): Promise<InvoiceApiResponse> => {
    const response = await api.get<InvoiceApiResponse>(`/payments/invoices/${invoiceId}`);
    return response.data;
  },

  /**
   * Lấy chi tiết payment theo id để hiển thị phương thức thanh toán thực tế.
   */
  getPayment: async (paymentId: string): Promise<PaymentApiResponse> => {
    const response = await api.get<PaymentApiResponse>(`/payments/${paymentId}`);
    return response.data;
  },
};
