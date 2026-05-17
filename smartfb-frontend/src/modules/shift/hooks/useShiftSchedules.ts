import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { queryKeys } from '@shared/constants/queryKeys';
import { shiftService } from '../services/shiftService';
import type {
    CheckInShiftPayload,
    RegisterShiftPayload,
    UpdateShiftSchedulePayload,
} from '../types/shift.types';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

const getGeolocationErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            return 'Vui lòng cấp quyền vị trí để check-in tại chi nhánh.';
        case error.POSITION_UNAVAILABLE:
            return 'Không thể xác định vị trí hiện tại. Vui lòng bật GPS hoặc thử lại.';
        case error.TIMEOUT:
            return 'Lấy vị trí quá thời gian chờ. Vui lòng kiểm tra GPS và thử lại.';
        default:
            return 'Không thể lấy vị trí hiện tại để check-in.';
    }
};

/**
 * Gọi navigator.geolocation.getCurrentPosition với options cho trước.
 */
const requestPosition = (options: PositionOptions): Promise<CheckInShiftPayload> =>
    new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            reject,
            options,
        );
    });

/**
 * Lấy tọa độ hiện tại trước khi check-in để backend kiểm tra khoảng cách tới chi nhánh.
 *
 * Chiến lược fallback:
 *  1. Thử GPS chính xác cao (enableHighAccuracy: true, timeout 15s).
 *  2. Nếu thất bại (desktop không có GPS, extension chặn, v.v.)
 *     → fallback sang WiFi / IP-based (enableHighAccuracy: false, timeout 20s).
 */
const getCurrentCheckInLocation = async (): Promise<CheckInShiftPayload> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
        throw new Error(
            'Trình duyệt không hỗ trợ lấy vị trí. Vui lòng dùng thiết bị có GPS để check-in.',
        );
    }

    // Lần 1: high accuracy (GPS)
    try {
        console.log('[Check-in] Đang lấy vị trí high-accuracy (GPS)…');
        const highAccResult = await requestPosition({
            enableHighAccuracy: true,
            timeout: 15_000,
            maximumAge: 60_000, // chấp nhận cache ≤ 1 phút
        });
        console.log('[Check-in] ✅ High-accuracy OK:', highAccResult);
        return highAccResult;
    } catch (err) {
        console.warn('[Check-in] ❌ High-accuracy failed:', err);
        console.log('[Check-in] Thử fallback low-accuracy (WiFi/IP)…');
    }

    // Lần 2: low accuracy (WiFi / IP)
    try {
        const lowAccResult = await requestPosition({
            enableHighAccuracy: false,
            timeout: 20_000,
            maximumAge: 120_000, // chấp nhận cache ≤ 2 phút
        });
        console.log('[Check-in] ✅ Low-accuracy OK:', lowAccResult);
        return lowAccResult;
    } catch (error) {
        console.error('[Check-in] ❌ Low-accuracy cũng failed:', error);
        const geoError = error as GeolocationPositionError;
        throw new Error(
            geoError?.code != null
                ? getGeolocationErrorMessage(geoError)
                : 'Không thể lấy vị trí hiện tại để check-in. Hãy thử tắt extension chặn vị trí hoặc dùng trình duyệt khác.',
        );
    }
};

