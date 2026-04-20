import type {
  OrderResponse,
  OrderTableContext,
} from '@modules/order/types/order.types';

/**
 * FE dùng reason ngầm để backend biết đây là trường hợp đơn bị làm trống giỏ hàng.
 */
export const AUTO_CANCEL_EMPTY_CART_REASON = 'AUTO_CANCEL_EMPTY_CART';

/**
 * So sánh context hiện tại với context đọc từ URL để biết khi nào store đã đồng bộ xong.
 */
export const isSameOrderContext = (
  currentContext: OrderTableContext | null,
  nextContext: OrderTableContext
): boolean => {
  return (
    currentContext?.tableId === nextContext.tableId &&
    currentContext?.tableName === nextContext.tableName &&
    currentContext?.zoneId === nextContext.zoneId &&
    currentContext?.zoneName === nextContext.zoneName &&
    currentContext?.branchId === nextContext.branchId &&
    currentContext?.branchName === nextContext.branchName
  );
};

/**
 * Dựng lại context bàn hoặc mang đi từ chi tiết đơn hàng để POS mở đúng cart đang thao tác.
 */
export const resolveTableContextFromOrder = (
  order: OrderResponse,
  fallbackContext: OrderTableContext
): OrderTableContext => {
  if (order.source === 'IN_STORE' && order.tableId) {
    return {
      ...fallbackContext,
      tableId: order.tableId,
      tableName: order.tableName?.trim() || fallbackContext.tableName,
    };
  }

  return {
    ...fallbackContext,
    tableId: null,
    tableName: '',
    zoneId: undefined,
    zoneName: '',
  };
};

/**
 * Giữ toàn bộ context của bàn trên URL để POS và payment có thể khôi phục đúng đơn đang thao tác.
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
