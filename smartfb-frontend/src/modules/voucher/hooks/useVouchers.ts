/**
 * @author Đào Thu Thiên
 * @description Hook lấy danh sách voucher của tenant hiện tại
 * @created 2026-04-16
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { voucherService } from '../services/voucherService';

export const useVouchers = () => {
    return useQuery({
        queryKey: queryKeys.vouchers.all, // Sửa: dùng 'all' thay vì 'list()'
        queryFn: async () => voucherService.getList().then(r => r.data ?? []),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
};