import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { branchService } from '../services/branchService';

/**
 * Hook lấy thông tin chi tiết một chi nhánh theo ID
 *
 * @param branchId - ID chi nhánh cần lấy thông tin
 * @returns Thông tin chi nhánh và loading/error states
 */
export const useBranch = (branchId: string) => {
  return useQuery({
    queryKey: queryKeys.branches.detail(branchId),
    queryFn: () => branchService.getById(branchId).then(r => r.data),
    staleTime: 5 * 60 * 1000, // 5 phút
    retry: 1,
    enabled: !!branchId, // Chỉ fetch khi có branchId
  });
};
