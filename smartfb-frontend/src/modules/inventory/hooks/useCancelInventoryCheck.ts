/**
 * @author Đào Thu Thiên
 * @description Hook hủy phiếu kiểm kho
 * @created 2026-04-16
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';
import { inventoryCheckService } from '../services/inventoryCheckService';
import type { CancelInventoryCheckRequest } from '../types/inventoryCheck.types';

export const useCancelInventoryCheck = (sessionId: string) => {
    const queryClient = useQueryClient();
    const { success, error } = useToast();

    return useMutation({
        mutationFn: (data: CancelInventoryCheckRequest) =>
            inventoryCheckService.cancelSession(sessionId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['inventoryChecks'] });
            void queryClient.invalidateQueries({ queryKey: ['inventoryChecks', 'detail', sessionId] });
            success('Đã hủy phiếu kiểm kho', 'Phiếu kiểm kho đã được hủy.');
        },
        onError: (err) => {
            if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
                return;
            }
            const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
            error('Không thể hủy phiếu kiểm kho', errorMessage);
        },
    });
};