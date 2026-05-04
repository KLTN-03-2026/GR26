import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminPlanService } from '../services/adminPlanService';

/**
 * Hook lấy chi tiết một gói dịch vụ khi cần mở rộng màn hình xem/sửa chi tiết.
 */
export const useAdminPlanDetail = (planId: string | null) =>
  useQuery({
    queryKey: queryKeys.admin.planDetail(planId ?? 'unknown'),
    queryFn: () => {
      if (!planId) {
        throw new Error('Thiếu planId để tải chi tiết gói dịch vụ');
      }

      return adminPlanService.getPlanDetail(planId);
    },
    enabled: Boolean(planId),
    staleTime: 60 * 1000,
  });
