import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';
import { expenseService } from '../services/expenseService';
import type { ExpenseRequest } from '../types/expense.types';

/**
 * Hook tạo phiếu chi mới.
 */
export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: ExpenseRequest) => expenseService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      success('Tạo phiếu chi thành công', 'Danh sách chi tiêu đã được cập nhật.');
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể tạo phiếu chi', errorMessage);
    },
  });
};
