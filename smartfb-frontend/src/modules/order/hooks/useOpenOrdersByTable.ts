import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@modules/order/services/orderService';
import type { OrderListItemResponse, OrderStatus } from '@modules/order/types/order.types';
import { queryKeys } from '@shared/constants/queryKeys';

// Các trạng thái này xem như order đã kết thúc, không được mở lại từ màn bàn.
const CLOSED_ORDER_STATUSES: readonly OrderStatus[] = ['COMPLETED', 'CANCELLED'];

const resolveOrderCreatedTimestamp = (createdAt?: string): number => {
  if (!createdAt) {
    return 0;
  }

  const timestamp = new Date(createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

/**
 * Chỉ giữ lại đơn chưa kết thúc để màn bàn và POS có thể mở tiếp đúng order đang hoạt động.
 */
const filterOpenOrders = (orders: OrderListItemResponse[]): OrderListItemResponse[] => {
  return orders.filter((order) => {
    return !CLOSED_ORDER_STATUSES.includes(order.status) && Boolean(order.tableId?.trim());
  });
};

/**
 * Một bàn chỉ nên có tối đa 1 order đang mở.
 * Nếu backend trả trùng dữ liệu, FE ưu tiên đơn mới nhất để giảm nguy cơ mở nhầm order cũ.
 */
export const buildOpenOrdersByTableMap = (
  orders: OrderListItemResponse[]
): Map<string, OrderListItemResponse> => {
  return filterOpenOrders(orders).reduce<Map<string, OrderListItemResponse>>((accumulator, order) => {
    const tableId = order.tableId?.trim();

    if (!tableId) {
      return accumulator;
    }

    const currentOrder = accumulator.get(tableId);
    const currentTimestamp = resolveOrderCreatedTimestamp(currentOrder?.createdAt);
    const nextTimestamp = resolveOrderCreatedTimestamp(order.createdAt);

    if (!currentOrder || nextTimestamp >= currentTimestamp) {
      accumulator.set(tableId, order);
    }

    return accumulator;
  }, new Map<string, OrderListItemResponse>());
};

/**
 * Hook trả về map `tableId -> order đang mở` để màn bàn mở tiếp đúng đơn hiện tại.
 */
export const useOpenOrdersByTable = () => {
  const query = useQuery<OrderListItemResponse[]>({
    queryKey: queryKeys.orders.active,
    queryFn: async () => {
      const response = await orderService.getOrders();
      return filterOpenOrders(response.data);
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const openOrdersByTable = useMemo(() => {
    return buildOpenOrdersByTableMap(query.data ?? []);
  }, [query.data]);

  return {
    ...query,
    openOrdersByTable,
  };
};
