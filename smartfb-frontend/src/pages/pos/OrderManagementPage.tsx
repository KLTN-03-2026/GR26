import { useEffect, useMemo, useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import { OrderManagementHeader } from '@modules/order/components/order-management/OrderManagementHeader';
import { OrderManagementList } from '@modules/order/components/order-management/OrderManagementList';
import {
  buildOrderPageSearchParams,
  getOrderSummaryCards,
  resolveOrderNavigationTarget,
} from '@modules/order/components/order-management/orderManagement.utils';
import { useOrderStore } from '@modules/order/stores/orderStore';
import type { OrderListItemResponse, OrderStatus } from '@modules/order/types/order.types';
import { PERMISSIONS } from '@shared/constants/permissions';
import { ROUTES } from '@shared/constants/routes';
import { usePermission } from '@shared/hooks/usePermission';

const OrderManagementPage = () => {
  const navigate = useNavigate();
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const { can } = usePermission();
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const canCreateOrder = can(PERMISSIONS.ORDER_CREATE);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const normalizedSearchQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = activeTab === 'ALL' || order.status === activeTab;

      if (!normalizedSearchQuery) {
        return matchesStatus;
      }

      const orderNumber = order.orderNumber.toLowerCase();
      const tableName = (order.tableName ?? '').toLowerCase();

      return (
        matchesStatus &&
        (orderNumber.includes(normalizedSearchQuery) || tableName.includes(normalizedSearchQuery))
      );
    });
  }, [activeTab, normalizedSearchQuery, orders]);

  const summaryCards = useMemo(() => {
    return getOrderSummaryCards(orders);
  }, [orders]);

  /**
   * Card order sẽ điều hướng theo trạng thái:
   * đơn đang mở quay về POS, đơn đã đóng chuyển sang màn read-only.
   */
  const handleOpenOrder = (order: OrderListItemResponse) => {
    const shouldOpenDetail =
      resolveOrderNavigationTarget(order.status) === 'detail' || !canCreateOrder;

    if (shouldOpenDetail) {
      navigate(generatePath(ROUTES.POS_ORDER_DETAIL, { orderId: order.id }));
      return;
    }

    const search = buildOrderPageSearchParams({
      orderId: order.id,
      tableId: order.tableId ?? undefined,
      tableName: order.tableName ?? undefined,
    });

    navigate(`${ROUTES.POS_ORDER}?${search}`);
  };

  const handleCreateTakeawayOrder = () => {
    const search = buildOrderPageSearchParams({
      freshTakeaway: true,
    });

    navigate(`${ROUTES.POS_ORDER}?${search}`);
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-col gap-6">
      <OrderManagementHeader
        isLoading={isLoading}
        canCreateTakeaway={canCreateOrder}
        searchQuery={searchQuery}
        activeTab={activeTab}
        summaryCards={summaryCards}
        onRefresh={() => void fetchOrders()}
        onCreateTakeaway={handleCreateTakeawayOrder}
        onSearchChange={setSearchQuery}
        onTabChange={setActiveTab}
      />

      <div className="min-h-0 flex-1">
        <OrderManagementList
          orders={filteredOrders}
          isLoading={isLoading}
          onOpenOrder={handleOpenOrder}
        />
      </div>
    </section>
  );
};

export default OrderManagementPage;
