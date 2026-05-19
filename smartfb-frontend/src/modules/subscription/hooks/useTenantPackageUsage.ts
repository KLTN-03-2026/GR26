import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '@modules/subscription/services/subscriptionService';
import { queryKeys } from '@shared/constants/queryKeys';

/**
 * Hook lấy số lượng dữ liệu hiện tại của tenant để FE chặn chọn gói thấp hơn quota.
 * Đây là guard UI, backend vẫn cần validate khi tạo hóa đơn/gia hạn.
 */
export const useTenantPackageUsage = () =>
  useQuery({
    queryKey: queryKeys.subscriptions.usage,
    queryFn: subscriptionService.getTenantPackageUsage,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
