import { axiosInstance as api } from '@lib/axios';
import type {
  CreatePositionRequest,
  StaffPosition,
  UpdatePositionRequest,
} from '@modules/staff/types/position.types';
import type { ApiResponse } from '@shared/types/api.types';

export const positionService = {
  /**
   * GET /api/v1/positions - Lấy danh sách chức vụ đang active.
   */
  getList: async (): Promise<StaffPosition[]> => {
    const response = await api.get<ApiResponse<StaffPosition[]>>('/positions');
    return response.data.data;
  },

  /**
   * POST /api/v1/positions - Tạo chức vụ mới.
   */
  create: async (payload: CreatePositionRequest): Promise<string> => {
    const response = await api.post<ApiResponse<string>>('/positions', payload);
    return response.data.data;
  },

  /**
   * PUT /api/v1/positions/{id} - Cập nhật thông tin chức vụ.
   */
  update: async (id: string, payload: UpdatePositionRequest): Promise<void> => {
    await api.put<ApiResponse<null>>(`/positions/${id}`, payload);
  },

  /**
   * PUT /api/v1/positions/{id}/toggle?active=...
   * Backend dùng query param `active`, không nhận body.
   */
  toggleActive: async (id: string, active: boolean): Promise<void> => {
    await api.put<ApiResponse<null>>(`/positions/${id}/toggle`, null, {
      params: { active },
    });
  },
};
