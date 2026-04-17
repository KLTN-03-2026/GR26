/**
 * @author Đào Thu Thiên
 * @description Hook xử lý tạo voucher mới
 * @created 2026-04-16
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { voucherService } from '../services/voucherService';
import type { CreateVoucherPayload } from '../types/voucher.types';

export const useCreateVoucher = () => {
    const queryClient = useQueryClient();
    const { success, error } = useToast();

    return useMutation({
        mutationFn: async (payload: CreateVoucherPayload) => {
            return voucherService.create(payload);
        },
        onSuccess: (response) => {
            // Invalidate all vouchers queries
            queryClient.invalidateQueries({ queryKey: queryKeys.vouchers.all });

            if (response.success) {
                success('Tạo voucher thành công', `Voucher ${response.data?.code} đã được tạo`);
            } else {
                error('Tạo voucher thất bại', response.message);
            }
        },
        onError: (err) => {
            const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
            error('Không thể tạo voucher', errorMessage);
        },
    });
};