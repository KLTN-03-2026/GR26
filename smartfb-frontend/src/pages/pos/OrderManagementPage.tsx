import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderManagementDetailPanel } from '@modules/order/components/order-management/OrderManagementDetailPanel';
import { OrderManagementHeader } from '@modules/order/components/order-management/OrderManagementHeader';
import { OrderManagementList } from '@modules/order/components/order-management/OrderManagementList';
import {
  buildOrderPageSearchParams,
  getOrderSummaryCards,
} from '@modules/order/components/order-management/orderManagement.utils';
import { useOrderDetail } from '@modules/order/hooks/useOrderDetail';
import { useOrderStore } from '@modules/order/stores/orderStore';
import type { OrderListItemResponse, OrderStatus } from '@modules/order/types/order.types';
import { ROUTES } from '@shared/constants/routes';

const OrderManagementPage = () => {
  const navigate = useNavigate();
  const { orders, fetchOrders, isLoading, updateOrderStatus } = useOrderStore();
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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

  const selectedOrderSummary = useMemo(() => {
    if (filteredOrders.length === 0) {
      return null;
    }

    if (!selectedOrderId) {
      return filteredOrders[0];
    }

    return filteredOrders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0];
  }, [filteredOrders, selectedOrderId]);

  const selectedOrderQuery = useOrderDetail(selectedOrderSummary?.id ?? null);

  const summaryCards = useMemo(() => {
    return getOrderSummaryCards(orders);
  }, [orders]);

  /**
   * Đơn chưa thanh toán cần mở lại đúng context tại POS để xem và xử lý tiếp cart hiện tại.
   */
  const handleOpenOrder = (order: OrderListItemResponse) => {
    const search = buildOrderPageSearchParams({
      orderId: order.id,
      tableId: order.tableId ?? undefined,
      tableName: order.tableName ?? undefined,
    });

    navigate(`${ROUTES.POS_ORDER}?${search}`);
  };

  /**
   * CTA tạo đơn mới tại trang quản lý sẽ đi vào luồng mang về để nhân viên tạo cart mới nhanh hơn.
   */
  const handleCreateTakeawayOrder = () => {
    const search = buildOrderPageSearchParams({
      freshTakeaway: true,
    });

    navigate(`${ROUTES.POS_ORDER}?${search}`);
  };

  const handleCancelOrder = async (orderId: string) => {
    const reason = window.prompt('Lý do hủy đơn?');

    if (!reason) {
      return;
    }

    await updateOrderStatus(orderId, 'CANCELLED', reason);
    void fetchOrders();
    void selectedOrderQuery.refetch();
  };

  return (
    <div className="grid min-h-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
      <section className="flex min-h-0 min-w-0 flex-col gap-6">
        <OrderManagementHeader
          isLoading={isLoading}
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
            selectedOrderId={selectedOrderSummary?.id ?? null}
            onOpenOrder={handleOpenOrder}
            onSelectOrder={setSelectedOrderId}
          />
        </div>
      </section>

      <OrderManagementDetailPanel
        selectedOrder={selectedOrderQuery.data ?? null}
        isLoading={Boolean(selectedOrderSummary?.id) && selectedOrderQuery.isFetching}
        onUpdateStatus={(orderId, status) => {
          void updateOrderStatus(orderId, status).then(() => {
            void fetchOrders();
            void selectedOrderQuery.refetch();
          });
        }}
        onCancelOrder={(orderId) => void handleCancelOrder(orderId)}
      />
    </div>
  );
};

export default OrderManagementPage;
