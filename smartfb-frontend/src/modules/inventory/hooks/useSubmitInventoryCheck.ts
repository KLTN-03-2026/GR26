/**
 * @author Đào Thu Thiên
 * @description Hook nộp phiếu kiểm kho
 * @created 2026-04-16
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';
import { inventoryCheckService } from '../services/inventoryCheckService';
import type { SubmitInventoryCheckRequest } from '../types/inventoryCheck.types';

export const useSubmitInventoryCheck = (sessionId: string) => {
    const queryClient = useQueryClient();
    const { success, error } = useToast();

    return useMutation({
        mutationFn: (data: SubmitInventoryCheckRequest) =>
            inventoryCheckService.submitSession(sessionId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['inventoryChecks'] });
            void queryClient.invalidateQueries({ queryKey: ['inventoryChecks', 'detail', sessionId] });
            success('Nộp phiếu kiểm kho thành công', 'Kết quả kiểm kho đã được ghi nhận.');
        },
        onError: (err) => {
            if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
                const message = err.response.data?.error?.message;
                if (message?.includes('vui lòng nhập ghi chú giải thích')) {
                    error('Chênh lệch vượt quá ngưỡng cho phép', message);
                    return;
                }
                if (message?.includes('nhập số lượng thực tế cho tất cả')) {
                    error('Chưa nhập đủ số lượng', message);
                    return;
                }
                return;
            }
            const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
            error('Không thể nộp phiếu kiểm kho', errorMessage);
        },
    });
};