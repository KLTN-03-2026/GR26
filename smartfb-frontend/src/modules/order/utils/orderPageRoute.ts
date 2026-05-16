import type { OrderTableContext } from '@modules/order/types/order.types';

/**
 * Giữ toàn bộ context của thẻ trên URL để POS và payment có thể khôi phục đúng đơn đang thao tác.
 */
export const buildOrderRouteSearchParams = (
  context: OrderTableContext | null | undefined,
  orderId?: string | null
) => {
  const searchParams = new URLSearchParams();

  if (orderId?.trim()) {
    searchParams.set('orderId', orderId.trim());
  }

  if (context?.tableId?.trim()) {
    searchParams.set('tableId', context.tableId.trim());
  }

  if (context?.tableName.trim()) {
    searchParams.set('tableName', context.tableName.trim());
  }

  if (context?.zoneId?.trim()) {
    searchParams.set('zoneId', context.zoneId.trim());
  }

  if (context?.branchName.trim()) {
    searchParams.set('branchName', context.branchName.trim());
  }

  return searchParams;
};
