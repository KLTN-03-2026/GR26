import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { queryKeys } from '@shared/constants/queryKeys';
import { expenseService } from '../services/expenseService';
import type { ExpenseFilters } from '../types/expense.types';

/**
 * Hook lấy danh sách phiếu chi theo branch context hiện tại.
 *
 * @param filters - Bộ lọc danh mục và phân trang
 * @param enabled - Cho phép trì hoãn query khi branch context chưa sẵn sàng
 */
export const useExpenses = (filters: ExpenseFilters, enabled: boolean = true) => {
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);

  return useQuery({
    queryKey: queryKeys.expenses.list({
      branchId: currentBranchId ?? 'all',
      ...filters,
    }),
    queryFn: async () => expenseService.getList(filters).then((response) => response.data),
    enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });
};
