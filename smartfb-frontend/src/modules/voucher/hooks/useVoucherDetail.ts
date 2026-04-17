/**
 * @author Đào Thu Thiên
 * @description Hook lấy chi tiết voucher theo ID
 * @created 2026-04-16
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { voucherService } from '../services/voucherService';

export const useVoucherDetail = (voucherId: string) => {
    return useQuery({
        queryKey: queryKeys.vouchers.detail(voucherId),
        queryFn: async () => voucherService.getById(voucherId).then(r => r.data),
        staleTime: 5 * 60 * 1000,
        retry: 1,
        enabled: Boolean(voucherId),
    });
};