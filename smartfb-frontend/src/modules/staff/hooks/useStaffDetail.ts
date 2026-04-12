import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';
import type { StaffDetail } from '../types/staff.types';

/**
 * Hook lấy chi tiết một nhân viên theo `staffId`.
 *
 * @param staffId - ID nhân viên cần xem chi tiết
 */
export const useStaffDetail = (staffId: string) => {
  return useQuery({
    queryKey: queryKeys.staff.detail(staffId),
    queryFn: async (): Promise<StaffDetail> => {
      const staff = await staffService.getById(staffId);
      return staff;
    },
    staleTime: 0,
    enabled: !!staffId,
  });
};
