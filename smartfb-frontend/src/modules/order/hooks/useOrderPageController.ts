import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useBranches } from '@modules/branch/hooks/useBranches';
import { useAddons } from '@modules/menu/hooks/useAddons';
import { useActiveMenus } from '@modules/menu/hooks/useActiveMenus';
import { useCategories } from '@modules/menu/hooks/useCategories';
import type {
  MenuAddonInfo,
  MenuCategoryInfo,
  MenuItem,
} from '@modules/menu/types/menu.types';
import {
  calculateLineTotal,
  getSafeAddons,
  isSameCartLine,
  mergeCartLineQuantity,
  ORDER_TAX_RATE,
  resolveOrderSource,
  toDialogMenuItem,
  toDraftItem,
  toOrderItemCommand,
} from '@modules/order/components/order-page/orderPage.utils';
import { orderService } from '@modules/order/services/orderService';
import { useOrderStore } from '@modules/order/stores/orderStore';
import type {
  DraftOrderMeta,
  OrderAddonSelection,
  OrderDraftItem,
  OrderTableContext,
} from '@modules/order/types/order.types';
import { buildOrderRouteSearchParams } from '@modules/order/utils';
import { useZones } from '@modules/table/hooks/useZones';
import { queryKeys } from '@shared/constants/queryKeys';
import { ROUTES } from '@shared/constants/routes';
import { useDebounce } from '@shared/hooks/useDebounce';
import { useOrderPricing } from './useOrderPricing';

interface OrderDialogSubmitPayload {
  quantity: number;
  notes: string;
  addons: OrderAddonSelection[];
}

interface UseOrderPageControllerResult {
  addons: MenuAddonInfo[];
  cart: OrderDraftItem[];
  categories: MenuCategoryInfo[];
  currentUserName: string;
  dialogMenuItem: MenuItem | null;
  displayBranchName: string;
  displayTableName: string;
  displayZoneName: string;
  draftOrder: DraftOrderMeta;
  editingCartItem: OrderDraftItem | null;
  filteredItems: MenuItem[];
  hasErrorState: boolean;
  hasLoadingState: boolean;
  hasPlacedOrder: boolean;
  isInvoiceOpen: boolean;
  isPlacedOrderFinalized: boolean;
  isSyncingDraft: boolean;
  searchKeyword: string;
  selectedCategory: string;
  selectedCategoryLabel: string;
  subtotal: number;
  tableContext: OrderTableContext | null;
  totalAmount: number;
  totalItemCount: number;
  vatAmount: number;
  checkoutButtonLabel: string;
  setIsInvoiceOpen: (open: boolean) => void;
  setSearchKeyword: (value: string) => void;
  setSelectedCategory: (categoryId: string) => void;
  clearActiveSelections: () => void;
  handleCancelPlacedOrder: () => Promise<void>;
  handleChangeItemQuantity: (item: OrderDraftItem, delta: number) => Promise<void>;
  handleCheckout: () => Promise<void>;
  handleDeleteCartItem: (item: OrderDraftItem) => Promise<void>;
  handleEditCartItem: (draftItemId: string) => void;
  handleOpenInvoice: () => void;
  handleOpenItemDialog: (menuItemId: string) => void;
  handleSubmitItem: (payload: OrderDialogSubmitPayload) => Promise<void>;
}

/**
 * Hook điều phối màn `OrderPage` theo flow cart local.
 * Món được giữ trong Zustand cart; order backend chỉ được tạo khi người dùng bấm đi thanh toán.
 */
