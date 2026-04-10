import { useEffect, useMemo, useState } from 'react';
import { OrderManagementDetailPanel } from '@modules/order/components/order-management/OrderManagementDetailPanel';
import { OrderManagementHeader } from '@modules/order/components/order-management/OrderManagementHeader';
import { OrderManagementList } from '@modules/order/components/order-management/OrderManagementList';
import { getOrderSummaryCards } from '@modules/order/components/order-management/orderManagement.utils';
import { useOrderStore } from '@modules/order/stores/orderStore';
import type { OrderStatus } from '@modules/order/types/order.types';

const OrderManagementPage = () => {
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

  const selectedOrder = useMemo(() => {
    if (filteredOrders.length === 0) {
      return null;
    }

    if (!selectedOrderId) {
      return filteredOrders[0];
    }

    return filteredOrders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0];
  }, [filteredOrders, selectedOrderId]);

  const summaryCards = useMemo(() => {
    return getOrderSummaryCards(orders);
  }, [orders]);

  const handleCancelOrder = (orderId: string) => {
    const reason = window.prompt('Lý do hủy đơn?');

    if (!reason) {
      return;
    }

    void updateOrderStatus(orderId, 'CANCELLED', reason);
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
          onSearchChange={setSearchQuery}
          onTabChange={setActiveTab}
        />

        <div className="min-h-0 flex-1">
          <OrderManagementList
            orders={filteredOrders}
            isLoading={isLoading}
            selectedOrderId={selectedOrder?.id ?? null}
            onSelectOrder={setSelectedOrderId}
          />
        </div>
      </section>

      <OrderManagementDetailPanel
        selectedOrder={selectedOrder}
        onUpdateStatus={(orderId, status) => void updateOrderStatus(orderId, status)}
        onCancelOrder={handleCancelOrder}
      />
    </div>
  );
};

export default OrderManagementPage;
