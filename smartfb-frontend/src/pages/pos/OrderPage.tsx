import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useBranches } from '@modules/branch/hooks/useBranches';
import { useAddons } from '@modules/menu/hooks/useAddons';
import { useCategories } from '@modules/menu/hooks/useCategories';
import { useMenus } from '@modules/menu/hooks/useMenus';
import type { MenuItem } from '@modules/menu/types/menu.types';
import {
  OrderItemDialog,
  OrderCategoryTabs,
  OrderMenuGrid,
  OrderPageCartActions,
  OrderPageCartSidebar,
  OrderPageToolbar,
  TemporaryInvoiceDialog,
} from '@modules/order/components';
import {
  calculateLineTotal,
  getSafeAddons,
  isSameCartLine,
  mergeCartLineQuantity,
  ORDER_TAX_RATE,
  resolveOrderSource,
  toDialogMenuItem,
  toDraftItem,
  toDraftItemsFromOrder,
  toOrderItemCommand,
  toUpdateOrderItemCommand,
} from '@modules/order/components/order-page/orderPage.utils';
import {
  useOrderDetail,
  useOrderPricing,
  useTableActiveOrder,
} from '@modules/order/hooks';
import { orderService } from '@modules/order/services/orderService';
import { useOrderStore } from '@modules/order/stores/orderStore';
import type {
  OrderAddonSelection,
  OrderDraftItem,
  OrderResponse,
  OrderTableContext,
} from '@modules/order/types/order.types';
import {
  AUTO_CANCEL_EMPTY_CART_REASON,
  buildOrderRouteSearchParams,
  isSameOrderContext,
  resolveTableContextFromOrder,
} from '@modules/order/utils';
import { useZones } from '@modules/table/hooks/useZones';
import { queryKeys } from '@shared/constants/queryKeys';
import { ROUTES } from '@shared/constants/routes';
import { useDebounce } from '@shared/hooks/useDebounce';
import { cn } from '@shared/utils/cn';

