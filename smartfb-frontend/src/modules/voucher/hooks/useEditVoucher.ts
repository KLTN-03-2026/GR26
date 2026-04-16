/**
 * @author Đào Thu Thiên
 * @description Hook xử lý cập nhật thông tin voucher
 * @created 2026-04-16
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { voucherService } from '../services/voucherService';
import type { UpdateVoucherPayload } from '../types/voucher.types';

export const useEditVoucher = () => {
    const queryClient = useQueryClient();
    const { success, error } = useToast();

    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: UpdateVoucherPayload }) => {
            return voucherService.update(id, payload);
        },
        onSuccess: (response, variables) => {
            // Invalidate all và detail
            queryClient.invalidateQueries({ queryKey: queryKeys.vouchers.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.vouchers.detail(variables.id) });

            if (response.success) {
                success('Cập nhật thành công', `Voucher ${response.data?.code} đã được cập nhật`);
            } else {
                error('Cập nhật thất bại', response.message);
            }
        },
        onError: (err) => {
            const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
            error('Không thể cập nhật voucher', errorMessage);
        },
    });
};