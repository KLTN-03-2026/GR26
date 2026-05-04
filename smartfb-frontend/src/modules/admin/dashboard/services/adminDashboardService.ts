import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  AdminDashboardRawData,
  AdminInvoiceSummary,
  AdminPageResponse,
  AdminPlanPageResponse,
  AdminTenantSummary,
} from '../types/adminDashboard.types';

const TENANT_PREVIEW_SIZE = 5;
const TENANT_DISTRIBUTION_SIZE = 100;
const PLAN_OVERVIEW_SIZE = 100;
const INVOICE_PREVIEW_SIZE = 5;

/**
 * Service dashboard admin chỉ chịu trách nhiệm gọi API.
 * Logic tổng hợp số liệu nằm ở hook để giữ đúng boundary Page -> Hook -> Service.
 */
export const adminDashboardService = {
  getTenants: async (params?: {
    page?: number;
    size?: number;
    status?: string;
  }): Promise<AdminPageResponse<AdminTenantSummary>> => {
    const response = await api.get<ApiResponse<AdminPageResponse<AdminTenantSummary>>>(
      '/admin/tenants',
      { params }
    );
    return response.data.data;
  },

  getPlans: async (): Promise<AdminPlanPageResponse> => {
    const response = await api.get<ApiResponse<AdminPlanPageResponse>>('/admin/plans', {
      params: {
        page: 0,
        size: PLAN_OVERVIEW_SIZE,
      },
    });
    return response.data.data;
  },

  getUnpaidInvoices: async (): Promise<AdminPageResponse<AdminInvoiceSummary>> => {
    const response = await api.get<ApiResponse<AdminPageResponse<AdminInvoiceSummary>>>(
      '/admin/billing/invoices/unpaid',
      {
        params: {
          page: 0,
          size: INVOICE_PREVIEW_SIZE,
        },
      }
    );
    return response.data.data;
  },

  getDashboardRawData: async (): Promise<AdminDashboardRawData> => {
    const [
      tenantsPage,
      tenantDistributionPage,
      activeTenantsPage,
      suspendedTenantsPage,
      plansPage,
      unpaidInvoicesPage,
    ] = await Promise.all([
      adminDashboardService.getTenants({ page: 0, size: TENANT_PREVIEW_SIZE }),
      adminDashboardService.getTenants({ page: 0, size: TENANT_DISTRIBUTION_SIZE }),
      adminDashboardService.getTenants({ page: 0, size: 1, status: 'ACTIVE' }),
      adminDashboardService.getTenants({ page: 0, size: 1, status: 'SUSPENDED' }),
      adminDashboardService.getPlans(),
      adminDashboardService.getUnpaidInvoices(),
    ]);

    return {
      tenantsPage,
      tenantDistributionPage,
      activeTenantsPage,
      suspendedTenantsPage,
      plansPage,
      unpaidInvoicesPage,
    };
  },
};
