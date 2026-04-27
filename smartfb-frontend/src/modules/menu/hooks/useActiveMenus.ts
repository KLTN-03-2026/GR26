import { useQuery } from '@tanstack/react-query';
import { menuService } from '@modules/menu/services/menuService';
import { queryKeys } from '@shared/constants/queryKeys';

/**
 * Hook lấy danh sách món đang kích hoạt để hiển thị tại POS.
 * Khi có branchId, hook ghép thêm giá và trạng thái phục vụ theo chi nhánh.
 *
 * @param branchId - Chi nhánh đang bán hàng tại POS
 */
export const useActiveMenus = (branchId?: string | null) => {
  return useQuery({
    queryKey: queryKeys.menu.activeList(branchId),
    queryFn: () => (branchId ? menuService.getActiveListByBranch(branchId) : menuService.getActiveList()),
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 10 * 60 * 1000, // 10 phút
  });
};
