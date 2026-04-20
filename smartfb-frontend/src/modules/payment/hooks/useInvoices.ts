import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { queryKeys } from '@shared/constants/queryKeys';
import { paymentService } from '../services/paymentService';
import type { SearchInvoicesParams } from '../types/payment.types';

/**
 * Hook lấy danh sách hóa đơn thu theo branch context hiện tại.
 *
 * @param params - Bộ lọc mã hóa đơn và phân trang
 * @param enabled - Cho phép trì hoãn query khi branch hoặc quyền chưa sẵn sàng
 */
export const useInvoices = (params: SearchInvoicesParams, enabled: boolean = true) => {
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);

  return useQuery({
    queryKey: queryKeys.payments.invoiceSearch({
      branchId: currentBranchId ?? 'all',
      ...params,
    }),
    queryFn: async () => paymentService.searchInvoices(params).then((response) => response.data),
    enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });
};
