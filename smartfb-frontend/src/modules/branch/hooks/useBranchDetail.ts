import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { branchService } from '../services/branchService';

/**
 * Hook lấy chi tiết chi nhánh theo ID.
 * Backend hiện chưa có endpoint `GET /branches/:id`,
 * nên FE đọc từ danh sách branch của tenant rồi lọc theo `branchId`.
 *
 * @param branchId - ID chi nhánh cần lấy thông tin
 * @returns Query result với thông tin chi tiết chi nhánh
 */
export const useBranchDetail = (branchId: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.branches.detail(branchId),
    queryFn: async () => {
      const branches = await queryClient.ensureQueryData({
        queryKey: queryKeys.branches.list(),
        queryFn: async () => branchService.getList().then(r => r.data ?? []),
        staleTime: 5 * 60 * 1000,
      });

      const branch = branches.find(item => item.id === branchId);

      if (!branch) {
        throw new Error('Không tìm thấy chi nhánh');
      }

      return branch;
    },
    staleTime: 5 * 60 * 1000, // 5 phút
    retry: 1,
    enabled: Boolean(branchId),
  });
};
