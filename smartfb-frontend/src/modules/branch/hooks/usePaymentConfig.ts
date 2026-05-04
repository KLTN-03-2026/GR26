import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { branchService } from '../services/branchService';

/**
 * Hook lấy cấu hình cổng thanh toán PayOS của một chi nhánh.
 * BE trả về masked key — dùng để hiển thị trạng thái đã/chưa cấu hình.
 * Chỉ Owner có quyền BRANCH_EDIT mới được gọi API này.
 *
 * @param branchId - ID chi nhánh cần lấy config
 * @param enabled - Chỉ bật query khi user có quyền đọc cấu hình PayOS
 */
export const usePaymentConfig = (branchId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.branches.paymentConfig(branchId),
    queryFn: () => branchService.getPaymentConfig(branchId),
    // Không cần refetch thường xuyên — config hiếm khi thay đổi
    staleTime: 10 * 60 * 1000,
    enabled: Boolean(branchId) && enabled,
    select: (res) => res.data,
  });
};
