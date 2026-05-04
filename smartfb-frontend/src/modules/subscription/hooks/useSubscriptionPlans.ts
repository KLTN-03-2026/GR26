import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '@modules/subscription/services/subscriptionService';
import { queryKeys } from '@shared/constants/queryKeys';

/**
 * Hook lấy danh sách gói dịch vụ owner có thể chọn.
 * Backend hiện trả toàn bộ gói từ `/plans`, FE tự lọc gói đang active.
 */
export const useSubscriptionPlans = () =>
  useQuery({
    queryKey: queryKeys.subscriptions.plans,
    queryFn: subscriptionService.getPlans,
    staleTime: 5 * 60 * 1000,
  });
