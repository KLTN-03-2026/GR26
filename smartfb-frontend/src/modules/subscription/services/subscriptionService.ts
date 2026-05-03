import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
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
};
