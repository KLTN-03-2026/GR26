import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  CancelTenantInvoiceResponse,
  CurrentSubscription,
  GeneratePlanPaymentQRPayload,
  PlanQRPayment,
  SubscriptionPlan,
  TenantPackageUsage,
  TenantInvoice,
  TenantInvoiceListParams,
  TenantInvoicePageResponse,
  TenantRenewPayload,
} from '../types/subscription.types';

interface BackendPageResponse {
  totalElements: number;
}

type PackageUsageMenuItemType = 'SELLABLE' | 'INGREDIENT' | 'SUB_ASSEMBLY';

// Các loại item backend tính vào quota món của gói dịch vụ.
const PACKAGE_USAGE_MENU_ITEM_TYPES: PackageUsageMenuItemType[] = ['SELLABLE', 'INGREDIENT', 'SUB_ASSEMBLY'];

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

  /**
   * Lấy số lượng dữ liệu hiện tại của tenant để FE so sánh với limit của gói.
   * Dùng các endpoint sẵn có vì backend chưa có API usage tổng hợp.
   */
  getTenantPackageUsage: async (): Promise<TenantPackageUsage> => {
    const [branchesResponse, activeStaffResponse, menuItemCounts] = await Promise.all([
      api.get<ApiResponse<unknown[]>>('/branches'),
      api.get<ApiResponse<BackendPageResponse>>('/staff', {
        params: { status: 'ACTIVE', page: 0, size: 1 },
      }),
      Promise.all(
        PACKAGE_USAGE_MENU_ITEM_TYPES.map(async (type) => {
          const response = await api.get<ApiResponse<BackendPageResponse>>('/menu/items', {
            params: { type, page: 0, size: 1 },
          });

          return response.data.data.totalElements;
        })
      ),
    ]);

    return {
      branches: branchesResponse.data.data.length,
      staff: activeStaffResponse.data.data.totalElements,
      menuItems: menuItemCounts.reduce((total, count) => total + count, 0),
    };
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
