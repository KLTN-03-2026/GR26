import { axiosInstance as api } from '@lib/axios';
import type {
    ShiftTemplate,
    ShiftSchedule,
    CreateShiftTemplatePayload,
    LocalTime,
    ShiftStatus,
    UpdateShiftTemplatePayload,
    RegisterShiftPayload,
} from '../types/shift.types';
import type { ApiResponse } from '@shared/types/api.types';

type BackendLocalTime = string | LocalTime | null | undefined;
type BackendShiftStatus = ShiftStatus | 'SCHEDULED';

interface BackendShiftTemplateResponse extends Omit<ShiftTemplate, 'startTime' | 'endTime'> {
    startTime: BackendLocalTime;
    endTime: BackendLocalTime;
}

interface BackendShiftScheduleResponse extends Omit<ShiftSchedule, 'status' | 'actualStartTime' | 'actualEndTime'> {
    status: BackendShiftStatus;
    actualStartTime: BackendLocalTime;
    actualEndTime: BackendLocalTime;
}

const EMPTY_LOCAL_TIME: LocalTime = {
    hour: 0,
    minute: 0,
    second: 0,
    nano: 0,
};

/**
 * Chuẩn hóa LocalTime từ backend.
 * Backend hiện có thể trả về string `HH:mm:ss` hoặc object LocalTime.
 */
const parseLocalTime = (value: BackendLocalTime): LocalTime => {
    if (typeof value === 'string') {
        const [hour = '0', minute = '0', second = '0'] = value.split(':');
        return {
            hour: Number(hour) || 0,
            minute: Number(minute) || 0,
            second: Number(second) || 0,
            nano: 0,
        };
    }

    if (value && typeof value.hour === 'number' && typeof value.minute === 'number') {
        return {
            hour: value.hour,
            minute: value.minute,
            second: typeof value.second === 'number' ? value.second : 0,
            nano: typeof value.nano === 'number' ? value.nano : 0,
        };
    }

    return EMPTY_LOCAL_TIME;
};

/**
 * Đồng bộ status lịch ca giữa backend và frontend.
 * Backend dùng `SCHEDULED`, FE đang hiển thị tương đương `REGISTERED`.
 */
const normalizeShiftStatus = (status: BackendShiftStatus): ShiftStatus => {
    return status === 'SCHEDULED' ? 'REGISTERED' : status;
};

const mapShiftTemplate = (template: BackendShiftTemplateResponse): ShiftTemplate => {
    return {
        ...template,
        startTime: parseLocalTime(template.startTime),
        endTime: parseLocalTime(template.endTime),
    };
};

const mapShiftSchedule = (schedule: BackendShiftScheduleResponse): ShiftSchedule => {
    return {
        ...schedule,
        status: normalizeShiftStatus(schedule.status),
        actualStartTime: schedule.actualStartTime ? parseLocalTime(schedule.actualStartTime) : null,
        actualEndTime: schedule.actualEndTime ? parseLocalTime(schedule.actualEndTime) : null,
    };
};

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
        const response = await api.get<ApiResponse<BackendShiftTemplateResponse[]>>('/shift-templates');

        return {
            ...response.data,
            data: (response.data.data ?? []).map(mapShiftTemplate),
        };
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
        const response = await api.get<ApiResponse<BackendShiftScheduleResponse[]>>('/shifts', {
            params: { startDate, endDate },
        });

        return {
            ...response.data,
            data: (response.data.data ?? []).map(mapShiftSchedule),
        };
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
        const response = await api.get<ApiResponse<BackendShiftScheduleResponse[]>>('/shifts/my', {
            params: { startDate, endDate },
        });

        return {
            ...response.data,
            data: (response.data.data ?? []).map(mapShiftSchedule),
        };
    },
};
