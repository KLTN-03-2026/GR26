import { axiosInstance as api } from '@lib/axios';
import type {
  Branch,
  CreateBranchPayload,
  UpdateBranchPayload,
  AssignUserToBranchPayload,
} from '../types/branch.types';
import type { ApiResponse } from '@shared/types/api.types';

/**
 * Branch service - gọi API cho các thao tác chi nhánh
 * Base URL: /api/v1/branches
 */
export const branchService = {
  /**
   * Lấy danh sách toàn bộ chi nhánh của tenant hiện tại
   * GET /api/v1/branches
   */
  getList: async (): Promise<ApiResponse<Branch[]>> => {
    return api.get<ApiResponse<Branch[]>>('/branches').then(r => r.data);
  },

  /**
   * Lấy chi tiết một chi nhánh
   * GET /api/v1/branches/:id
   */
  getById: async (id: string): Promise<ApiResponse<Branch>> => {
    return api.get<ApiResponse<Branch>>(`/branches/${id}`).then(r => r.data);
  },

  /**
   * Tạo mới một chi nhánh
   * POST /api/v1/branches
   * @param payload - thông tin chi nhánh cần tạo
   */
  create: async (payload: CreateBranchPayload): Promise<ApiResponse<Branch>> => {
    return api.post<ApiResponse<Branch>>('/branches', payload).then(r => r.data);
  },

  /**
   * Cập nhật thông tin chi nhánh
   * PUT /api/v1/branches/:id
   * @param id - ID chi nhánh cần cập nhật
   * @param payload - thông tin cập nhật
   */
  update: async (id: string, payload: UpdateBranchPayload): Promise<ApiResponse<Branch>> => {
    return api.put<ApiResponse<Branch>>(`/branches/${id}`, payload).then(r => r.data);
  },

  /**
   * Xóa chi nhánh
   * DELETE /api/v1/branches/:id
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<ApiResponse<void>>(`/branches/${id}`).then(r => r.data);
  },

  /**
   * Gán nhân viên vào chi nhánh
   * POST /api/v1/branches/:id/users
   * @param id - ID chi nhánh
   * @param payload - userId cần gán
   */
  assignUserToBranch: async (id: string, payload: AssignUserToBranchPayload): Promise<ApiResponse<void>> => {
    return api.post<ApiResponse<void>>(`/branches/${id}/users`, payload).then(r => r.data);
  },
};
