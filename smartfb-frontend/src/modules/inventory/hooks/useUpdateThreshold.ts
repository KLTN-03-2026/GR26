import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';
import { inventoryService } from '../services/inventoryService';
import type { UpdateThresholdPayload } from '../types/inventory.types';

/**
 * Hook cập nhật mức tồn tối thiểu (ngưỡng cảnh báo low-stock) cho một bản ghi tồn kho.
 * Sau khi cập nhật, backend tự tính lại `isLowStock` khi trả về balance tiếp theo.
 */
export const useUpdateThreshold = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: UpdateThresholdPayload) => inventoryService.updateThreshold(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.balances.all });
      success('Cập nhật mức tối thiểu thành công', 'Hệ thống sẽ cảnh báo khi tồn kho xuống dưới ngưỡng mới.');
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể cập nhật mức tối thiểu', errorMessage);
    },
  });
};
