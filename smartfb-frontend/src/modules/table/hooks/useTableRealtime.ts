import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useAuthStore, selectCurrentBranchId } from '@modules/auth/stores/authStore';
import { getStompClient } from '@lib/socket';
import type { TableItem } from '../types/table.types';
import type { StompSubscription } from '@stomp/stompjs';

/**
 * Payload TableResponse từ BE WebSocket.
 * Cùng shape với BackendTableResponse trong tableService.ts.
 */
interface WsTablePayload {
  id: string;
  branchId: string;
  zoneId: string;
  name: string;
  capacity: number;
  status: string;       // AVAILABLE | OCCUPIED | CLEANING
  positionX: number;
  positionY: number;
  shape: string;
  isActive: boolean;
}

/**
 * Map usageStatus từ BE sang FE.
 */
const mapUsageStatus = (status: string): TableItem['usageStatus'] => {
  switch (status) {
    case 'OCCUPIED':  return 'occupied';
    case 'RESERVED':  return 'reserved';
    case 'UNPAID':    return 'unpaid';
    default:          return 'available';
  }
};

/**
 * Hook subscribe WebSocket topic bàn của chi nhánh hiện tại.
 * Khi BE broadcast trạng thái bàn mới (OCCUPIED / AVAILABLE),
 * hook cập nhật trực tiếp React Query cache — không refetch,
 * không có loading flicker.
 *
 * Xử lý cả 2 dạng payload BE có thể gửi:
 * - TableResponse   (single object) — khi 1 bàn đổi trạng thái
 * - TableResponse[] (mảng)          — khi batch update positions
 *
 * @example
 * // Gọi trong TablesPage hoặc layout bọc ngoài trang bàn
 * useTableRealtime();
 */
export const useTableRealtime = () => {
  const queryClient = useQueryClient();
  const branchId = useAuthStore(selectCurrentBranchId);

  useEffect(() => {
    if (!branchId) return;

    const topic = `/topic/tables/${branchId}`;
    let subscription: StompSubscription | null = null;
    const client = getStompClient();

    /**
     * Xử lý message nhận được từ WebSocket.
     * BE có thể gửi single TableResponse hoặc mảng TableResponse[].
     */
    const handleMessage = (payload: unknown) => {
      // Chuẩn hóa về mảng để xử lý thống nhất
      const tables: WsTablePayload[] = Array.isArray(payload)
        ? (payload as WsTablePayload[])
        : [payload as WsTablePayload];

      // Cập nhật cache danh sách bàn
      queryClient.setQueryData<TableItem[]>(
        queryKeys.tables.list(),
        (cached) => {
          if (!cached) return cached;

          // Map từng bàn nhận được vào cache hiện có
          return cached.map((item) => {
            const updated = tables.find((t) => t.id === item.id);
            if (!updated) return item;

            // Chỉ cập nhật các trường trạng thái, giữ nguyên zoneName/branchName đã join
            return {
              ...item,
              usageStatus: mapUsageStatus(updated.status),
              status: updated.isActive === false ? 'inactive' : 'active',
              positionX: updated.positionX ?? item.positionX,
              positionY: updated.positionY ?? item.positionY,
            };
          });
        }
      );

      // Cập nhật cache chi tiết từng bàn nếu đang được cache
      tables.forEach((t) => {
        queryClient.setQueryData<TableItem>(
          queryKeys.tables.detail(t.id),
          (cached) => {
            if (!cached) return cached;
            return {
              ...cached,
              usageStatus: mapUsageStatus(t.status),
              status: t.isActive === false ? 'inactive' : 'active',
            };
          }
        );
      });
    };

    if (client.connected) {
      // Client đã connected — subscribe ngay
      subscription = client.subscribe(topic, (message) => {
        try {
          handleMessage(JSON.parse(message.body));
        } catch {
          console.error('[WS] useTableRealtime: parse lỗi', message.body);
        }
      });
    } else {
      // Client chưa connected — đợi connect xong rồi subscribe
      const prevOnConnect = client.onConnect;
      client.onConnect = (frame) => {
        prevOnConnect?.(frame);
        subscription = client.subscribe(topic, (message) => {
          try {
            handleMessage(JSON.parse(message.body));
          } catch {
            console.error('[WS] useTableRealtime: parse lỗi', message.body);
          }
        });
      };
    }

    return () => {
      // Cleanup: hủy subscribe khi unmount hoặc branchId thay đổi
      subscription?.unsubscribe();
    };
  }, [branchId, queryClient]);
};
