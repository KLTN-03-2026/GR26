import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  AdminInvoice,
  AdminInvoiceListParams,
  AdminInvoicePageResponse,
  CancelInvoicePayload,
  CreateRenewalInvoicePayload,
  MarkInvoicePaidPayload,
} from '../types/adminBilling.types';

/**
 * Service quản lý hóa đơn subscription trong khu vực admin.
 */
export const adminBillingService = {
  getInvoices: async (params?: AdminInvoiceListParams): Promise<AdminInvoicePageResponse> => {
    const response = await api.get<ApiResponse<AdminInvoicePageResponse>>(
      '/admin/billing/invoices',
      { params }
    );
    return response.data.data;
  },

  getUnpaidInvoices: async (params?: {
    page?: number;
    size?: number;
  }): Promise<AdminInvoicePageResponse> => {
    const response = await api.get<ApiResponse<AdminInvoicePageResponse>>(
      '/admin/billing/invoices/unpaid',
      { params }
    );
    return response.data.data;
  },

  getTenantInvoices: async (
    tenantId: string,
    params?: { page?: number; size?: number }
  ): Promise<AdminInvoicePageResponse> => {
    const response = await api.get<ApiResponse<AdminInvoicePageResponse>>(
      `/admin/billing/tenants/${tenantId}/invoices`,
      { params }
    );
    return response.data.data;
  },

  getInvoiceDetail: async (invoiceId: string): Promise<AdminInvoice> => {
    const response = await api.get<ApiResponse<AdminInvoice>>(
      `/admin/billing/invoices/${invoiceId}`
    );
    return response.data.data;
  },

  createRenewalInvoice: async (
    payload: CreateRenewalInvoicePayload
  ): Promise<AdminInvoice> => {
    const response = await api.post<ApiResponse<AdminInvoice>>(
      '/admin/billing/invoices',
      payload
    );
    return response.data.data;
  },

  markInvoicePaid: async (
    invoiceId: string,
    payload: MarkInvoicePaidPayload
  ): Promise<AdminInvoice> => {
    const response = await api.put<ApiResponse<AdminInvoice>>(
      `/admin/billing/invoices/${invoiceId}/paid`,
      payload
    );
    return response.data.data;
  },

  cancelInvoice: async (
    invoiceId: string,
    payload: CancelInvoicePayload
  ): Promise<void> => {
    await api.put(`/admin/billing/invoices/${invoiceId}/cancel`, payload);
  },
};
