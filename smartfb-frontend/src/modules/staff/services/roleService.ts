import { axiosInstance as api } from '@lib/axios';
import type {
  CreateRoleRequest,
  StaffRoleMatrixResponse,
  UpdateRolePermissionsRequest,
} from '@modules/staff/types/role.types';
import type { ApiResponse } from '@shared/types/api.types';

export const roleService = {
  /**
   * GET /api/v1/roles - Lấy toàn bộ role của tenant và danh sách permission hệ thống.
   */
  getMatrix: async (): Promise<StaffRoleMatrixResponse> => {
    const response = await api.get<ApiResponse<StaffRoleMatrixResponse>>('/roles');
    return response.data.data;
  },

  /**
   * POST /api/v1/roles - Tạo role mới.
   */
  create: async (payload: CreateRoleRequest): Promise<string> => {
    const response = await api.post<ApiResponse<string>>('/roles', payload);
    return response.data.data;
  },

  /**
   * PUT /api/v1/roles/{id}/permissions - Replace toàn bộ permission của role.
   */
  updatePermissions: async (id: string, payload: UpdateRolePermissionsRequest): Promise<void> => {
    await api.put<ApiResponse<null>>(`/roles/${id}/permissions`, payload);
  },
};
