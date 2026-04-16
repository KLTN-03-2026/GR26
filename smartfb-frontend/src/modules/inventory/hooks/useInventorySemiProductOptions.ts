import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { inventoryService } from '../services/inventoryService';

/**
 * Hook lấy danh mục bán thành phẩm cấp tenant.
 * Dùng cho tab bán thành phẩm để tạo tồn ban đầu hoặc thao tác với item `SUB_ASSEMBLY`.
 */
export const useInventorySemiProductOptions = () => {
  return useQuery({
    queryKey: queryKeys.inventory.semiProducts.list({ type: 'SUB_ASSEMBLY' }),
    queryFn: () => inventoryService.getSemiProductOptions(),
    staleTime: 60 * 1000,
    retry: 1,
  });
};
