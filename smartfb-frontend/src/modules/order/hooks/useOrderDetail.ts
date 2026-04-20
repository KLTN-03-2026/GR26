import { useQuery } from '@tanstack/react-query';
import { parseAddonPayload } from '@modules/order/components/order-page/orderPage.utils';
import { queryKeys } from '@shared/constants/queryKeys';
import { orderService } from '@modules/order/services/orderService';
import type { OrderResponse } from '@modules/order/types/order.types';

interface UseOrderDetailOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchOnMount?: boolean | 'always';
}

const normalizeOrderDetail = (order: OrderResponse): OrderResponse => {
  return {
    ...order,
    // Chuẩn hóa addon ngay tại hook để toàn bộ UI detail dùng cùng một shape dữ liệu.
    items: order.items.map((item) => ({
      ...item,
      addons: parseAddonPayload(item.addons),
    })),
  };
};

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
    select: normalizeOrderDetail,
    enabled: Boolean(orderId) && (options?.enabled ?? true),
    staleTime: options?.staleTime ?? 0,
    refetchOnMount: options?.refetchOnMount,
  });
};
