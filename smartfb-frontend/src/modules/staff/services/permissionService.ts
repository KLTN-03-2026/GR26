import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';

export interface ModulePermission {
  module_key: string;
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

/**
 * Permission service - Quản lý ma trận phân quyền (RBAC)
 */
export const permissionService = {
  /**
   * Lấy danh sách quyền của một Role
   */
  getRolePermissions: async (role: string): Promise<ApiResponse<ModulePermission[]>> => {
    return api.get<ApiResponse<ModulePermission[]>>(`/permissions/${role}`).then(r => r.data);
  },

  /**
   * Cập nhật quyền cho một Role
   */
  updateRolePermissions: async (role: string, permissions: ModulePermission[]): Promise<ApiResponse<void>> => {
    return api.put<ApiResponse<void>>(`/permissions/${role}`, { permissions }).then(r => r.data);
  },
};