export const useOrderPageController = (): UseOrderPageControllerResult => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const menuQuery = useActiveMenus(currentBranchId);
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

  useEffect(() => {
    if (!isFreshTakeawayRoute || nextTableContext.tableId) {
      return;
    }

    clearDraft();
    navigate(ROUTES.POS_ORDER, { replace: true });
  }, [clearDraft, isFreshTakeawayRoute, navigate, nextTableContext.tableId]);

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

  const selectedCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all') {
      return 'Tất cả danh mục';
    }

    return (
      categories.find((category) => category.id === selectedCategory)?.name ?? 'Danh mục đã chọn'
    );
  }, [categories, selectedCategory]);

  const displayTableName = tableContext?.tableName || nextTableContext.tableName || 'Mang đi';
  const displayBranchName =
    tableContext?.branchName || nextTableContext.branchName || 'Chi nhánh hiện tại';
  const displayZoneName = tableContext?.zoneName || nextTableContext.zoneName || '';

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

  const hasLoadingState =
    menuQuery.isLoading || categoriesQuery.isLoading || addonsQuery.isLoading;
  const hasErrorState = menuQuery.isError || categoriesQuery.isError || addonsQuery.isError;
  const hasPlacedOrder = Boolean(draftOrder.orderId);
  const isPlacedOrderFinalized = false;

  const clearActiveSelections = () => {
    setActiveMenuItemId(null);
    setActiveCartItemId(null);
  };

  const ensureLocalDraftStarted = () => {
    if (draftOrder.createdAt) {
      return;
    }

    setDraftOrder({
      orderId: null,
      orderNumber: null,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });
  };

  const handleOpenItemDialog = (menuItemId: string) => {
    setActiveCartItemId(null);
    setActiveMenuItemId(menuItemId);
  };

  const handleEditCartItem = (draftItemId: string) => {
    setActiveMenuItemId(null);
    setActiveCartItemId(draftItemId);
  };

  const handleDeleteCartItem = async (item: OrderDraftItem) => {
    const nextCart = cart.filter((cartItem) => cartItem.draftItemId !== item.draftItemId);

    if (nextCart.length === 0) {
      clearDraft();
      toast.success(`Đã xóa ${item.name} và làm trống giỏ hàng`);
      return;
    }

    removeFromCart(item.draftItemId);
    toast.success(`Đã xóa ${item.name} khỏi giỏ hàng`);
  };

  const handleChangeItemQuantity = async (item: OrderDraftItem, delta: number) => {
    const nextQuantity = item.quantity + delta;

    if (nextQuantity <= 0) {
      await handleDeleteCartItem(item);
      return;
    }

    upsertCartItem({
      ...item,
      quantity: nextQuantity,
      lineTotal: calculateLineTotal(item.unitPrice, nextQuantity, getSafeAddons(item)),
    });
    ensureLocalDraftStarted();
  };

  const handleSubmitItem = async (payload: OrderDialogSubmitPayload) => {
    const targetMenuItem =
      selectedMenuItem ?? (editingCartItem ? toDialogMenuItem(editingCartItem) : null);

    if (!targetMenuItem) {
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

    // Khi không ở chế độ edit, cùng món + cùng topping + cùng ghi chú sẽ được gộp số lượng trong cart local.
    const matchedCartItem =
      editingCartItem ??
      cart.find((cartItem) => isSameCartLine(cartItem, submittedDraftItem)) ??
      null;
    const nextDraftItem =
      matchedCartItem && !editingCartItem
        ? mergeCartLineQuantity(matchedCartItem, submittedDraftItem)
        : submittedDraftItem;

    upsertCartItem(nextDraftItem);
    ensureLocalDraftStarted();
    clearActiveSelections();
    toast.success(matchedCartItem ? 'Đã cập nhật món trong giỏ hàng' : 'Đã thêm món vào giỏ hàng');
  };

  const handleOpenInvoice = () => {
    if (cart.length === 0) {
      toast.error('Chưa có món trong giỏ để in hóa đơn tạm');
      return;
    }

    setIsInvoiceOpen(true);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Chưa có món trong giỏ hàng');
      return;
    }

    const activeContext = tableContext ?? nextTableContext;

    if (draftOrder.orderId) {
      const paymentSearchParams = buildOrderRouteSearchParams(activeContext, draftOrder.orderId);
      navigate(`${ROUTES.POS_PAYMENT}?${paymentSearchParams.toString()}`);
      return;
    }

    setSyncingDraft(true);

    try {
      const tableId = activeContext.tableId?.trim() || undefined;
      const response = await orderService.placeOrder({
        tableId,
        source: resolveOrderSource(tableId),
        items: cart.map(toOrderItemCommand),
      });

      if (!response.success) {
        toast.error(response.error?.message ?? 'Không thể tạo đơn hàng để thanh toán');
        return;
      }

      setDraftOrder({
        orderId: response.data.id,
        orderNumber: response.data.orderNumber,
        status: response.data.status,
        createdAt: response.data.createdAt ?? draftOrder.createdAt ?? new Date().toISOString(),
      });
      queryClient.setQueryData(queryKeys.orders.detail(response.data.id), response.data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.active, exact: true });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tables.lists });

      if (response.data.tableId?.trim()) {
        queryClient.setQueryData(
          queryKeys.orders.activeByTable(response.data.tableId),
          {
            id: response.data.id,
            orderNumber: response.data.orderNumber,
            tableId: response.data.tableId,
            tableName: response.data.tableName,
            status: response.data.status,
            totalAmount: response.data.totalAmount,
            createdAt: response.data.createdAt,
          }
        );
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tables.detail(response.data.tableId),
        });
      }

      const paymentSearchParams = buildOrderRouteSearchParams(activeContext, response.data.id);
      navigate(`${ROUTES.POS_PAYMENT}?${paymentSearchParams.toString()}`);
    } catch {
      // Axios interceptor đã hiển thị lỗi chung, toast này giữ ngữ cảnh nghiệp vụ cho POS.
      toast.error('Không thể tạo đơn hàng để chuyển sang thanh toán');
    } finally {
      setSyncingDraft(false);
    }
  };

  const handleCancelPlacedOrder = async () => {
    if (!draftOrder.orderId) {
      clearDraft();
      clearActiveSelections();
      toast.success('Đã làm trống giỏ hàng hiện tại');
      return;
    }

    setSyncingDraft(true);

    try {
      const response = await orderService.cancelOrder(draftOrder.orderId, {
        reason: 'CANCEL_CREATED_ORDER_BEFORE_PAYMENT',
      });

      if (!response.success) {
        toast.error(response.error?.message ?? 'Không thể hủy đơn đã tạo');
        return;
      }

      const cancelledTableId = response.data.tableId ?? tableContext?.tableId ?? nextTableContext.tableId;
      clearDraft();
      clearActiveSelections();
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.active, exact: true });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tables.lists });

      if (cancelledTableId?.trim()) {
        queryClient.setQueryData(queryKeys.orders.activeByTable(cancelledTableId), null);
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tables.detail(cancelledTableId),
        });
      }

      toast.success('Đã hủy đơn và làm trống giỏ hàng');
    } catch {
      toast.error('Không thể hủy đơn đã tạo');
    } finally {
      setSyncingDraft(false);
    }
  };

  const checkoutButtonLabel = isSyncingDraft
    ? 'Đang tạo đơn...'
    : hasPlacedOrder
      ? 'Tiếp tục thanh toán'
      : 'thanh toán';

  return {
    addons,
    cart,
    categories,
    checkoutButtonLabel,
    clearActiveSelections,
    currentUserName,
    dialogMenuItem,
    displayBranchName,
    displayTableName,
    displayZoneName,
    draftOrder,
    editingCartItem,
    filteredItems,
    handleCancelPlacedOrder,
    handleChangeItemQuantity,
    handleCheckout,
    handleDeleteCartItem,
    handleEditCartItem,
    handleOpenInvoice,
    handleOpenItemDialog,
    handleSubmitItem,
    hasErrorState,
    hasLoadingState,
    hasPlacedOrder,
    isInvoiceOpen,
    isPlacedOrderFinalized,
    isSyncingDraft,
    searchKeyword,
    selectedCategory,
    selectedCategoryLabel,
    setIsInvoiceOpen,
    setSearchKeyword,
    setSelectedCategory,
    subtotal,
    tableContext,
    totalAmount,
    totalItemCount,
    vatAmount,
  };
};
