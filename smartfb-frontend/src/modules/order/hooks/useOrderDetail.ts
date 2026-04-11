import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { orderService } from '@modules/order/services/orderService';
import type { OrderResponse } from '@modules/order/types/order.types';

interface UseOrderDetailOptions {
  enabled?: boolean;
}

/**
 * Hook lấy chi tiết đơn hàng theo id.
 * Dùng khi FE cần đồng bộ lại dữ liệu order từ backend thay vì tin vào state cục bộ.
 *
 * @param orderId - id đơn hàng cần lấy chi tiết
 */
export const useOrderDetail = (orderId?: string | null, options?: UseOrderDetailOptions) => {
  return useQuery<OrderResponse>({
    queryKey: queryKeys.orders.detail(orderId ?? 'unknown'),
    queryFn: async () => {
      const response = await orderService.getById(orderId ?? '');
      return response.data;
    },
    enabled: Boolean(orderId) && (options?.enabled ?? true),
    staleTime: 0,
  });
};
