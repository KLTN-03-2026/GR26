import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  CancelTenantInvoiceResponse,
  CurrentSubscription,
  GeneratePlanPaymentQRPayload,
  PlanQRPayment,
  SubscriptionPlan,
  TenantInvoice,
  TenantInvoiceListParams,
  TenantInvoicePageResponse,
  TenantRenewPayload,
} from '../types/subscription.types';

/**
 * Service thao tác với API gói dịch vụ của tenant hiện tại.
 * Chỉ gọi API và trả về dữ liệu backend.
 */
export const subscriptionService = {
  getCurrentSubscription: async (): Promise<CurrentSubscription> => {
    const response = await api.get<ApiResponse<CurrentSubscription>>('/subscriptions/current');
    return response.data.data;
  },

  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await api.get<ApiResponse<SubscriptionPlan[]>>('/plans');
    return response.data.data;
  },

  getMyInvoices: async (
    params?: TenantInvoiceListParams
  ): Promise<TenantInvoicePageResponse> => {
    const response = await api.get<ApiResponse<TenantInvoicePageResponse>>(
      '/tenant/billing/invoices',
      { params }
    );
    return response.data.data;
  },

  createRenewalInvoice: async (payload: TenantRenewPayload): Promise<TenantInvoice> => {
    const response = await api.post<ApiResponse<TenantInvoice>>(
      '/tenant/billing/renew',
      payload
    );
    return response.data.data;
  },

  generatePaymentQR: async ({
    invoiceId,
    method,
  }: GeneratePlanPaymentQRPayload): Promise<PlanQRPayment> => {
    const response = await api.post<ApiResponse<PlanQRPayment>>(
      `/tenant/billing/invoices/${invoiceId}/pay-qr`,
      { method }
    );
    return response.data.data;
  },

  /**
   * Hủy hóa đơn gói đang chờ thanh toán để owner chọn lại gói khác.
   * Backend tự kiểm tra tenant từ JWT và không yêu cầu lý do hủy.
   */
  cancelInvoice: async (invoiceId: string): Promise<CancelTenantInvoiceResponse> => {
    const response = await api.post<ApiResponse<CancelTenantInvoiceResponse>>(
      `/tenant/billing/invoices/${invoiceId}/cancel`
    );
    return response.data.data;
  },

  /**
   * Đồng bộ trạng thái thanh toán PayOS cho hóa đơn.
   * Gọi PayOS API để kiểm tra xem payment link đã được thanh toán chưa.
   * Dùng khi webhook không chạy (dev/local) hoặc user muốn xác nhận ngay.
   *
   * @returns { justPaid: boolean } — true nếu vừa đánh PAID thành công
   */
  syncPlanPayment: async (invoiceId: string): Promise<{ justPaid: boolean; message: string }> => {
    const response = await api.post<ApiResponse<{ justPaid: boolean; message: string }>>(
      `/tenant/billing/invoices/${invoiceId}/sync-payment`
    );
    return response.data.data;
  },
};
