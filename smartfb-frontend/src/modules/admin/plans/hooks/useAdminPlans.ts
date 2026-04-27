import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminPlanService } from '../services/adminPlanService';
import type { AdminPlanListParams } from '../types/adminPlan.types';

/**
 * Hook lấy danh sách gói dịch vụ cho admin SaaS.
 */
export const useAdminPlans = (params: AdminPlanListParams) =>
  useQuery({
    queryKey: queryKeys.admin.plans({ ...params }),
    queryFn: () => adminPlanService.getPlans(params),
    staleTime: 60 * 1000,
  });
