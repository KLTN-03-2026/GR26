import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { StompSubscription } from '@stomp/stompjs';
import { queryKeys } from '@shared/constants/queryKeys';
import { useAuthStore, selectCurrentBranchId } from '@modules/auth/stores/authStore';
import { getStompClient, onStompConnected } from '@lib/socket';
import type { OrderResponse, OrderStatus } from '../types/order.types';

/**
 * Payload OrderResponse BE gửi qua WebSocket.
 * Jackson serialize Java record thành camelCase mặc định.
 */
interface WsOrderPayload {
  id: string;
  orderNumber: string;
  tableId?: string | null;
  tableName?: string | null;
  staffName?: string | null;
  source?: string | null;
  status: string;
  subtotal?: number | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  totalAmount: number;
  notes?: string | null;
  createdAt?: string | null;
  completedAt?: string | null;
  items?: OrderResponse['items'] | null;
}

/**
 * Hook subscribe WebSocket topic order của chi nhánh hiện tại.
 *
 * Khi BE broadcast trạng thái order mới (đổi status hoặc tạo mới),
 * hook thực hiện:
 * 1. Invalidate toàn bộ danh sách order đang active để refetch lại trang hiện tại.
 * 2. Partial update cache chi tiết đơn (chỉ status/amount) nếu đang được cache
 *    — tránh ghi đè addons chưa normalize.
 * 3. Invalidate cache active order theo thẻ nếu order có tableId
 *    — POS thẻ phát hiện đơn đang mở thay đổi trạng thái.
 *
 * Subscribe topic: /topic/orders/{branchId}
 *
 * @example
 * // Gọi trong OrderManagementPage
 * useOrderRealtime();
 */
export const useOrderRealtime = () => {
  const queryClient = useQueryClient();
  const branchId = useAuthStore(selectCurrentBranchId);

  useEffect(() => {
    if (!branchId) return;

    const topic = `/topic/orders/${branchId}`;
    let subscription: StompSubscription | null = null;
    const client = getStompClient();

    /**
     * Xử lý message nhận được từ WebSocket.
     * BE luôn gửi single OrderResponse (không phải mảng).
     */
    const handleMessage = (payload: unknown) => {
      const order = payload as WsOrderPayload;

      // 1. Invalidate danh sách order — trigger refetch trang hiện tại
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists });

      // 2. Cập nhật cache chi tiết với dữ liệu đầy đủ từ WS payload (bao gồm items).
      //    useOrderDetail dùng `select: normalizeOrderDetail` để normalize addons,
      //    nên setQueryData với raw payload sẽ được tự động normalize khi đọc ra.
      queryClient.setQueryData<OrderResponse>(
        queryKeys.orders.detail(order.id),
        (cached) => {
          if (!cached) return cached;
          return {
            ...cached,
            status: order.status as OrderStatus,
            totalAmount: order.totalAmount,
            completedAt: order.completedAt ?? cached.completedAt,
            // Cập nhật items nếu WS payload có gửi kèm (update order luôn có items)
            ...(order.items != null && { items: order.items }),
          };
        }
      );

      // 3. Invalidate active order của thẻ để POS thẻ đồng bộ trạng thái
      if (order.tableId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.orders.activeByTable(order.tableId),
        });
      }
    };

    /**
     * Subscribe topic và lưu subscription để cleanup.
     * Được gọi cả khi connect lần đầu lẫn khi reconnect.
     *
     * FIX: Dùng onStompConnected registry thay vì ghi đè client.onConnect.
     * Pattern cũ ghi đè trực tiếp → khi nhiều hook cùng mount trước khi
     * client connected, chỉ hook cuối giữ được callback → các hook khác
     * mất subscription → User B không nhận WS message → giỏ hàng không update.
     */
    const doSubscribe = () => {
      subscription?.unsubscribe();
      subscription = client.subscribe(topic, (message) => {
        try {
          handleMessage(JSON.parse(message.body));
        } catch {
          console.error('[WS] useOrderRealtime: parse lỗi', message.body);
        }
      });
    };

    // Subscribe ngay nếu đã connected
    if (client.connected) {
      doSubscribe();
    }

    // Đăng ký để (re)subscribe khi connect/reconnect thành công
    const unregisterConnect = onStompConnected(doSubscribe);

    return () => {
      // Cleanup: hủy subscribe + hủy đăng ký connect listener
      subscription?.unsubscribe();
      unregisterConnect();
    };
  }, [branchId, queryClient]);
};
