import { axiosInstance as api } from '@lib/axios';
import type {
  InvoiceApiResponse,
  ProcessCashPaymentApiResponse,
  ProcessCashPaymentRequest,
  ProcessQRPaymentApiResponse,
  ProcessQRPaymentRequest,
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
   * Tạo QR code thanh toán cho đơn hàng.
   * BE trả về `qrCodeUrl` — FE render thành hình QR để khách quét.
   * QR có hiệu lực 3 phút (expiresInSeconds = 180).
   */
  processQRPayment: async (
    payload: ProcessQRPaymentRequest
  ): Promise<ProcessQRPaymentApiResponse> => {
    const response = await api.post<ProcessQRPaymentApiResponse>('/payments/qr', payload);
    return response.data;
  },

  /**
   * Thu ngân xác nhận thủ công khi webhook từ gateway không đến.
   * Dùng sau khi kiểm tra sổ phụ ngân hàng thấy tiền đã vào.
   */
  manualConfirmQRPayment: async (paymentId: string): Promise<void> => {
    await api.post(`/payments/${paymentId}/confirm`);
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
   * Lấy chi tiết payment theo id để poll trạng thái QR hoặc hiển thị phương thức thanh toán.
   */
  getPayment: async (paymentId: string): Promise<PaymentApiResponse> => {
    const response = await api.get<PaymentApiResponse>(`/payments/${paymentId}`);
    return response.data;
  },

  /**
   * Đồng bộ trạng thái thanh toán QR từ gateway.
   * Dùng cho PayOS local/dev khi webhook chưa có HTTPS public URL callback.
   */
  syncPaymentStatus: async (paymentId: string): Promise<PaymentApiResponse> => {
    const response = await api.post<PaymentApiResponse>(`/payments/${paymentId}/sync-status`);
    return response.data;
  },
};
