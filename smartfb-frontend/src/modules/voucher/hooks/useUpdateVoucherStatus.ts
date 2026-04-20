/**
 * @author Đào Thu Thiên
 * @description Hook xử lý kích hoạt/vô hiệu hóa voucher
 * @created 2026-04-16
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { voucherService } from '../services/voucherService';
import type { UpdateVoucherStatusPayload } from '../types/voucher.types';

export const useUpdateVoucherStatus = () => {
    const queryClient = useQueryClient();
    const { success, error } = useToast();

    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: UpdateVoucherStatusPayload }) => {
            return voucherService.updateStatus(id, payload);
        },
        onSuccess: (response, variables) => {
            // Invalidate all và detail
            queryClient.invalidateQueries({ queryKey: queryKeys.vouchers.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.vouchers.detail(variables.id) });

            if (response.success) {
                const statusText = response.data?.status === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu hóa';
                success('Cập nhật trạng thái thành công', `Đã ${statusText} voucher`);
            } else {
                error('Cập nhật thất bại', response.message);
            }
        },
        onError: (err) => {
            const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
            error('Không thể cập nhật trạng thái voucher', errorMessage);
        },
    });
};