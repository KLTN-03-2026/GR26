import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';
import { inventoryService } from '../services/inventoryService';
import type { WasteRecordPayload } from '../types/inventory.types';

/**
 * Hook ghi nhận hao hụt nguyên liệu.
 */
export const useRecordWaste = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: WasteRecordPayload) => inventoryService.recordWaste(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.balances.all });
      success('Ghi hao hụt thành công', 'Tồn kho đã được trừ theo số lượng hao hụt.');
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể ghi hao hụt', errorMessage);
    },
  });
};