const getShiftScheduleMutationErrorMessage = (error: unknown, fallbackMessage: string) => {
    if (isAxiosError<ApiResponse<unknown>>(error)) {
        return error.response?.data?.error?.message ?? fallbackMessage;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallbackMessage;
};

/**
 * Hook quản lý lịch ca (Shift Schedules)
 * Bao gồm: lấy lịch ca, đăng ký, cập nhật, xóa, check-in và check-out
 */
export const useShiftSchedules = () => {
    const queryClient = useQueryClient();
    const toast = useToast();
    const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);

    /**
     * Lấy lịch ca của chi nhánh trong khoảng ngày
     * @param startDate - ngày bắt đầu (YYYY-MM-DD)
     * @param endDate - ngày kết thúc (YYYY-MM-DD)
     */
    const useBranchSchedule = (startDate: string, endDate: string) => {
        return useQuery({
            queryKey: queryKeys.shifts.schedules.list({
                startDate,
                endDate,
                branchId: currentBranchId ?? 'all',
            }),
            queryFn: async () => {
                const response = await shiftService.getBranchSchedule(startDate, endDate);
                return response.data ?? [];
            },
            staleTime: 2 * 60 * 1000, // 2 phút
            enabled: Boolean(startDate && endDate && currentBranchId),
        });
    };

    /**
     * Lấy lịch ca của nhân viên hiện tại
     * @param startDate - ngày bắt đầu (YYYY-MM-DD)
     * @param endDate - ngày kết thúc (YYYY-MM-DD)
     */
    const useMySchedule = (startDate: string, endDate: string) => {
        return useQuery({
            queryKey: queryKeys.shifts.schedules.my(startDate, endDate),
            queryFn: async () => {
                const response = await shiftService.getMySchedule(startDate, endDate);
                return response.data ?? [];
            },
            staleTime: 2 * 60 * 1000,
            enabled: Boolean(startDate && endDate),
        });
    };

    // Mutation: đăng ký ca
    const registerMutation = useMutation({
        mutationFn: async (payload: RegisterShiftPayload) => {
            const response = await shiftService.registerShift(payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.shifts.schedules.all });
            queryClient.invalidateQueries({ queryKey: ['shifts', 'schedules', 'my'] });
            toast.success('Đăng ký ca thành công');
        },
        onError: (error: unknown) => {
            toast.error(getShiftScheduleMutationErrorMessage(error, 'Đăng ký ca thất bại'));
        },
    });

    // Mutation: cập nhật ca khi chưa check-in
    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: UpdateShiftSchedulePayload }) => {
            await shiftService.updateShift(id, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.shifts.schedules.all });
            queryClient.invalidateQueries({ queryKey: ['shifts', 'schedules', 'my'] });
            toast.success('Cập nhật ca thành công');
        },
        onError: (error: unknown) => {
            toast.error(getShiftScheduleMutationErrorMessage(error, 'Cập nhật ca thất bại'));
        },
    });

    // Mutation: xóa ca khi chưa check-in
    const deleteMutation = useMutation({
        mutationFn: async (shiftScheduleId: string) => {
            await shiftService.deleteShift(shiftScheduleId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.shifts.schedules.all });
            queryClient.invalidateQueries({ queryKey: ['shifts', 'schedules', 'my'] });
            toast.success('Xóa ca thành công');
        },
        onError: (error: unknown) => {
            toast.error(getShiftScheduleMutationErrorMessage(error, 'Xóa ca thất bại'));
        },
    });

    // Mutation: check-in
    const checkInMutation = useMutation({
        mutationFn: async (shiftScheduleId: string) => {
            const location = await getCurrentCheckInLocation();
            await shiftService.checkIn(shiftScheduleId, location);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.shifts.schedules.all });
            queryClient.invalidateQueries({ queryKey: ['shifts', 'schedules', 'my'] });
            toast.success('Check-in thành công');
        },
        onError: (error: unknown) => {
            toast.error(getShiftScheduleMutationErrorMessage(error, 'Check-in thất bại'));
        },
    });

    // Mutation: check-out
    const checkOutMutation = useMutation({
        mutationFn: async (shiftScheduleId: string) => {
            await shiftService.checkOut(shiftScheduleId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.shifts.schedules.all });
            queryClient.invalidateQueries({ queryKey: ['shifts', 'schedules', 'my'] });
            toast.success('Check-out thành công');
        },
        onError: (error: unknown) => {
            toast.error(getShiftScheduleMutationErrorMessage(error, 'Check-out thất bại'));
        },
    });

    return {
        useBranchSchedule,
        useMySchedule,
        registerShift: registerMutation.mutateAsync,
        updateShift: updateMutation.mutateAsync,
        deleteShift: deleteMutation.mutateAsync,
        checkIn: checkInMutation.mutateAsync,
        checkOut: checkOutMutation.mutateAsync,
        isRegistering: registerMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isCheckingIn: checkInMutation.isPending,
        isCheckingOut: checkOutMutation.isPending,
    };
};
