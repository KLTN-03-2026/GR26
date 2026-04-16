/**
 * @author Đào Thu Thiên
 * @description Hook xử lý xóa voucher
 * @created 2026-04-16
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { voucherService } from '../services/voucherService';

export const useDeleteVoucher = () => {
    const queryClient = useQueryClient();
    const { success, error } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            return voucherService.delete(id);
        },
        onSuccess: (response) => {
            // Invalidate all vouchers queries
            queryClient.invalidateQueries({ queryKey: queryKeys.vouchers.all });

            if (response.success) {
                success('Xóa voucher thành công', 'Voucher đã được xóa khỏi hệ thống');
            } else {
                error('Xóa thất bại', response.message);
            }
        },
        onError: (err) => {
            const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
            error('Không thể xóa voucher', errorMessage);
        },
    });
};