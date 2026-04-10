import { useEffect, useMemo, useState } from 'react';
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
  ORDER_TAX_RATE,
  resolveOrderSource,
  toDialogMenuItem,
  toDraftItem,
  toOrderItemCommand,
} from '@modules/order/components/order-page/orderPage.utils';
import { OrderItemDialog } from '@modules/order/components/OrderItemDialog';
import { TemporaryInvoiceDialog } from '@modules/order/components/TemporaryInvoiceDialog';
import { useOrderPricing } from '@modules/order/hooks/useOrderPricing';
import { orderService } from '@modules/order/services/orderService';
import { useOrderStore } from '@modules/order/stores/orderStore';
import type { OrderAddonSelection, OrderDraftItem } from '@modules/order/types/order.types';
import { useZones } from '@modules/table/hooks/useZones';
import { ROUTES } from '@shared/constants/routes';
import { useDebounce } from '@shared/hooks/useDebounce';

export default function OrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeMenuItemId, setActiveMenuItemId] = useState<string | null>(null);
  const [activeCartItemId, setActiveCartItemId] = useState<string | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

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
  const routeTableId = searchParams.get('tableId')?.trim() ?? '';
  const routeTableName = searchParams.get('tableName')?.trim() ?? '';
  const routeZoneId = searchParams.get('zoneId')?.trim() ?? '';

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

  const menuItems = useMemo(() => {
    return (menuQuery.data?.data ?? [])
      .filter((item) => item.isActive !== false && item.isAvailable !== false)
      .map((item) => ({
        ...item,
        price: item.effectivePrice ?? item.branchPrice ?? item.price,
      }));
  }, [menuQuery.data?.data]);

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
  const hasLoadingState =
    menuQuery.isLoading || categoriesQuery.isLoading || addonsQuery.isLoading;
  const hasErrorState =
    menuQuery.isError || categoriesQuery.isError || addonsQuery.isError;

  const handleOpenItemDialog = (menuItemId: string) => {
    if (hasPlacedOrder) {
      toast.error('Đơn đã được tạo trên hệ thống. Hiện chưa hỗ trợ sửa món sau khi tạo đơn.');
      return;
    }

    setActiveCartItemId(null);
    setActiveMenuItemId(menuItemId);
  };

  const handleEditCartItem = (draftItemId: string) => {
    if (hasPlacedOrder) {
      toast.error('Đơn đã được tạo trên hệ thống. Hiện chưa hỗ trợ sửa món sau khi tạo đơn.');
      return;
    }

    setActiveMenuItemId(null);
    setActiveCartItemId(draftItemId);
  };

  const handleDeleteCartItem = (item: OrderDraftItem) => {
    if (hasPlacedOrder) {
      toast.error('Đơn đã được tạo trên hệ thống. Hiện chưa hỗ trợ xóa món sau khi tạo đơn.');
      return;
    }

    removeFromCart(item.draftItemId);
    toast.success(`Đã xóa ${item.name} khỏi đơn nháp`);
  };

  const handleChangeItemQuantity = (item: OrderDraftItem, delta: number) => {
    if (hasPlacedOrder) {
      toast.error('Đơn đã được tạo trên hệ thống. Hiện chưa hỗ trợ đổi số lượng sau khi tạo đơn.');
      return;
    }

    const nextQuantity = item.quantity + delta;

    if (nextQuantity <= 0) {
      handleDeleteCartItem(item);
      return;
    }

    upsertCartItem({
      ...item,
      quantity: nextQuantity,
      lineTotal: calculateLineTotal(item.unitPrice, nextQuantity, getSafeAddons(item)),
    });
  };

  const handleSubmitItem = (payload: {
    quantity: number;
    notes: string;
    addons: OrderAddonSelection[];
  }) => {
    const targetMenuItem =
      selectedMenuItem ?? (editingCartItem ? toDialogMenuItem(editingCartItem) : null);

    if (!targetMenuItem) {
      return;
    }

    if (hasPlacedOrder) {
      toast.error('Đơn đã được tạo trên hệ thống. Hiện chưa hỗ trợ chỉnh món ở frontend.');
      return;
    }

    const nextDraftItem = toDraftItem(
      targetMenuItem,
      payload.quantity,
      payload.addons,
      payload.notes,
      editingCartItem?.draftItemId,
      editingCartItem?.orderItemId
    );

    const previousItem = editingCartItem;
    const createdAtFallback = draftOrder.createdAt ?? new Date().toISOString();

    setDraftOrder({
      createdAt: createdAtFallback,
    });
    upsertCartItem(nextDraftItem);
    setActiveMenuItemId(null);
    setActiveCartItemId(null);
    toast.success(previousItem ? 'Đã cập nhật món trong đơn nháp' : 'Đã thêm món vào đơn nháp');
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
        setDraftOrder({
          orderId: response.data.id,
          orderNumber: response.data.orderNumber,
          status: response.data.status,
          createdAt: createdAtFallback,
        });
        toast.success('Đã tạo đơn hàng trên hệ thống');
        navigate(ROUTES.POS_PAYMENT);
      }
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
      toast.success('Đơn đã được tạo trên hệ thống. Bạn có thể tiếp tục thanh toán.');
      return;
    }

    setDraftOrder({
      createdAt: draftOrder.createdAt ?? new Date().toISOString(),
    });
    toast.success('Đã lưu đơn nháp cục bộ trên trình duyệt');
  };

  const handleCancelPlacedOrder = async () => {
    if (!draftOrder.orderId) {
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
    ? 'Đang tạo đơn...'
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
      <div className="grid min-h-[calc(100vh-10rem)] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(400px,440px)]">
        <section className="min-h-0 space-y-5">
          <OrderPageToolbar
            searchKeyword={searchKeyword}
            tableName={tableContext?.tableName || 'Mang đi'}
            onSearchKeywordChange={setSearchKeyword}
          />

          <OrderCategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          <OrderMenuGrid items={filteredItems as MenuItem[]} onSelectItem={handleOpenItemDialog} />
        </section>

        <OrderCartPanel
          cart={cart}
          tableContext={tableContext}
          draftOrder={draftOrder}
          currentUserName={currentUserName}
          hasPlacedOrder={hasPlacedOrder}
          isSyncingDraft={isSyncingDraft}
          totalItemCount={totalItemCount}
          subtotal={subtotal}
          vatAmount={vatAmount}
          totalAmount={totalAmount}
          checkoutButtonLabel={checkoutButtonLabel}
          onOpenInvoice={handleOpenInvoice}
          onCancelPlacedOrder={() => void handleCancelPlacedOrder()}
          onEditCartItem={handleEditCartItem}
          onDeleteCartItem={handleDeleteCartItem}
          onChangeItemQuantity={handleChangeItemQuantity}
          onSaveDraft={handleSaveDraft}
          onCheckout={() => void handleCheckout()}
        />
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
