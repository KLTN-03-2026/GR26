import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { inventoryService } from '@modules/inventory/services/inventoryService';

/**
 * Hook lấy chi tiết một mẻ sản xuất bán thành phẩm.
 *
 * @param id - ID mẻ sản xuất cần xem chi tiết
 */
export const useProductionBatchDetail = (id: string | null) => {
  return useQuery({
    queryKey: id
      ? queryKeys.inventory.productionBatches.detail(id)
      : queryKeys.inventory.productionBatches.detail('no-production-batch'),
    queryFn: () => inventoryService.getProductionBatch(id ?? ''),
    enabled: Boolean(id),
    staleTime: 30 * 1000, // 30 giây vì chi tiết có thể được mở lại ngay sau khi ghi nhận mẻ
    retry: 1,
  });
};