export default function OrderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeMenuItemId, setActiveMenuItemId] = useState<string | null>(null);
  const [activeCartItemId, setActiveCartItemId] = useState<string | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [showCart, setShowCart] = useState(true);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);

  const debouncedSearchKeyword = useDebounce(searchKeyword.trim().toLowerCase(), 300);
  const currentUserName = useAuthStore((state) => state.user?.fullName ?? 'Nhân viên POS');
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);

  const { data: branches = [] } = useBranches();
  const { data: zones = [] } = useZones();
  const menuQuery = useMenus();
  const categoriesQuery = useCategories();
  const addonsQuery = useAddons();

  const {
    cart,
    tableContext,
    draftOrder,
    isSyncingDraft,
    clearDraft,
    setTableContext,
    setDraftOrder,
    setCart,
    upsertCartItem,
    removeFromCart,
    setSyncingDraft,
  } = useOrderStore();

  const branchNameMap = useMemo(() => {
    return new Map(branches.map((branch) => [branch.id, branch.name]));
  }, [branches]);

  const zoneNameMap = useMemo(() => {
    return new Map(zones.map((zone) => [zone.id, zone.name]));
  }, [zones]);

  const routeBranchName = searchParams.get('branchName')?.trim() ?? '';
  const routeOrderId = searchParams.get('orderId')?.trim() ?? '';
  const routeTableId = searchParams.get('tableId')?.trim() ?? '';
  const routeTableName = searchParams.get('tableName')?.trim() ?? '';
  const routeZoneId = searchParams.get('zoneId')?.trim() ?? '';
  const isFreshTakeawayRoute = searchParams.get('freshTakeaway') === 'true';

  const nextTableContext = useMemo(() => {
    const fallbackBranchName = currentBranchId
      ? branchNameMap.get(currentBranchId) ?? 'Chi nhánh đang chọn'
      : 'Chi nhánh hiện tại';
    const resolvedZoneName = routeZoneId ? zoneNameMap.get(routeZoneId) ?? '' : '';

    return {
      tableId: routeTableId || null,
      tableName: routeTableName,
      zoneId: routeZoneId || undefined,
      zoneName: resolvedZoneName,
      branchId: currentBranchId,
      branchName: routeBranchName || fallbackBranchName,
    };
  }, [
    branchNameMap,
    currentBranchId,
    routeBranchName,
    routeTableId,
    routeTableName,
    routeZoneId,
    zoneNameMap,
  ]);

  useEffect(() => {
    setTableContext(nextTableContext);
  }, [nextTableContext, setTableContext]);

  const isRouteContextReady = useMemo(() => {
    return isSameOrderContext(tableContext, nextTableContext);
  }, [nextTableContext, tableContext]);

  const tableActiveOrderQuery = useTableActiveOrder(routeTableId, {
    enabled: isRouteContextReady,
  });
  const resolvedActiveOrderId = useMemo(() => {
    if (!routeTableId) {
      return null;
    }

    /**
     * Khi query theo bàn vẫn đang fetch, không tin dữ liệu cache cũ.
     * Chỉ dùng `orderId` sau khi query của đúng `tableId` hiện tại đã ổn định.
     */
    if (tableActiveOrderQuery.isFetching) {
      return null;
    }

    return tableActiveOrderQuery.data?.id ?? null;
  }, [routeTableId, tableActiveOrderQuery.data?.id, tableActiveOrderQuery.isFetching]);

  const effectiveOrderId = useMemo(() => {
    // Khi route đang mang `orderId`, luôn ưu tiên giá trị trên URL để tránh phụ thuộc state cũ.
    if (routeOrderId) {
      return routeOrderId;
    }

    if (routeTableId) {
      /**
       * Với route theo bàn, chỉ dùng order resolve từ chính `tableId` hiện tại.
       * Không fallback sang `draftOrder.orderId` vì đó có thể là order của bàn trước.
       */
      return resolvedActiveOrderId;
    }

    if (isFreshTakeawayRoute) {
      return null;
    }

    return draftOrder.orderId;
  }, [
    draftOrder.orderId,
    isFreshTakeawayRoute,
    routeOrderId,
    routeTableId,
    resolvedActiveOrderId,
  ]);

  /**
   * Nút tạo đơn mang về cần mở giỏ hàng trắng, không dùng lại context cũ.
   * Sau khi reset xong sẽ dọn query param để refresh trang không bị clear lặp lại.
   */
  useEffect(() => {
    if (!isFreshTakeawayRoute || !isRouteContextReady || nextTableContext.tableId) {
      return;
    }

    clearDraft();
    navigate(ROUTES.POS_ORDER, { replace: true });
  }, [clearDraft, isFreshTakeawayRoute, isRouteContextReady, navigate, nextTableContext.tableId]);

  const menuItems = useMemo(() => {
    return (menuQuery.data?.data ?? [])
      .filter((item) => item.isActive !== false && item.isAvailable !== false)
      .map((item) => ({
        ...item,
        price: item.effectivePrice ?? item.branchPrice ?? item.price,
      }));
  }, [menuQuery.data?.data]);

  const menuItemsById = useMemo(() => {
    return new Map(menuItems.map((item) => [item.id, item]));
  }, [menuItems]);

  const categories = useMemo(() => {
    return (categoriesQuery.data?.data ?? []).filter((category) => category.isActive !== false);
  }, [categoriesQuery.data?.data]);

  const addons = useMemo(() => {
    return (addonsQuery.data?.data ?? []).filter((addon) => addon.isActive !== false);
  }, [addonsQuery.data?.data]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !debouncedSearchKeyword || item.name.toLowerCase().includes(debouncedSearchKeyword);

      return matchesCategory && matchesSearch;
    });
  }, [debouncedSearchKeyword, menuItems, selectedCategory]);

  const selectedMenuItem = useMemo(() => {
    return menuItems.find((item) => item.id === activeMenuItemId) ?? null;
  }, [activeMenuItemId, menuItems]);

  const editingCartItem = useMemo(() => {
    if (!activeCartItemId) {
      return null;
    }

    return cart.find((item) => item.draftItemId === activeCartItemId) ?? null;
  }, [activeCartItemId, cart]);

  const dialogMenuItem = useMemo(() => {
    if (editingCartItem) {
      return toDialogMenuItem(editingCartItem);
    }

    return selectedMenuItem;
  }, [editingCartItem, selectedMenuItem]);

  const { subtotal, vatAmount, totalAmount, totalItemCount } = useOrderPricing({
    cart,
    taxRate: ORDER_TAX_RATE,
  });

  const hasPlacedOrder = Boolean(draftOrder.orderId);
  const isPlacedOrderFinalized =
    draftOrder.status === 'COMPLETED' || draftOrder.status === 'CANCELLED';
  const orderDetailQuery = useOrderDetail(effectiveOrderId, {
    enabled:
      isRouteContextReady &&
      !isFreshTakeawayRoute &&
      (!routeTableId || !tableActiveOrderQuery.isFetching),
  });

  const isRecoveringExistingOrder =
    (Boolean(routeTableId) && tableActiveOrderQuery.isFetching) ||
    (Boolean(effectiveOrderId) && orderDetailQuery.isLoading && !draftOrder.orderId);
  const hasLoadingState =
    menuQuery.isLoading ||
    categoriesQuery.isLoading ||
    addonsQuery.isLoading ||
    isRecoveringExistingOrder;
  const hasErrorState =
    menuQuery.isError ||
    categoriesQuery.isError ||
    addonsQuery.isError ||
    tableActiveOrderQuery.isError ||
    (Boolean(effectiveOrderId) && orderDetailQuery.isError);

  const clearActiveSelections = () => {
    setActiveMenuItemId(null);
    setActiveCartItemId(null);
  };

  const replaceOrderRoute = (
    context: OrderTableContext | null | undefined,
    orderId?: string | null
  ) => {
    const nextSearchParams = buildOrderRouteSearchParams(context, orderId);
    const nextSearch = nextSearchParams.toString();

    if (nextSearch === searchParams.toString()) {
      return;
    }

    navigate(nextSearch ? `${ROUTES.POS_ORDER}?${nextSearch}` : ROUTES.POS_ORDER, {
      replace: true,
    });
  };

  const invalidateOrderRelatedQueries = (orderId?: string | null, tableId?: string | null) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders.active });
    void queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });

    if (tableId?.trim()) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orders.activeByTable(tableId.trim()),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tables.detail(tableId.trim()),
      });
    }

    if (orderId?.trim()) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(orderId.trim()),
      });
    }
  };

  /**
   * Đồng bộ đơn hàng từ backend về state local để FE chỉ render theo dữ liệu thật của API.
   */
  const applyOrderResponseToDraft = (order: OrderResponse): OrderTableContext => {
    const resolvedContext = resolveTableContextFromOrder(order, nextTableContext);

    setTableContext(resolvedContext);
    setDraftOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt ?? new Date().toISOString(),
    });
    setCart(toDraftItemsFromOrder(order, menuItemsById));
    replaceOrderRoute(resolvedContext, order.id);

    return resolvedContext;
  };

  /**
   * Tạo order ngay khi cart đang rỗng và người dùng thêm món đầu tiên.
   */
  const createOrderFromCart = async (
    nextCart: OrderDraftItem[],
    successMessage: string
  ): Promise<OrderResponse | null> => {
    if (nextCart.length === 0) {
      return null;
    }

    setSyncingDraft(true);

    try {
      const response = await orderService.placeOrder({
        tableId: (tableContext?.tableId ?? nextTableContext.tableId) ?? undefined,
        source: resolveOrderSource(tableContext?.tableId ?? nextTableContext.tableId),
        items: nextCart.map(toOrderItemCommand),
      });

      if (!response.success) {
        return null;
      }

      applyOrderResponseToDraft(response.data);
      invalidateOrderRelatedQueries(
        response.data.id,
        response.data.tableId ?? nextTableContext.tableId
      );
      toast.success(successMessage);

      return response.data;
    } catch {
      // Toast lỗi chung đã được axios interceptor xử lý.
      return null;
    } finally {
      setSyncingDraft(false);
    }
  };

  /**
   * Với đơn đã tạo, mọi thay đổi tiếp theo phải gọi API update để backend luôn là source of truth.
   */
  const updatePlacedOrder = async (
    nextCart: OrderDraftItem[],
    successMessage: string
  ): Promise<OrderResponse | null> => {
    if (!draftOrder.orderId || nextCart.length === 0) {
      return null;
    }

    setSyncingDraft(true);

    try {
      const response = await orderService.updateOrder(draftOrder.orderId, {
        tableId: (tableContext?.tableId ?? nextTableContext.tableId) ?? undefined,
        items: nextCart.map(toUpdateOrderItemCommand),
      });

      if (!response.success) {
        return null;
      }

      applyOrderResponseToDraft(response.data);
      invalidateOrderRelatedQueries(
        response.data.id,
        response.data.tableId ?? nextTableContext.tableId
      );
      toast.success(successMessage);

      return response.data;
    } catch {
      // Toast lỗi chung đã được axios interceptor xử lý.
      return null;
    } finally {
      setSyncingDraft(false);
    }
  };

  /**
   * Nếu giỏ hàng bị làm trống thì FE tự hủy order để không giữ lại order rỗng trên hệ thống.
   */
  const cancelCurrentOrder = async (
    reason: string | undefined,
    successMessage: string
  ): Promise<boolean> => {
    if (!draftOrder.orderId) {
      clearDraft();
      replaceOrderRoute(nextTableContext);
      return true;
    }

    setSyncingDraft(true);

    try {
      const response = await orderService.cancelOrder(draftOrder.orderId, {
        reason,
      });

      if (!response.success) {
        return false;
      }

      const cancelledOrderId = draftOrder.orderId;
      const cancelledTableId = tableContext?.tableId ?? nextTableContext.tableId ?? null;

      clearDraft();
      replaceOrderRoute(nextTableContext);
      invalidateOrderRelatedQueries(cancelledOrderId, cancelledTableId);
      toast.success(successMessage);

      return true;
    } catch {
      // Toast lỗi chung đã được axios interceptor xử lý.
      return false;
    } finally {
      setSyncingDraft(false);
    }
  };

  const applyOrderResponseToDraftEffect = useEffectEvent((order: OrderResponse) => {
    applyOrderResponseToDraft(order);
  });

  useEffect(() => {
    if (!orderDetailQuery.data) {
      return;
    }

    applyOrderResponseToDraftEffect(orderDetailQuery.data);
  }, [orderDetailQuery.data]);

  const handleOpenItemDialog = (menuItemId: string) => {
    if (isPlacedOrderFinalized) {
      toast.error('Đơn đã kết thúc. Không thể chỉnh món trên đơn này.');
      return;
    }

    setActiveCartItemId(null);
    setActiveMenuItemId(menuItemId);
  };

  const handleEditCartItem = (draftItemId: string) => {
    if (isPlacedOrderFinalized) {
      toast.error('Đơn đã kết thúc. Không thể chỉnh món trên đơn này.');
      return;
    }

    setActiveMenuItemId(null);
    setActiveCartItemId(draftItemId);
  };

  const handleDeleteCartItem = async (item: OrderDraftItem) => {
    if (isPlacedOrderFinalized) {
      toast.error('Đơn đã kết thúc. Không thể xóa món trên đơn này.');
      return;
    }

    const nextCart = cart.filter((cartItem) => cartItem.draftItemId !== item.draftItemId);

    if (hasPlacedOrder) {
      if (nextCart.length === 0) {
        await cancelCurrentOrder(
          AUTO_CANCEL_EMPTY_CART_REASON,
          'Đã hủy đơn vì không còn món nào trong giỏ'
        );
        return;
      }

      await updatePlacedOrder(nextCart, `Đã xóa ${item.name} khỏi đơn hàng`);
      return;
    }

    removeFromCart(item.draftItemId);
    toast.success(`Đã xóa ${item.name} khỏi giỏ hàng`);
  };

  const handleChangeItemQuantity = async (item: OrderDraftItem, delta: number) => {
    if (isPlacedOrderFinalized) {
      toast.error('Đơn đã kết thúc. Không thể đổi số lượng món trên đơn này.');
      return;
    }

    const nextQuantity = item.quantity + delta;

    if (nextQuantity <= 0) {
      await handleDeleteCartItem(item);
      return;
    }

    if (hasPlacedOrder) {
      const nextCart = cart.map((cartItem) =>
        cartItem.draftItemId === item.draftItemId
          ? {
              ...cartItem,
              quantity: nextQuantity,
              lineTotal: calculateLineTotal(
                cartItem.unitPrice,
                nextQuantity,
                getSafeAddons(cartItem)
              ),
            }
          : cartItem
      );

      await updatePlacedOrder(nextCart, `Đã cập nhật số lượng ${item.name}`);
      return;
    }

    upsertCartItem({
      ...item,
      quantity: nextQuantity,
      lineTotal: calculateLineTotal(item.unitPrice, nextQuantity, getSafeAddons(item)),
    });
  };

  const handleSubmitItem = async (payload: {
    quantity: number;
    notes: string;
    addons: OrderAddonSelection[];
  }) => {
    const targetMenuItem =
      selectedMenuItem ?? (editingCartItem ? toDialogMenuItem(editingCartItem) : null);

    if (!targetMenuItem) {
      return;
    }

    if (isPlacedOrderFinalized) {
      toast.error('Đơn đã kết thúc. Không thể chỉnh món trên đơn này.');
      return;
    }

    const submittedDraftItem = toDraftItem(
      targetMenuItem,
      payload.quantity,
      payload.addons,
      payload.notes,
      editingCartItem?.draftItemId,
      editingCartItem?.orderItemId
    );

    // Khi không ở chế độ edit, cùng món + cùng topping + cùng ghi chú sẽ được gộp số lượng.
    const matchedCartItem =
      editingCartItem ??
      cart.find((cartItem) => isSameCartLine(cartItem, submittedDraftItem)) ??
      null;
    const nextDraftItem =
      matchedCartItem && !editingCartItem
        ? mergeCartLineQuantity(matchedCartItem, submittedDraftItem)
        : submittedDraftItem;
    const nextCart = matchedCartItem
      ? cart.map((item) => (item.draftItemId === matchedCartItem.draftItemId ? nextDraftItem : item))
      : [...cart, nextDraftItem];

    if (hasPlacedOrder) {
      const syncedOrder = await updatePlacedOrder(
        nextCart,
        matchedCartItem ? 'Đã cập nhật món trên hệ thống' : 'Đã thêm món vào đơn hàng'
      );

      if (!syncedOrder) {
        return;
      }

      clearActiveSelections();
      return;
    }

    const createdOrder = await createOrderFromCart(nextCart, 'Đã tạo đơn hàng với món đầu tiên');

    if (!createdOrder) {
      return;
    }

    clearActiveSelections();
  };

  const handleOpenInvoice = () => {
    if (cart.length === 0) {
      toast.error('Chưa có món trong đơn để in hóa đơn tạm');
      return;
    }

    setIsInvoiceOpen(true);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Chưa có món trong đơn');
      return;
    }

    if (isPlacedOrderFinalized) {
      toast.error('Đơn đã kết thúc nên không thể tiếp tục thanh toán từ màn này.');
      return;
    }

    if (draftOrder.orderId) {
      const paymentSearchParams = buildOrderRouteSearchParams(
        tableContext ?? nextTableContext,
        draftOrder.orderId
      );

      navigate(`${ROUTES.POS_PAYMENT}?${paymentSearchParams.toString()}`);
      return;
    }

    const createdOrder = await createOrderFromCart(cart, 'Đã tạo đơn hàng trên hệ thống');

    if (!createdOrder) {
      return;
    }

    const paymentSearchParams = buildOrderRouteSearchParams(
      resolveTableContextFromOrder(createdOrder, nextTableContext),
      createdOrder.id
    );

    navigate(`${ROUTES.POS_PAYMENT}?${paymentSearchParams.toString()}`);
  };

  const handleCancelPlacedOrder = async () => {
    if (!draftOrder.orderId) {
      clearDraft();
      clearActiveSelections();
      replaceOrderRoute(nextTableContext);
      toast.success('Đã làm trống giỏ hàng hiện tại');
      return;
    }

    if (isPlacedOrderFinalized) {
      toast.error('Đơn đã kết thúc nên không thể hủy thêm.');
      return;
    }

    const reason = window.prompt('Lý do hủy đơn (có thể bỏ trống):', '');
    if (reason === null) {
      return;
    }

    const isCancelled = await cancelCurrentOrder(
      reason.trim() || undefined,
      'Đã hủy đơn và reset giỏ hàng của bàn hiện tại'
    );

    if (!isCancelled) {
      return;
    }

    clearActiveSelections();
  };

  const checkoutButtonLabel = isSyncingDraft
    ? 'Đang đồng bộ đơn...'
    : isPlacedOrderFinalized
      ? draftOrder.status === 'COMPLETED'
        ? 'Đơn đã hoàn tất'
        : 'Đơn đã hủy'
      : hasPlacedOrder
        ? 'Tiếp tục thanh toán'
        : 'Tạo đơn và thanh toán';
  const cartPanelProps = {
    cart,
    tableContext,
    draftOrder,
    currentUserName,
    hasPlacedOrder,
    isSyncingDraft,
    isItemActionsDisabled: isSyncingDraft || isPlacedOrderFinalized,
    totalItemCount,
    subtotal,
    vatAmount,
    totalAmount,
    checkoutButtonLabel,
    isCheckoutDisabled: isPlacedOrderFinalized,
    onOpenInvoice: handleOpenInvoice,
    onCancelPlacedOrder: () => void handleCancelPlacedOrder(),
    onEditCartItem: handleEditCartItem,
    onDeleteCartItem: (item: OrderDraftItem) => void handleDeleteCartItem(item),
    onChangeItemQuantity: (item: OrderDraftItem, delta: number) =>
      void handleChangeItemQuantity(item, delta),
    onCheckout: () => void handleCheckout(),
  };

  if (hasLoadingState) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-[32px] bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="font-medium text-slate-500">Đang tải dữ liệu order...</p>
        </div>
      </div>
    );
  }

  if (hasErrorState) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white">
        <div className="max-w-md text-center">
          <p className="text-lg font-bold text-slate-800">Không thể tải dữ liệu order</p>
          <p className="mt-2 text-sm text-slate-500">
            Kiểm tra lại API menu, category, addon hoặc dữ liệu order của bàn trước khi thao tác.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'grid min-h-[calc(100vh-10rem)] grid-cols-1 gap-6 xl:items-start',
          showCart && 'xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_440px]'
        )}
        >
        <section className="min-h-0 space-y-5">
          <OrderPageToolbar
            cartActions={
              <OrderPageCartActions
                showCart={showCart}
                totalItemCount={totalItemCount}
                isCartSheetOpen={isCartSheetOpen}
                onCartSheetOpenChange={setIsCartSheetOpen}
                onToggleCart={() => setShowCart((prev) => !prev)}
                cartPanelProps={cartPanelProps}
              />
            }
            searchKeyword={searchKeyword}
            tableName={tableContext?.tableName || 'Mang đi'}
            onSearchKeywordChange={setSearchKeyword}
          />

          <div className="text-sm text-slate-500">
            {totalItemCount > 0
              ? `Giỏ hàng hiện có ${totalItemCount} món cho ${tableContext?.tableName || 'đơn mang đi'}.`
              : 'Chưa có món nào trong giỏ hàng hiện tại.'}
          </div>

          <OrderCategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          <OrderMenuGrid items={filteredItems as MenuItem[]} onSelectItem={handleOpenItemDialog} />
        </section>

        <OrderPageCartSidebar showCart={showCart} cartPanelProps={cartPanelProps} />
      </div>

      <OrderItemDialog
        key={`${activeMenuItemId ?? 'empty'}-${activeCartItemId ?? 'new'}`}
        open={Boolean(dialogMenuItem)}
        menuItem={dialogMenuItem}
        initialItem={editingCartItem}
        addons={addons}
        isSubmitting={isSyncingDraft}
        onOpenChange={(open) => {
          if (!open) {
            clearActiveSelections();
          }
        }}
        onSubmit={handleSubmitItem}
      />

      <TemporaryInvoiceDialog
        open={isInvoiceOpen}
        branchName={tableContext?.branchName || 'Chi nhánh hiện tại'}
        createdBy={currentUserName}
        orderNumber={draftOrder.orderNumber || 'ORDER-TEMP'}
        createdAt={draftOrder.createdAt ?? new Date().toISOString()}
        tableContext={tableContext}
        cartItems={cart}
        subtotal={subtotal}
        vatAmount={vatAmount}
        totalAmount={totalAmount}
        onOpenChange={setIsInvoiceOpen}
        onPrint={() => window.print()}
      />
    </>
  );
}
