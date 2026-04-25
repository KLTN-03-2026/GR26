import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';
import { expenseService } from '../services/expenseService';
import type { ExpenseRequest } from '../types/expense.types';

interface UpdateExpenseParams {
  id: string;
  payload: ExpenseRequest;
}

/**
 * Hook cập nhật phiếu chi.
 */
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateExpenseParams) => expenseService.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      success('Cập nhật phiếu chi thành công', 'Thông tin chi tiêu đã được lưu.');
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể cập nhật phiếu chi', errorMessage);
    },
  });
};
