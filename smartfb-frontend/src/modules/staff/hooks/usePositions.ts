import { useQuery } from '@tanstack/react-query';
import { positionService } from '@modules/staff/services/positionService';
import { queryKeys } from '@shared/constants/queryKeys';

/**
 * Hook lấy danh sách chức vụ đang active để FE map filter, form và trang quản lý chức vụ.
 */
export const usePositions = () => {
  return useQuery({
    queryKey: queryKeys.positions.list(),
    queryFn: () => positionService.getList(),
    staleTime: 5 * 60 * 1000,
  });
};
