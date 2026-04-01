import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { branchService } from '../services/branchService';

/**
 * Hook lấy danh sách chi nhánh của tenant hiện tại.
 * Owner thấy tất cả chi nhánh của tenant.
 * Staff chỉ thấy chi nhánh được phân công trong BranchStaff.
 *
 * @returns Danh sách chi nhánh và loading/error states
 */
export const useBranches = () => {
  return useQuery({
    queryKey: queryKeys.branches.all,
    queryFn: () => branchService.getList().then(r => r.data),
    staleTime: 5 * 60 * 1000, // 5 phút
    retry: 1,
  });
};
