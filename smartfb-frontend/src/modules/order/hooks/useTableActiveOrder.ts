import { useQuery } from '@tanstack/react-query';
import { orderService } from '@modules/order/services/orderService';
import type { OrderListItemResponse } from '@modules/order/types/order.types';
import { queryKeys } from '@shared/constants/queryKeys';
import { buildOpenOrdersByTableMap } from './useOpenOrdersByTable';

interface UseTableActiveOrderOptions {
  enabled?: boolean;
}

/**
 * Hook dò order đang mở của một thẻ qua API danh sách đơn hàng.
 * FE dùng hook này để mở lại thẻ đang giao khách mà không phụ thuộc localStorage.
 *
 * @param tableId - id thẻ cần dò order đang mở
 * @param options - cờ bật/tắt query khi route chưa sẵn sàng
 */
export const useTableActiveOrder = (
  tableId?: string | null,
  options?: UseTableActiveOrderOptions
) => {
  const normalizedTableId = tableId?.trim() ?? '';

  return useQuery<OrderListItemResponse | null>({
    queryKey: queryKeys.orders.activeByTable(normalizedTableId || 'unknown'),
    queryFn: async ({ signal }) => {
      const response = await orderService.getOrders(
        { tableId: normalizedTableId },
        { signal }
      );

      return buildOpenOrdersByTableMap(response.data).get(normalizedTableId) ?? null;
    },
    enabled: Boolean(normalizedTableId) && (options?.enabled ?? true),
    staleTime: 0,
  });
};
