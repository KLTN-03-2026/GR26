/**
 * @author Đào Thu Thiên
 * @description Hook tạo phiếu kiểm kho mới
 * @created 2026-04-16
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';
import { inventoryCheckService } from '../services/inventoryCheckService';
import type { CreateInventoryCheckRequest } from '../types/inventoryCheck.types';

export const useCreateInventoryCheck = () => {
    const queryClient = useQueryClient();
    const { success, error } = useToast();

    return useMutation({
        mutationFn: (payload: CreateInventoryCheckRequest) =>
            inventoryCheckService.createSession(payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['inventoryChecks'] });
            success('Tạo phiếu kiểm kho thành công', 'Bắt đầu nhập số lượng thực tế cho từng nguyên liệu.');
        },
        onError: (err) => {
            if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
                const message = err.response.data?.error?.message;
                if (message?.includes('đang có phiếu kiểm kho chưa hoàn tất')) {
                    error('Không thể tạo phiếu kiểm kho', message);
                    return;
                }
                return;
            }
            const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
            error('Không thể tạo phiếu kiểm kho', errorMessage);
        },
    });
};