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
  available: 'Thẻ này hiện chưa có đơn đang mở.',
  occupied:
    'Không tìm thấy đơn đang mở của thẻ này. Vui lòng tải lại danh sách order hoặc kiểm tra màn quản lý order.',
  unpaid:
    'Không tìm thấy đơn chờ thanh toán của thẻ này. Vui lòng tải lại danh sách order hoặc kiểm tra màn quản lý order.',
  reserved: 'Thẻ này đang được giữ trước. Không thể mở order mới từ thẻ này.',
};

/**
 * Hook điều hướng từ màn thẻ gọi khách sang POS hoặc chi tiết order theo đúng quyền của user hiện tại.
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

        toast.error('Bạn không có quyền mở đơn hàng của thẻ này.');
        return;
      }

      if (!canCreateOrder) {
        toast.error('Bạn không có quyền tạo đơn hàng với thẻ này.');
        return;
      }

      navigateToOrderPage(table);
    },
    [canCreateOrder, canViewOrder, navigateToOrderDetailPage, navigateToOrderPage]
  );

  const handleSelectTable = useCallback(
    async (table: TableDisplayItem) => {
      if (table.usageStatus === 'reserved') {
        toast.error('Thẻ này đang được giữ trước. Không thể mở order mới từ thẻ này.');
        return;
      }

      // Thẻ sẵn sàng và có quyền tạo order → mở POS trực tiếp, không cần lookup
      if (table.usageStatus === 'available' && canCreateOrder) {
        handleOpenOrderFromTable(table);
        return;
      }

      // Thẻ đang giao khách (occupied/unpaid) hoặc không có quyền tạo:
      // luôn lookup orderId trước để POS mở đúng đơn đang có, không tạo đơn mới
      try {
        /**
         * Chỉ fetch order khi user thật sự click vào thẻ và cần mở theo `orderId`.
         * Màn quản lý thẻ không preload list order ngay lúc mount để tránh request thừa.
         */
        const response = await orderService.getOrders({ tableId: table.id });
        const resolvedOpenOrder = buildOpenOrdersByTableMap(response.data).get(table.id);

        if (resolvedOpenOrder) {
          handleOpenOrderFromTable(table, resolvedOpenOrder.id);
          return;
        }
      } catch {
        toast.error('Không thể kiểm tra đơn đang mở của thẻ này. Vui lòng thử lại.');
        return;
      }

      // Thẻ occupied nhưng không tìm được đơn mở — trường hợp dữ liệu không đồng bộ
      if (table.usageStatus === 'available' || canCreateOrder) {
        handleOpenOrderFromTable(table);
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
