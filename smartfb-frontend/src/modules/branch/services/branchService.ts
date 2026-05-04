import { axiosInstance as api } from '@lib/axios';
import type {
  Branch,
  CreateBranchPayload,
  UpdateBranchPayload,
  AssignUserToBranchPayload,
  PaymentGatewayConfig,
  PaymentGatewayConfigPayload,
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
   * Vô hiệu hoá một chi nhánh.
   * Backend dùng DELETE nhưng xử lý soft-delete bằng cách chuyển status sang INACTIVE.
   * DELETE /api/v1/branches/:id
   * @param id - ID chi nhánh cần vô hiệu hoá
   */
  disable: async (id: string): Promise<ApiResponse<void>> => {
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

  /**
   * Lấy cấu hình cổng thanh toán PayOS của chi nhánh.
   * BE chỉ trả về masked key — không bao giờ trả raw key.
   * GET /api/v1/branches/:id/payment-config
   */
  getPaymentConfig: async (branchId: string): Promise<ApiResponse<PaymentGatewayConfig>> => {
    return api.get<ApiResponse<PaymentGatewayConfig>>(`/branches/${branchId}/payment-config`).then(r => r.data);
  },

  /**
   * Lưu cấu hình PayOS cho chi nhánh.
   * Chỉ Owner có quyền BRANCH_EDIT mới được gọi API này.
   * PUT /api/v1/branches/:id/payment-config
   */
  savePaymentConfig: async (branchId: string, payload: PaymentGatewayConfigPayload): Promise<ApiResponse<PaymentGatewayConfig>> => {
    return api.put<ApiResponse<PaymentGatewayConfig>>(`/branches/${branchId}/payment-config`, payload).then(r => r.data);
  },
};
