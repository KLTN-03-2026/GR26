import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { inventoryService } from '../services/inventoryService';
import type { ProductionBatchParams } from '../types/inventory.types';

/**
 * Hook lấy lịch sử mẻ sản xuất bán thành phẩm của chi nhánh hiện tại.
 *
 * @param params - Tham số phân trang server-side: page, size
 */
export const useProductionBatches = (params?: ProductionBatchParams) => {
  return useQuery({
    queryKey: queryKeys.inventory.productionBatches.list({
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    }),
    queryFn: () => inventoryService.getProductionBatches(params),
    staleTime: 30 * 1000, // 30 giây vì lịch sử cần cập nhật ngay sau khi ghi nhận mẻ mới
    retry: 1,
  });
};
