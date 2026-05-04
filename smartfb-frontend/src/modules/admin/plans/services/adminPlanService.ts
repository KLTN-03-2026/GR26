import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  AdminPlan,
  AdminPlanListParams,
  AdminPlanPageResponse,
  CreateAdminPlanPayload,
  UpdateAdminPlanPayload,
} from '../types/adminPlan.types';

/**
 * Service quản lý gói dịch vụ admin.
 * Chỉ gọi API, không chứa logic UI hoặc business transform.
 */
export const adminPlanService = {
  getPlans: async (params?: AdminPlanListParams): Promise<AdminPlanPageResponse> => {
    const response = await api.get<ApiResponse<AdminPlanPageResponse>>('/admin/plans', {
      params,
    });
    return response.data.data;
  },

  getPlanDetail: async (planId: string): Promise<AdminPlan> => {
    const response = await api.get<ApiResponse<AdminPlan>>(`/admin/plans/${planId}`);
    return response.data.data;
  },

  createPlan: async (payload: CreateAdminPlanPayload): Promise<AdminPlan> => {
    const response = await api.post<ApiResponse<AdminPlan>>('/admin/plans', payload);
    return response.data.data;
  },

  updatePlan: async (
    planId: string,
    payload: UpdateAdminPlanPayload
  ): Promise<AdminPlan> => {
    const response = await api.put<ApiResponse<AdminPlan>>(`/admin/plans/${planId}`, payload);
    return response.data.data;
  },

  deactivatePlan: async (planId: string): Promise<void> => {
    await api.delete(`/admin/plans/${planId}`);
  },
};
