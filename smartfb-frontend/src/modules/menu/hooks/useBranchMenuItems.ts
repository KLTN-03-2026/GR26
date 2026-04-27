import { useQuery } from '@tanstack/react-query';
import { menuService } from '@modules/menu/services/menuService';
import type { BranchMenuItemConfig } from '@modules/menu/types/menu.types';
import { queryKeys } from '@shared/constants/queryKeys';

/**
 * Hook lấy cấu hình món ăn theo chi nhánh cho danh sách menu hiện tại.
 * Dùng API batch để tránh gọi từng món khi danh sách thực đơn lớn.
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

      const response = await menuService.getBranchItems(branchId);
      const requestedItemIdSet = new Set(normalizedItemIds);

      return response.data.filter((item) => requestedItemIdSet.has(item.itemId));
    },
    enabled: Boolean(branchId) && normalizedItemIds.length > 0,
    staleTime: 60 * 1000,
  });
};
