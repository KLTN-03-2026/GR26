import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '@modules/subscription/services/subscriptionService';
import { queryKeys } from '@shared/constants/queryKeys';

/**
 * Hook lấy gói dịch vụ hiện tại của tenant đang đăng nhập.
 * Backend xác định tenant qua JWT/TenantContext, FE không truyền tenantId.
 */
export const useCurrentSubscription = () =>
  useQuery({
    queryKey: queryKeys.subscriptions.current,
    queryFn: subscriptionService.getCurrentSubscription,
    staleTime: 5 * 60 * 1000,
  });
