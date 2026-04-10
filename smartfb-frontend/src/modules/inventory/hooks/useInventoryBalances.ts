import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { queryKeys } from '@shared/constants/queryKeys';
import { inventoryService } from '../services/inventoryService';

/**
 * Hook lấy toàn bộ dữ liệu tồn kho để page kho filter và phân trang phía frontend.
 */
export const useInventoryBalances = () => {
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);

  return useQuery({
    queryKey: queryKeys.inventory.balances.list({
      branchId: currentBranchId ?? 'all',
    }),
    queryFn: () => inventoryService.getList(),
    staleTime: 60 * 1000,
    retry: 1,
  });
};
