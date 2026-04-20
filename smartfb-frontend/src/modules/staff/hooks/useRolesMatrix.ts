import { useQuery } from '@tanstack/react-query';
import { roleService } from '@modules/staff/services/roleService';
import { queryKeys } from '@shared/constants/queryKeys';

/**
 * Hook lấy danh sách role và permission để render ma trận phân quyền.
 */
export const useRolesMatrix = () => {
  return useQuery({
    queryKey: queryKeys.roles.matrix(),
    queryFn: () => roleService.getMatrix(),
    staleTime: 5 * 60 * 1000,
  });
};
