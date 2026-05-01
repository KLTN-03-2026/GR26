import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type { 
  ShiftTemplate, 
  ShiftSchedule, 
  CreateShiftTemplatePayload, 
  RegisterShiftPayload 
} from '../types/shift.types';

/**
 * Shift service - Quản lý ca làm và xếp lịch
 */
export const shiftService = {
  /**
   * Lấy danh sách khung giờ ca làm (Templates)
   */
  getTemplates: async (branchId?: string): Promise<ApiResponse<ShiftTemplate[]>> => {
    return api.get<ApiResponse<ShiftTemplate[]>>('/shifts/templates', { params: { branchId } }).then(r => r.data);
  },

  /**
   * Tạo khung giờ ca mới
   */
  createTemplate: async (payload: CreateShiftTemplatePayload): Promise<ApiResponse<ShiftTemplate>> => {
    return api.post<ApiResponse<ShiftTemplate>>('/shifts/templates', payload).then(r => r.data);
  },

  /**
   * Cập nhật khung giờ ca
   */
  updateTemplate: async (id: string, payload: Partial<CreateShiftTemplatePayload>): Promise<ApiResponse<ShiftTemplate>> => {
    return api.put<ApiResponse<ShiftTemplate>>(`/shifts/templates/${id}`, payload).then(r => r.data);
  },

  /**
   * Xóa khung giờ ca
   */
  deleteTemplate: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<ApiResponse<void>>(`/shifts/templates/${id}`).then(r => r.data);
  },

  /**
   * Lấy danh sách ca còn trống để đăng ký
   */
  getOpenShifts: async (branchId: string): Promise<ApiResponse<ShiftTemplate[]>> => {
    return api.get<ApiResponse<ShiftTemplate[]>>('/shifts/open', { params: { branchId } }).then(r => r.data);
  },

  /**
   * Nhân viên tự đăng ký ca
   */
  register: async (payload: RegisterShiftPayload): Promise<ApiResponse<ShiftSchedule>> => {
    return api.post<ApiResponse<ShiftSchedule>>('/shifts/register', payload).then(r => r.data);
  },

  /**
   * Lấy lịch làm việc tổng thể (cho Owner/Manager)
   */
  getSchedule: async (params: { branchId: string; date: string }): Promise<ApiResponse<ShiftSchedule[]>> => {
    return api.get<ApiResponse<ShiftSchedule[]>>('/shifts/schedule', { params }).then(r => r.data);
  },
};
