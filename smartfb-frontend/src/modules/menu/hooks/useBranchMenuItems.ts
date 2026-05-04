import { useQuery } from '@tanstack/react-query';
import { menuService } from '@modules/menu/services/menuService';
import type { BranchMenuItemConfig } from '@modules/menu/types/menu.types';
import { queryKeys } from '@shared/constants/queryKeys';

/**
 * Hook lấy toàn bộ cấu hình món ăn theo chi nhánh hiện tại.
 * Dùng API batch để màn Thực đơn luôn bám đúng trạng thái bật/tắt và giá theo branch.
 *
 * @param branchId - ID chi nhánh đang chọn
 */
export const useBranchMenuItems = (branchId: string | null) => {
  return useQuery({
    queryKey: queryKeys.menu.branchItems(branchId ?? 'all'),
    queryFn: async () => {
      if (!branchId) {
        return [] satisfies BranchMenuItemConfig[];
      }

      const response = await menuService.getBranchItems(branchId);
      return response.data;
    },
    enabled: Boolean(branchId),
    staleTime: 60 * 1000,
  });
};
