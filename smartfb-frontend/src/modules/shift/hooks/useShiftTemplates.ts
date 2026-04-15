import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { shiftService } from '../services/shiftService';
import type { CreateShiftTemplatePayload, UpdateShiftTemplatePayload } from '../types/shift.types';
import { useToast } from '@shared/hooks/useToast';

/**
 * Hook quản lý ca mẫu (Shift Templates)
 * Bao gồm: lấy danh sách, tạo, cập nhật, xóa
 */
export const useShiftTemplates = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    // Query: lấy danh sách ca mẫu
    const {
        data: templates = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: queryKeys.shifts.templates.all,
        queryFn: async () => {
            const response = await shiftService.getTemplates();
            return response.data ?? [];
        },
        staleTime: 5 * 60 * 1000, // 5 phút
    });

    // Mutation: tạo ca mẫu
    const createMutation = useMutation({
        mutationFn: async (payload: CreateShiftTemplatePayload) => {
            const response = await shiftService.createTemplate(payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.shifts.templates.all });
            toast.success('Tạo ca mẫu thành công');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || 'Tạo ca mẫu thất bại');
        },
    });

    // Mutation: cập nhật ca mẫu
    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: UpdateShiftTemplatePayload }) => {
            await shiftService.updateTemplate(id, payload);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.shifts.templates.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.shifts.templates.detail(variables.id) });
            toast.success('Cập nhật ca mẫu thành công');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || 'Cập nhật ca mẫu thất bại');
        },
    });

    // Mutation: xóa ca mẫu
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await shiftService.deleteTemplate(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.shifts.templates.all });
            toast.success('Xóa ca mẫu thành công');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || 'Xóa ca mẫu thất bại');
        },
    });

    return {
        templates,
        isLoading,
        error,
        refetch,
        createTemplate: createMutation.mutateAsync,
        updateTemplate: updateMutation.mutateAsync,
        deleteTemplate: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
};