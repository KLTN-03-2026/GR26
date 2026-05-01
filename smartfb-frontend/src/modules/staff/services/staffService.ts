import { axiosInstance as api } from '@lib/axios';
import type {
  StaffSummary,
  StaffDetail,
  CreateStaffRequest,
  UpdateStaffRequest,
  DeactivateStaffRequest,
} from '../types/staff.types';
import type { ApiResponse } from '@shared/types/api.types';

// API response wrapper for paginated data
interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  first: boolean;
  last: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  empty: boolean;
}

export const staffService = {
  /**
   * GET /api/v1/staff - Danh sách nhân viên
   */
  getList: async (params?: {
    keyword?: string;
    status?: string;
    positionId?: string;
    page?: number;
    size?: number;
  }): Promise<{ content: StaffSummary[]; totalElements: number; totalPages: number }> => {
    const response = await api.get<ApiResponse<PageResponse<StaffSummary>>>('/staff', { 
      params: {
        ...params,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      }
    });
    const data = response.data.data;
    return {
      content: data.content,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
    };
  },

  /**
   * GET /api/v1/staff/{id} - Chi tiết nhân viên
   */
  getById: async (id: string): Promise<StaffDetail> => {
    const response = await api.get<ApiResponse<StaffDetail>>(`/staff/${id}`);
    return response.data.data;
  },

  /**
   * POST /api/v1/staff - Tạo nhân viên mới
   */
  create: async (payload: CreateStaffRequest): Promise<string> => {
    const response = await api.post<ApiResponse<string>>('/staff', payload);

    return response.data.data;
  },

  /**
   * PUT /api/v1/staff/{id} - Cập nhật nhân viên
   */
  update: async (id: string, payload: UpdateStaffRequest): Promise<void> => {
    await api.put<ApiResponse<void>>(`/staff/${id}`, payload);
  },

  /**
   * DELETE /api/v1/staff/{id} - Vô hiệu hoá nhân viên (soft delete)
   * Cần body: { reason: string }
   */
  deactivate: async (id: string, reason: string): Promise<void> => {
    const payload: DeactivateStaffRequest = { reason };
    await api.delete<ApiResponse<void>>(`/staff/${id}`, {
      data: payload,
    });
  },

  /**
   * PUT /api/v1/staff/{id}/roles - Gán roles cho nhân viên
   */
  assignRoles: async (id: string, roleIds: string[]): Promise<void> => {
    await api.put<ApiResponse<void>>(`/staff/${id}/roles`, { roleIds });
  },

  /**
   * Cập nhật trạng thái nhân viên (khóa/mở khóa)
   * Sử dụng API update staff với status field
   */
  updateStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<StaffDetail> => {
    await api.put<ApiResponse<void>>(`/staff/${id}`, { status });
    const updatedStaff = await staffService.getById(id);
    return updatedStaff;
  },
};
