/**
 * @author Đào Thu Thiên
 * @description Hook cập nhật số lượng thực tế cho một nguyên liệu
 * @created 2026-04-16
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';
import { inventoryCheckService } from '../services/inventoryCheckService';
import type { UpdateCheckDetailRequest } from '../types/inventoryCheck.types';

export const useUpdateCheckDetail = (sessionId: string) => {
    const queryClient = useQueryClient();
    const { success, error } = useToast();

    return useMutation({
        mutationFn: ({ itemId, data }: { itemId: string; data: UpdateCheckDetailRequest }) =>
            inventoryCheckService.updateDetail(sessionId, itemId, data),
        onSuccess: (updatedDetail) => {
            void queryClient.invalidateQueries({ queryKey: ['inventoryChecks', 'details', sessionId] });
            success('Đã lưu', `Cập nhật số lượng ${updatedDetail.itemName}`);
        },
        onError: (err) => {
            if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
                const message = err.response.data?.error?.message;
                if (message?.includes('không được nhập số âm')) {
                    error('Giá trị không hợp lệ', message);
                    return;
                }
                return;
            }
            const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
            error('Không thể cập nhật', errorMessage);
        },
    });
};