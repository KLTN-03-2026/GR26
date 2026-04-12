import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { generatePath, useNavigate } from 'react-router-dom';

import { buildOpenOrdersByTableMap } from '@modules/order/hooks/useOpenOrdersByTable';
import { orderService } from '@modules/order/services/orderService';
import type {
  TableDisplayItem,
  TableUsageStatus,
} from '@modules/table/types/table.types';
import { buildTableOrderSearchParams } from '@modules/table/utils';
import { PERMISSIONS } from '@shared/constants/permissions';
import { ROUTES } from '@shared/constants/routes';
import { usePermission } from '@shared/hooks/usePermission';

const TABLE_STATUS_MESSAGE_MAP: Record<TableUsageStatus, string> = {
  available: 'Bàn này hiện chưa có đơn đang mở.',
  occupied:
    'Không tìm thấy đơn đang mở của bàn này. Vui lòng tải lại danh sách order hoặc kiểm tra màn quản lý order.',
  unpaid:
    'Không tìm thấy đơn chờ thanh toán của bàn này. Vui lòng tải lại danh sách order hoặc kiểm tra màn quản lý order.',
  reserved: 'Bàn này đang được đặt trước. Không thể mở order mới từ bàn này.',
};

/**
 * Hook điều hướng từ màn bàn sang POS hoặc chi tiết order theo đúng quyền của user hiện tại.
 */
export const useTableOrderNavigation = () => {
  const navigate = useNavigate();
  const { can } = usePermission();
  const canCreateOrder = can(PERMISSIONS.ORDER_CREATE);
  const canViewOrder = can(PERMISSIONS.ORDER_VIEW);

  const navigateToOrderPage = useCallback(
    (table: TableDisplayItem, orderId?: string) => {
      const searchParams = buildTableOrderSearchParams(table, orderId);
      navigate(`${ROUTES.POS_ORDER}?${searchParams}`);
    },
    [navigate]
  );

  const navigateToOrderDetailPage = useCallback(
    (orderId: string) => {
      navigate(generatePath(ROUTES.POS_ORDER_DETAIL, { orderId }));
    },
    [navigate]
  );

  const handleOpenOrderFromTable = useCallback(
    (table: TableDisplayItem, orderId?: string) => {
      const normalizedOrderId = orderId?.trim();

      if (normalizedOrderId) {
        if (canCreateOrder) {
          navigateToOrderPage(table, normalizedOrderId);
          return;
        }

        if (canViewOrder) {
          navigateToOrderDetailPage(normalizedOrderId);
          return;
        }

        toast.error('Bạn không có quyền mở đơn hàng của bàn này.');
        return;
      }

      if (!canCreateOrder) {
        toast.error('Bạn không có quyền tạo đơn hàng tại bàn này.');
        return;
      }

      navigateToOrderPage(table);
    },
    [canCreateOrder, canViewOrder, navigateToOrderDetailPage, navigateToOrderPage]
  );

  const handleSelectTable = useCallback(
    async (table: TableDisplayItem) => {
      if (table.usageStatus === 'reserved') {
        toast.error('Bàn này đang được đặt trước. Không thể mở order mới từ bàn này.');
        return;
      }

      if (canCreateOrder) {
        handleOpenOrderFromTable(table);
        return;
      }

      try {
        /**
         * Chỉ fetch order khi user thật sự click vào bàn và cần mở theo `orderId`.
         * Màn quản lý bàn không preload list order ngay lúc mount để tránh request thừa.
         */
        const response = await orderService.getOrders({ tableId: table.id });
        const resolvedOpenOrder = buildOpenOrdersByTableMap(response.data).get(table.id);

        if (resolvedOpenOrder) {
          handleOpenOrderFromTable(table, resolvedOpenOrder.id);
          return;
        }
      } catch {
        toast.error('Không thể kiểm tra đơn đang mở của bàn này. Vui lòng thử lại.');
        return;
      }

      toast.error(TABLE_STATUS_MESSAGE_MAP[table.usageStatus]);
    },
    [canCreateOrder, handleOpenOrderFromTable]
  );

  return {
    handleSelectTable,
  };
};
