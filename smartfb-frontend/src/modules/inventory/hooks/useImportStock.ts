import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';
import { inventoryService } from '../services/inventoryService';
import type { ImportStockPayload } from '../types/inventory.types';

/**
 * Hook nhập kho nguyên liệu.
 */
export const useImportStock = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: ImportStockPayload) => inventoryService.importStock(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.balances.all });
      success('Nhập kho thành công', 'Tồn kho đã được cập nhật theo lô nhập mới.');
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể nhập kho', errorMessage);
    },
  });
};
