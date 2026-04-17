import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';
import type { StaffFilters } from '../types/staff.types';

/**
 * Hook lấy danh sách nhân viên theo bộ lọc hiện tại.
 *
 * @param filters - Bộ lọc, phân trang và keyword tìm kiếm gửi lên API
 */
export const useStaffList = (filters?: StaffFilters) => {
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);

  return useQuery({
    // Danh sách staff cần đổi key theo branch context để React Query fetch lại khi user đổi chi nhánh.
    queryKey: queryKeys.staff.list({
      ...filters,
      branchId: currentBranchId ?? 'all',
    }),
    queryFn: () => staffService.getList(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
