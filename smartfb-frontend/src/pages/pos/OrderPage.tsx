import { useEffect, useMemo, useState } from 'react';
import { PanelRightClose, PanelRightOpen, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useBranches } from '@modules/branch/hooks/useBranches';
import { useAddons } from '@modules/menu/hooks/useAddons';
import { useCategories } from '@modules/menu/hooks/useCategories';
import { useMenus } from '@modules/menu/hooks/useMenus';
import type { MenuItem } from '@modules/menu/types/menu.types';
import { OrderCartPanel } from '@modules/order/components/order-page/OrderCartPanel';
import { OrderCategoryTabs } from '@modules/order/components/order-page/OrderCategoryTabs';
import { OrderMenuGrid } from '@modules/order/components/order-page/OrderMenuGrid';
import { OrderPageToolbar } from '@modules/order/components/order-page/OrderPageToolbar';
import {
  calculateLineTotal,
  getSafeAddons,
  isSameCartLine,
  mergeCartLineQuantity,
  ORDER_TAX_RATE,
  resolveOrderSource,
  toDraftItemsFromOrder,
  toDialogMenuItem,
  toDraftItem,
  toOrderItemCommand,
  toUpdateOrderItemCommand,
} from '@modules/order/components/order-page/orderPage.utils';
import { OrderItemDialog } from '@modules/order/components/OrderItemDialog';
import { TemporaryInvoiceDialog } from '@modules/order/components/TemporaryInvoiceDialog';
import { useOrderDetail } from '@modules/order/hooks/useOrderDetail';
import { useOrderPricing } from '@modules/order/hooks/useOrderPricing';
import { orderService } from '@modules/order/services/orderService';
import { useOrderStore } from '@modules/order/stores/orderStore';
import type {
  OrderAddonSelection,
  OrderDraftItem,
  OrderResponse,
  OrderTableContext,
} from '@modules/order/types/order.types';
import { useZones } from '@modules/table/hooks/useZones';
import { Button } from '@shared/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@shared/components/ui/sheet';
import { ROUTES } from '@shared/constants/routes';
import { useDebounce } from '@shared/hooks/useDebounce';
import { cn } from '@shared/utils/cn';

/**
 * So sánh context hiện tại với context đọc từ URL để biết khi nào store đã đồng bộ xong.
 */
const isSameOrderContext = (
  currentContext: OrderTableContext | null,
  nextContext: OrderTableContext
): boolean => {
  return (
    currentContext?.tableId === nextContext.tableId &&
    currentContext?.tableName === nextContext.tableName &&
    currentContext?.zoneId === nextContext.zoneId &&
    currentContext?.zoneName === nextContext.zoneName &&
    currentContext?.branchId === nextContext.branchId &&
    currentContext?.branchName === nextContext.branchName
  );
};

/**
 * Dựng lại context bàn/mang về từ chi tiết đơn hàng để POS mở đúng cart đang thao tác.
 */
const resolveTableContextFromOrder = (
  order: OrderResponse,
  fallbackContext: OrderTableContext
): OrderTableContext => {
  if (order.source === 'IN_STORE' && order.tableId) {
    return {
      ...fallbackContext,
      tableId: order.tableId,
      tableName: order.tableName?.trim() || fallbackContext.tableName,
    };
  }

  return {
    ...fallbackContext,
    tableId: null,
    tableName: '',
    zoneId: undefined,
    zoneName: '',
  };
};

