import { useMemo, useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import { OrderManagementHeader } from '@modules/order/components/order-management/OrderManagementHeader';
import { OrderManagementList } from '@modules/order/components/order-management/OrderManagementList';
import { OrderManagementPagination } from '@modules/order/components/order-management/OrderManagementPagination';
import {
  buildOrderDateRangeParams,
  buildOrderPageSearchParams,
  getOrderSummaryCards,
  resolveOrderNavigationTarget,
} from '@modules/order/components/order-management/orderManagement.utils';
import { ORDER_LIST_DEFAULT_PAGE_SIZE, useOrders } from '@modules/order/hooks/useOrders';
import type { OrderListItemResponse, OrderStatus } from '@modules/order/types/order.types';
import type { DateRangePickerValue } from '@shared/components/common/DateRangePicker';
import { PERMISSIONS } from '@shared/constants/permissions';
import { ROUTES } from '@shared/constants/routes';
import { usePermission } from '@shared/hooks/usePermission';
import { buildTodayDateRangeValue, isSameDateRangeValue } from '@shared/utils/datePresets';

/**
 * Các kích thước trang hợp lệ cho API order, không vượt giới hạn 100 của backend.
 */
const ORDER_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

/**
 * Danh sách rỗng ổn định để dependency của memo không đổi sau mỗi render.
 */
const EMPTY_ORDER_LIST: OrderListItemResponse[] = [];

const OrderManagementPage = () => {
  const navigate = useNavigate();
  const { can } = usePermission();
  const defaultDateRange = buildTodayDateRangeValue();
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRangePickerValue>(() => buildTodayDateRangeValue());
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(ORDER_LIST_DEFAULT_PAGE_SIZE);
  const canCreateOrder = can(PERMISSIONS.ORDER_CREATE);
  const dateRangeParams = useMemo(
    () =>
      buildOrderDateRangeParams({
        fromDate: dateRange.from ?? '',
        toDate: dateRange.to ?? '',
      }),
    [dateRange.from, dateRange.to]
  );

  const orderListParams = useMemo(
    () => ({
      status: activeTab === 'ALL' ? undefined : activeTab,
      from: dateRangeParams.from,
      to: dateRangeParams.to,
      page,
      size: pageSize,
    }),
    [activeTab, dateRangeParams.from, dateRangeParams.to, page, pageSize]
  );

  const orderListQuery = useOrders(orderListParams);
  const orderPage = orderListQuery.data?.data;
  const orders = orderPage?.content ?? EMPTY_ORDER_LIST;
  const isInitialLoading = orderListQuery.isLoading;
  const isFetching = orderListQuery.isFetching;
  const isError = orderListQuery.isError;
  const errorMessage =
    orderListQuery.error instanceof Error ? orderListQuery.error.message : undefined;

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
    return getOrderSummaryCards(orders, orderPage?.totalElements ?? orders.length);
  }, [orderPage?.totalElements, orders]);

  const hasOrders = (orderPage?.totalElements ?? 0) > 0;
  const hasActiveFilters =
    activeTab !== 'ALL' ||
    !isSameDateRangeValue(dateRange, defaultDateRange) ||
    searchQuery.trim().length > 0;

  const handleRefresh = () => {
    void orderListQuery.refetch();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleTabChange = (tab: OrderStatus | 'ALL') => {
    setActiveTab(tab);
    setPage(0);
  };

  const handleDateRangeChange = (value: DateRangePickerValue) => {
    setDateRange(value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setActiveTab('ALL');
    setDateRange(buildTodayDateRangeValue());
    setSearchQuery('');
    setPage(0);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(Math.max(nextPage - 1, 0));
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(0);
  };

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
        isLoading={isFetching}
        canCreateTakeaway={canCreateOrder}
        searchQuery={searchQuery}
        activeTab={activeTab}
        dateRange={dateRange}
        hasActiveFilters={hasActiveFilters}
        summaryCards={summaryCards}
        onRefresh={handleRefresh}
        onCreateTakeaway={handleCreateTakeawayOrder}
        onSearchChange={handleSearchChange}
        onTabChange={handleTabChange}
        onDateRangeChange={handleDateRangeChange}
        onClearFilters={handleClearFilters}
      />

      <div className="min-h-0 flex-1">
        <OrderManagementList
          orders={filteredOrders}
          isLoading={isInitialLoading}
          isError={isError}
          errorMessage={errorMessage}
          onOpenOrder={handleOpenOrder}
          onRetry={handleRefresh}
        />
      </div>

      {hasOrders ? (
        <OrderManagementPagination
          currentPage={(orderPage?.page ?? page) + 1}
          pageSize={orderPage?.size ?? pageSize}
          totalItems={orderPage?.totalElements ?? 0}
          totalPages={orderPage?.totalPages ?? 1}
          pageSizeOptions={ORDER_PAGE_SIZE_OPTIONS}
          isFetching={isFetching}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      ) : null}
    </section>
  );
};

export default OrderManagementPage;
