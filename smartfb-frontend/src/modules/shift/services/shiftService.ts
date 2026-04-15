import { axiosInstance as api } from '@lib/axios';
import type {
    ShiftTemplate,
    ShiftSchedule,
    CreateShiftTemplatePayload,
    UpdateShiftTemplatePayload,
    RegisterShiftPayload,
} from '../types/shift.types';
import type { ApiResponse } from '@shared/types/api.types';

/**
 * Shift service - gọi API thật
 * Base URL: /api/v1
 */
export const shiftService = {
    // ==================== SHIFT TEMPLATES ====================

    /**
     * Lấy danh sách ca mẫu
     * GET /api/v1/shift-templates
     */
    getTemplates: async (): Promise<ApiResponse<ShiftTemplate[]>> => {
        return api.get<ApiResponse<ShiftTemplate[]>>('/shift-templates').then(r => r.data);
    },

    /**
     * Tạo ca mẫu mới
     * POST /api/v1/shift-templates
     */
    createTemplate: async (payload: CreateShiftTemplatePayload): Promise<ApiResponse<{ id: string }>> => {
        return api.post<ApiResponse<{ id: string }>>('/shift-templates', payload).then(r => r.data);
    },

    /**
     * Cập nhật ca mẫu
     * PUT /api/v1/shift-templates/{id}
     */
    updateTemplate: async (id: string, payload: UpdateShiftTemplatePayload): Promise<ApiResponse<void>> => {
        return api.put<ApiResponse<void>>(`/shift-templates/${id}`, payload).then(r => r.data);
    },

    /**
     * Xóa ca mẫu (soft delete)
     * DELETE /api/v1/shift-templates/{id}
     */
    deleteTemplate: async (id: string): Promise<ApiResponse<void>> => {
        return api.delete<ApiResponse<void>>(`/shift-templates/${id}`).then(r => r.data);
    },

    // ==================== SHIFT SCHEDULES ====================

    /**
     * Lấy lịch ca của branch
     * GET /api/v1/shifts?startDate=&endDate=
     */
    getBranchSchedule: async (startDate: string, endDate: string): Promise<ApiResponse<ShiftSchedule[]>> => {
        return api
            .get<ApiResponse<ShiftSchedule[]>>('/shifts', {
                params: { startDate, endDate },
            })
            .then(r => r.data);
    },

    /**
     * Đăng ký ca làm việc
     * POST /api/v1/shifts
     */
    registerShift: async (payload: RegisterShiftPayload): Promise<ApiResponse<{ id: string }>> => {
        return api.post<ApiResponse<{ id: string }>>('/shifts', payload).then(r => r.data);
    },

    /**
     * Check-in ca làm việc
     * POST /api/v1/shifts/{id}/checkin
     */
    checkIn: async (id: string): Promise<ApiResponse<void>> => {
        return api.post<ApiResponse<void>>(`/shifts/${id}/checkin`).then(r => r.data);
    },

    /**
     * Check-out ca làm việc
     * POST /api/v1/shifts/{id}/checkout
     */
    checkOut: async (id: string): Promise<ApiResponse<void>> => {
        return api.post<ApiResponse<void>>(`/shifts/${id}/checkout`).then(r => r.data);
    },

    /**
     * Lấy lịch ca của nhân viên hiện tại
     * GET /api/v1/shifts/my?startDate=&endDate=
     */
    getMySchedule: async (startDate: string, endDate: string): Promise<ApiResponse<ShiftSchedule[]>> => {
        return api
            .get<ApiResponse<ShiftSchedule[]>>('/shifts/my', {
                params: { startDate, endDate },
            })
            .then(r => r.data);
    },
};