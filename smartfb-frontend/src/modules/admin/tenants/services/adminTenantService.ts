import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  AdminPageResponse,
  AdminSubscription,
  AdminTenantDetail,
  AdminTenantListParams,
  AdminTenantPlanPageResponse,
  AdminTenantSummary,
  ChangeTenantPlanPayload,
  SuspendTenantPayload,
} from '../types/adminTenant.types';

/**
 * Service quản lý tenant admin.
 * Chỉ gọi API, không chứa logic hiển thị hoặc xử lý state.
 */
export const adminTenantService = {
  getTenants: async (
    params?: AdminTenantListParams
  ): Promise<AdminPageResponse<AdminTenantSummary>> => {
    const response = await api.get<ApiResponse<AdminPageResponse<AdminTenantSummary>>>(
      '/admin/tenants',
      { params }
    );
    return response.data.data;
  },

  getTenantDetail: async (tenantId: string): Promise<AdminTenantDetail> => {
    const response = await api.get<ApiResponse<AdminTenantDetail>>(`/admin/tenants/${tenantId}`);
    return response.data.data;
  },

  suspendTenant: async (tenantId: string, payload: SuspendTenantPayload): Promise<void> => {
    await api.put(`/admin/tenants/${tenantId}/suspend`, payload);
  },

  reactivateTenant: async (tenantId: string): Promise<void> => {
    await api.put(`/admin/tenants/${tenantId}/reactivate`);
  },

  changeTenantPlan: async (
    tenantId: string,
    payload: ChangeTenantPlanPayload
  ): Promise<AdminSubscription> => {
    const response = await api.put<ApiResponse<AdminSubscription>>(
      `/admin/tenants/${tenantId}/plan`,
      payload
    );
    return response.data.data;
  },

  getActivePlans: async (): Promise<AdminTenantPlanPageResponse> => {
    const response = await api.get<ApiResponse<AdminTenantPlanPageResponse>>('/admin/plans', {
      params: {
        page: 0,
        size: 100,
        activeOnly: true,
      },
    });
    return response.data.data;
  },
};
