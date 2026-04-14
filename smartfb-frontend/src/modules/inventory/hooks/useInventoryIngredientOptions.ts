import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { inventoryService } from '../services/inventoryService';

/**
 * Hook lấy danh mục nguyên liệu cấp tenant.
 * Dùng cho form nhập kho khi item đã được tạo nhưng chưa có tồn kho tại chi nhánh.
 */
export const useInventoryIngredientOptions = () => {
  return useQuery({
    queryKey: queryKeys.inventory.ingredients.list({ type: 'INGREDIENT' }),
    queryFn: () => inventoryService.getIngredientOptions(),
    staleTime: 60 * 1000,
    retry: 1,
  });
};