export default function OrderPage() {
  const navigate = useNavigate();
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

  const effectiveOrderId = useMemo(() => {
    if (routeOrderId) {
      return routeOrderId;
    }

    if (isFreshTakeawayRoute) {
      return null;
    }

    return draftOrder.orderId;
  }, [draftOrder.orderId, isFreshTakeawayRoute, routeOrderId]);

  /**
   * Nút tạo đơn mang về cần mở giỏ hàng trắng, không dùng lại draft takeaway cũ.
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
  const hasLoadingState =
    menuQuery.isLoading || categoriesQuery.isLoading || addonsQuery.isLoading;
  const hasErrorState =
    menuQuery.isError || categoriesQuery.isError || addonsQuery.isError;
  const orderDetailQuery = useOrderDetail(effectiveOrderId, {
    enabled: isRouteContextReady && !isFreshTakeawayRoute,
  });

  /**
   * Đồng bộ đơn hàng từ backend về state local để tránh dùng dữ liệu cũ ở FE.
   */
  const applyOrderResponseToDraft = (order: OrderResponse) => {
    setTableContext(resolveTableContextFromOrder(order, nextTableContext));
    setDraftOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt ?? new Date().toISOString(),
    });
    setCart(toDraftItemsFromOrder(order, menuItemsById));
  };

  /**
   * Với đơn đã tạo, mọi chỉnh sửa món phải gọi API update thay vì chỉ sửa local state.
   */
  const syncPlacedOrder = async (
    nextCart: OrderDraftItem[],
    successMessage: string
  ): Promise<boolean> => {
    if (!draftOrder.orderId) {
      return false;
    }

    if (nextCart.length === 0) {
      toast.error('Đơn đã tạo phải còn ít nhất 1 món. Hãy dùng hủy đơn nếu cần.');
      return false;
    }

    setSyncingDraft(true);

    try {
      const response = await orderService.updateOrder(draftOrder.orderId, {
        tableId: tableContext?.tableId ?? undefined,
        items: nextCart.map(toUpdateOrderItemCommand),
      });

      if (!response.success) {
        return false;
      }

      applyOrderResponseToDraft(response.data);
      toast.success(successMessage);
      return true;
    } catch {
      // Toast lỗi chung đã được axios interceptor xử lý.
      return false;
    } finally {
      setSyncingDraft(false);
    }
  };

  useEffect(() => {
    if (!orderDetailQuery.data) {
      return;
    }

    applyOrderResponseToDraft(orderDetailQuery.data);
  }, [menuItemsById, nextTableContext, orderDetailQuery.data, setCart, setDraftOrder, setTableContext]);

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

  const handleDeleteCartItem = (item: OrderDraftItem) => {
    if (isPlacedOrderFinalized) {
      toast.error('Đơn đã kết thúc. Không thể xóa món trên đơn này.');
      return;
    }

    if (hasPlacedOrder) {
      const nextCart = cart.filter((cartItem) => cartItem.draftItemId !== item.draftItemId);
      void syncPlacedOrder(nextCart, `Đã xóa ${item.name} khỏi đơn hàng`);
      return;
    }

    removeFromCart(item.draftItemId);
    toast.success(`Đã xóa ${item.name} khỏi đơn nháp`);
  };

  const handleChangeItemQuantity = (item: OrderDraftItem, delta: number) => {
    if (isPlacedOrderFinalized) {
      toast.error('Đơn đã kết thúc. Không thể đổi số lượng món trên đơn này.');
      return;
    }

    const nextQuantity = item.quantity + delta;

    if (nextQuantity <= 0) {
      if (hasPlacedOrder && cart.length === 1) {
        toast.error('Đơn đã tạo phải còn ít nhất 1 món. Hãy dùng chức năng hủy đơn.');
        return;
      }

      handleDeleteCartItem(item);
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
      void syncPlacedOrder(nextCart, `Đã cập nhật số lượng ${item.name}`);
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
    const previousItem = matchedCartItem;
    const createdAtFallback = draftOrder.createdAt ?? new Date().toISOString();

    if (hasPlacedOrder) {
      const nextCart = previousItem
        ? cart.map((item) => (item.draftItemId === previousItem.draftItemId ? nextDraftItem : item))
        : [...cart, nextDraftItem];

      const isSynced = await syncPlacedOrder(
        nextCart,
        previousItem ? 'Đã cập nhật món trên hệ thống' : 'Đã thêm món vào đơn hàng'
      );

      if (!isSynced) {
        return;
      }

      setActiveMenuItemId(null);
      setActiveCartItemId(null);
      return;
    }

    setDraftOrder({
      createdAt: createdAtFallback,
    });
    upsertCartItem(nextDraftItem);
    setActiveMenuItemId(null);
    setActiveCartItemId(null);
    toast.success(
      previousItem ? 'Đã gộp số lượng món trong đơn nháp' : 'Đã thêm món vào đơn nháp'
    );
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

    if (hasPlacedOrder) {
      navigate(ROUTES.POS_PAYMENT);
      return;
    }

    setSyncingDraft(true);

    try {
      const createdAtFallback = draftOrder.createdAt ?? new Date().toISOString();
      const response = await orderService.placeOrder({
        tableId: tableContext?.tableId ?? undefined,
        source: resolveOrderSource(tableContext?.tableId),
        items: cart.map(toOrderItemCommand),
      });

      if (response.success) {
        applyOrderResponseToDraft(response.data);
        setDraftOrder({
          createdAt: createdAtFallback,
        });
        toast.success('Đã tạo đơn hàng trên hệ thống');
        navigate(ROUTES.POS_PAYMENT);
      }
    } catch {
      // Toast lỗi chung đã được axios interceptor xử lý.
    } finally {
      setSyncingDraft(false);
    }
  };

  const handleSaveDraft = () => {
    if (cart.length === 0) {
      toast.error('Chưa có món để lưu nháp');
      return;
    }

    if (hasPlacedOrder) {
      toast.success('Đơn đã được tạo trên hệ thống. Các thay đổi món sẽ đồng bộ qua API.');
      return;
    }

    setDraftOrder({
      createdAt: draftOrder.createdAt ?? new Date().toISOString(),
    });
    toast.success('Đã lưu đơn nháp cục bộ trên trình duyệt');
  };

  const handleCancelPlacedOrder = async () => {
    if (!draftOrder.orderId) {
      clearDraft();
      setTableContext(nextTableContext);
      setActiveMenuItemId(null);
      setActiveCartItemId(null);
      toast.success('Đã xóa đơn nháp cục bộ của bàn hiện tại');
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

    setSyncingDraft(true);

    try {
      const response = await orderService.cancelOrder(draftOrder.orderId, {
        reason: reason.trim() || undefined,
      });

      if (response.success) {
        clearDraft();
        setTableContext(nextTableContext);
        setActiveMenuItemId(null);
        setActiveCartItemId(null);
        toast.success('Đã hủy đơn và reset giỏ hàng của bàn hiện tại');
      }
    } finally {
      setSyncingDraft(false);
    }
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
            Kiểm tra lại API menu, category hoặc addon trước khi thao tác tạo đơn.
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
              <div className="flex flex-wrap gap-2">
                <Sheet open={isCartSheetOpen} onOpenChange={setIsCartSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="gap-2 xl:hidden">
                      <ShoppingCart className="h-4 w-4" />
                      Giỏ hàng
                      {totalItemCount > 0 ? ` (${totalItemCount})` : ''}
                    </Button>
                  </SheetTrigger>

                  <SheetContent
                    side="right"
                    className="w-[calc(100vw-1rem)] max-w-md overflow-y-auto border-l bg-white p-0"
                  >
                    <SheetHeader className="sr-only">
                      <SheetTitle>Giỏ hàng hiện tại</SheetTitle>
                    </SheetHeader>

                    <OrderCartPanel
                      cart={cart}
                      tableContext={tableContext}
                      draftOrder={draftOrder}
                      currentUserName={currentUserName}
                      hasPlacedOrder={hasPlacedOrder}
                      isSyncingDraft={isSyncingDraft}
                      isItemActionsDisabled={isSyncingDraft || isPlacedOrderFinalized}
                      totalItemCount={totalItemCount}
                      subtotal={subtotal}
                      vatAmount={vatAmount}
                      totalAmount={totalAmount}
                      checkoutButtonLabel={checkoutButtonLabel}
                      isCheckoutDisabled={isPlacedOrderFinalized}
                      onOpenInvoice={handleOpenInvoice}
                      onCancelPlacedOrder={() => void handleCancelPlacedOrder()}
                      onEditCartItem={handleEditCartItem}
                      onDeleteCartItem={handleDeleteCartItem}
                      onChangeItemQuantity={handleChangeItemQuantity}
                      onSaveDraft={handleSaveDraft}
                      onCheckout={() => void handleCheckout()}
                      className="h-full rounded-none border-0 shadow-none xl:max-h-none"
                    />
                  </SheetContent>
                </Sheet>

                <Button
                  variant="outline"
                  onClick={() => setShowCart((prev) => !prev)}
                  className="hidden gap-2 xl:inline-flex"
                >
                  {showCart ? (
                    <>
                      <PanelRightClose className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <PanelRightOpen className="h-4 w-4" />
                      {totalItemCount > 0 ? ` (${totalItemCount})` : ''}
                    </>
                  )}
                </Button>
              </div>
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

        {showCart ? (
          <div className="hidden xl:block xl:w-[400px] 2xl:w-[440px]" aria-hidden="true">
            <div className="xl:fixed xl:right-8 xl:top-20 2xl:right-10">
                <OrderCartPanel
                  cart={cart}
                  tableContext={tableContext}
                  draftOrder={draftOrder}
                  currentUserName={currentUserName}
                  hasPlacedOrder={hasPlacedOrder}
                  isSyncingDraft={isSyncingDraft}
                  isItemActionsDisabled={isSyncingDraft || isPlacedOrderFinalized}
                  totalItemCount={totalItemCount}
                  subtotal={subtotal}
                  vatAmount={vatAmount}
                totalAmount={totalAmount}
                checkoutButtonLabel={checkoutButtonLabel}
                isCheckoutDisabled={isPlacedOrderFinalized}
                onOpenInvoice={handleOpenInvoice}
                onCancelPlacedOrder={() => void handleCancelPlacedOrder()}
                onEditCartItem={handleEditCartItem}
                onDeleteCartItem={handleDeleteCartItem}
                onChangeItemQuantity={handleChangeItemQuantity}
                onSaveDraft={handleSaveDraft}
                onCheckout={() => void handleCheckout()}
                className="xl:flex xl:w-[400px] 2xl:w-[440px] xl:h-[calc(100dvh-6rem)] xl:max-h-[calc(100dvh-6rem)]"
              />
            </div>
          </div>
        ) : null}
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
            setActiveMenuItemId(null);
            setActiveCartItemId(null);
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
