import { useQuery } from '@tanstack/react-query';
import { menuService } from '@modules/menu/services/menuService';
import type { BranchMenuItemConfig } from '@modules/menu/types/menu.types';
import { queryKeys } from '@shared/constants/queryKeys';

/**
 * Hook lấy cấu hình món ăn theo chi nhánh cho danh sách menu hiện tại.
 * Backend chưa có API batch nên FE tạm gom bằng Promise.all theo item IDs.
 *
 * @param branchId - ID chi nhánh đang chọn
 * @param itemIds - Danh sách món cần lấy cấu hình chi nhánh
 */
export const useBranchMenuItems = (branchId: string | null, itemIds: string[]) => {
  const normalizedItemIds = [...itemIds].sort();

  return useQuery({
    queryKey: queryKeys.menu.branchItems(branchId ?? 'all', normalizedItemIds),
    queryFn: async () => {
      if (!branchId || normalizedItemIds.length === 0) {
        return [] satisfies BranchMenuItemConfig[];
      }

      const responses = await Promise.all(
        normalizedItemIds.map((itemId) => menuService.getBranchItem(branchId, itemId))
      );

      return responses.map((response) => response.data);
    },
    enabled: Boolean(branchId) && normalizedItemIds.length > 0,
    staleTime: 60 * 1000,
  });
};
