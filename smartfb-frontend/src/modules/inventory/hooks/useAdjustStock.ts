import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';
import { inventoryService } from '../services/inventoryService';
import type { AdjustStockPayload } from '../types/inventory.types';

interface UseAdjustStockOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

/**
 * Hook điều chỉnh tồn kho thủ công.
 */
export const useAdjustStock = (options: UseAdjustStockOptions = {}) => {
  const { showSuccessToast = true, showErrorToast = true } = options;
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: AdjustStockPayload) => inventoryService.adjustStock(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.balances.all });
      if (showSuccessToast) {
        success('Điều chỉnh kho thành công', 'Số lượng tồn kho mới đã được lưu.');
      }
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        if (showErrorToast) {
          const errorMessage = err.response.data?.error?.message ?? 'Vui lòng thử lại sau';
          error('Không thể điều chỉnh kho', errorMessage);
        }
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      if (showErrorToast) {
        error('Không thể điều chỉnh kho', errorMessage);
      }
    },
  });
};
