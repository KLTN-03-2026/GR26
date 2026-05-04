import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';
import { inventoryService } from '../services/inventoryService';
import type { RecordProductionBatchPayload } from '../types/inventory.types';

/**
 * Hook ghi nhận mẻ sản xuất bán thành phẩm.
 * Thành công sẽ refetch tồn kho và lịch sử giao dịch để UI phản ánh ngay nhập/xuất sản xuất.
 */
export const useRecordProductionBatch = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: RecordProductionBatchPayload) => inventoryService.recordProductionBatch(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.balances.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.transactions.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.productionBatches.all });
      success('Ghi nhận sản xuất thành công', 'Tồn kho, lịch sử giao dịch và lịch sử sản xuất đã được cập nhật.');
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể ghi nhận sản xuất', errorMessage);
    },
  });
};
