import type { OrderStatus } from '@modules/order/types/order.types';

/**
 * Ma trận chuyển trạng thái hợp lệ của đơn hàng POS.
 * Đơn đã hoàn tất hoặc đã hủy là trạng thái đóng, không được quay lại luồng xử lý.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Kiểm tra chuyển trạng thái đơn hàng có hợp lệ ở phía FE trước khi gọi API.
 *
 * @param currentStatus - Trạng thái hiện tại của đơn
 * @param nextStatus - Trạng thái muốn chuyển sang
 */
export const isValidOrderStatusTransition = (
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): boolean => {
  if (currentStatus === nextStatus) {
    return true;
  }

  return ORDER_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
};
