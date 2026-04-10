import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';
import type { StaffFilters } from '../types/staff.types';

export const useStaffList = (filters?: StaffFilters) => {
  return useQuery({
    queryKey: queryKeys.staff.list(filters),
    queryFn: () => staffService.getList(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};