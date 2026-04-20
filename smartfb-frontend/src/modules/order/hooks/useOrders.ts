import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { orderService } from '@modules/order/services/orderService';
import type { OrderListQueryParams } from '@modules/order/types/order.types';

/**
 * Số order mặc định mỗi trang trên màn quản lý đơn hàng.
 */
export const ORDER_LIST_DEFAULT_PAGE_SIZE = 20;

const normalizeOrderListParams = (
  params?: OrderListQueryParams
): Required<Pick<OrderListQueryParams, 'page' | 'size'>> &
  Omit<OrderListQueryParams, 'page' | 'size'> => {
  return {
    status: params?.status,
    from: params?.from,
    to: params?.to,
    tableId: params?.tableId,
    page: params?.page ?? 0,
    size: params?.size ?? ORDER_LIST_DEFAULT_PAGE_SIZE,
  };
};

/**
 * Hook lấy danh sách order theo server-side pagination.
 *
 * @param params - Bộ lọc order và phân trang theo contract backend.
 */
export const useOrders = (params?: OrderListQueryParams) => {
  const normalizedParams = normalizeOrderListParams(params);

  return useQuery({
    queryKey: queryKeys.orders.list(normalizedParams),
    queryFn: ({ signal }) => orderService.getOrderPage(normalizedParams, { signal }),
    staleTime: 30 * 1000, // 30 giây để danh sách order đủ tươi cho vận hành POS
    retry: 1,
  });
};
