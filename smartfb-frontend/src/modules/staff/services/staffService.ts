import { axiosInstance as api } from '@lib/axios';
import type { EditStaffFormData, CreateStaffFormData, StaffListItem } from '../types/staff.types';
import type { ApiResponse } from '@shared/types/api.types';

/**
 * Staff service - gọi API cho các thao tác nhân viên
 * Base URL: /api/v1/staff
 */
export const staffService = {
  /**
   * Lấy danh sách nhân viên
   * GET /api/v1/staff
   */
  getList: async (): Promise<ApiResponse<StaffListItem[]>> => {
    return api.get<ApiResponse<StaffListItem[]>>('/staff').then(r => r.data);
  },

  /**
   * Lấy chi tiết một nhân viên
   * GET /api/v1/staff/:id
   */
  getById: async (id: string): Promise<ApiResponse<any>> => {
    return api.get<ApiResponse<any>>(`/staff/${id}`).then(r => r.data);
  },

  /**
   * Tạo nhân viên mới
   * POST /api/v1/staff
   */
  create: async (payload: CreateStaffFormData): Promise<ApiResponse<any>> => {
    const apiPayload = {
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      identity_id: payload.identityId,
      date_of_birth: payload.dateOfBirth,
      address: payload.address,
      city: payload.city,
      branch_id: payload.branchId,
      position_id: payload.positionId,
      shift_type: payload.shiftType,
      salary: payload.salary,
      hire_date: payload.hireDate,
      pos_pin: payload.posPin,
      status: payload.status,
    };
    return api.post<ApiResponse<any>>('/staff', apiPayload).then(r => r.data);
  },

  /**
   * Cập nhật thông tin nhân viên
   * PUT /api/v1/staff/:id
   */
  update: async (id: string, payload: EditStaffFormData): Promise<ApiResponse<any>> => {
    const apiPayload = {
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      identity_id: payload.identityId,
      date_of_birth: payload.dateOfBirth,
      address: payload.address,
      city: payload.city,
      position_id: payload.positionId,
      salary: payload.salary,
      shift_type: payload.shiftType,
      status: payload.status,
    };
    return api.put<ApiResponse<any>>(`/staff/${id}`, apiPayload).then(r => r.data);
  },

  /**
   * Xóa / Deactivate nhân viên
   * DELETE /api/v1/staff/:id
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<ApiResponse<void>>(`/staff/${id}`).then(r => r.data);
  },

  /**
   * Cập nhật trạng thái nhân viên (khóa/mở khóa)
   * PUT /api/v1/staff/:id/toggle
   */
  updateStatus: async (id: string, status: 'active' | 'inactive'): Promise<ApiResponse<any>> => {
    // Lưu ý: Tên endpoint có thể khác nhau tùy backend, ở đây dùng /toggle theo doc
    return api.put<ApiResponse<any>>(`/staff/${id}/toggle`, { status }).then(r => r.data);
  },

  /**
   * Lấy danh sách nhân viên theo chi nhánh
   * GET /api/v1/staff?branchId=...
   */
  getByBranch: async (branchId: string): Promise<ApiResponse<StaffListItem[]>> => {
    return api.get<ApiResponse<StaffListItem[]>>(`/staff`, { params: { branchId } }).then(r => r.data);
  },
};