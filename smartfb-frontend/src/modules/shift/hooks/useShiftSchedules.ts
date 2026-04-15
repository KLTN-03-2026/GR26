import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { shiftService } from '../services/shiftService';
import type { RegisterShiftPayload } from '../types/shift.types';
import { useToast } from '@shared/hooks/useToast';

/**
 * Hook quản lý lịch ca (Shift Schedules)
 * Bao gồm: lấy lịch ca của chi nhánh, đăng ký ca, check-in, check-out
 */
export const useShiftSchedules = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    /**
     * Lấy lịch ca của chi nhánh trong khoảng ngày
     * @param startDate - ngày bắt đầu (YYYY-MM-DD)
     * @param endDate - ngày kết thúc (YYYY-MM-DD)
     */
    const useBranchSchedule = (startDate: string, endDate: string) => {
        return useQuery({
            queryKey: queryKeys.shifts.schedules.list({ startDate, endDate }),
            queryFn: async () => {
                const response = await shiftService.getBranchSchedule(startDate, endDate);
                return response.data ?? [];
            },
            staleTime: 2 * 60 * 1000, // 2 phút
            enabled: Boolean(startDate && endDate),
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
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || 'Đăng ký ca thất bại');
        },
    });

    // Mutation: check-in
    const checkInMutation = useMutation({
        mutationFn: async (shiftScheduleId: string) => {
            await shiftService.checkIn(shiftScheduleId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.shifts.schedules.all });
            queryClient.invalidateQueries({ queryKey: ['shifts', 'schedules', 'my'] });
            toast.success('Check-in thành công');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || 'Check-in thất bại');
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
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || 'Check-out thất bại');
        },
    });

    return {
        useBranchSchedule,
        useMySchedule,
        registerShift: registerMutation.mutateAsync,
        checkIn: checkInMutation.mutateAsync,
        checkOut: checkOutMutation.mutateAsync,
        isRegistering: registerMutation.isPending,
        isCheckingIn: checkInMutation.isPending,
        isCheckingOut: checkOutMutation.isPending,
    };
};