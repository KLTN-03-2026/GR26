import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';
import { expenseService } from '../services/expenseService';

/**
 * Hook xóa mềm phiếu chi.
 */
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (expenseId: string) => expenseService.delete(expenseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.financialInvoicesAll });
      success('Xóa phiếu chi thành công', 'Phiếu chi đã được ẩn khỏi danh sách.');
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể xóa phiếu chi', errorMessage);
    },
  });
};
