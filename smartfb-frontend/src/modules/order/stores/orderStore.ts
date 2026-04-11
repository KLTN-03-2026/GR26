import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { orderService } from '../services/orderService';
import type {
  DraftOrderMeta,
  OrderAddonSelection,
  OrderDraftItem,
  OrderListItemResponse,
  OrderStatus,
  OrderTableContext,
} from '../types/order.types';

interface OrderState {
  cart: OrderDraftItem[];
  orders: OrderListItemResponse[];
  tableContext: OrderTableContext | null;
  draftOrder: DraftOrderMeta;
  draftsByContext: Record<string, PersistedOrderDraft>;
  isLoading: boolean;
  isSyncingDraft: boolean;
  setTableContext: (context: OrderTableContext | null) => void;
  setDraftOrder: (payload: Partial<DraftOrderMeta>) => void;
  setCart: (items: OrderDraftItem[]) => void;
  upsertCartItem: (item: OrderDraftItem) => void;
  removeFromCart: (draftItemId: string) => void;
  setSyncingDraft: (value: boolean) => void;
  clearDraft: () => void;
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, reason?: string) => Promise<void>;
}

const INITIAL_DRAFT_ORDER: DraftOrderMeta = {
  orderId: null,
  orderNumber: null,
  status: 'PENDING',
  createdAt: null,
};

interface PersistedCartItem extends Partial<OrderDraftItem> {
  id?: string;
  price?: number;
}

interface PersistedOrderDraft {
  cart: OrderDraftItem[];
  draftOrder: DraftOrderMeta;
  tableContext: OrderTableContext | null;
}

const createDraftItemId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeCartItem = (item: PersistedCartItem): OrderDraftItem => {
  const resolvedMenuItemId = item.menuItemId ?? item.id ?? '';
  const resolvedDraftItemId = item.draftItemId ?? createDraftItemId();
  const resolvedUnitPrice = item.unitPrice ?? item.price ?? 0;
  const resolvedQuantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
  const resolvedAddons = Array.isArray(item.addons) ? item.addons : [];
  const addonTotal = resolvedAddons.reduce((sum: number, addon: OrderAddonSelection) => {
    return sum + addon.extraPrice * addon.quantity;
  }, 0);

  return {
    draftItemId: resolvedDraftItemId,
    menuItemId: resolvedMenuItemId,
    orderItemId: item.orderItemId,
    name: item.name ?? '',
    description: item.description,
    image: item.image ?? '',
    categoryId: item.categoryId,
    quantity: resolvedQuantity,
    unitPrice: resolvedUnitPrice,
    addons: resolvedAddons,
    notes: item.notes ?? '',
    lineTotal:
      typeof item.lineTotal === 'number'
        ? item.lineTotal
        : (resolvedUnitPrice + addonTotal) * resolvedQuantity,
  };
};

const normalizeCart = (cart: PersistedCartItem[] | undefined): OrderDraftItem[] => {
  if (!Array.isArray(cart)) {
    return [];
  }

  return cart
    .map(normalizeCartItem)
    .filter((item) => item.menuItemId.trim().length > 0);
};

const normalizeDraftOrder = (
  draftOrder: Partial<DraftOrderMeta> | undefined
): DraftOrderMeta => {
  return {
    ...INITIAL_DRAFT_ORDER,
    ...draftOrder,
    status: draftOrder?.status ?? INITIAL_DRAFT_ORDER.status,
  };
};

const getOrderContextKey = (context: OrderTableContext | null | undefined): string => {
  const tableId = context?.tableId?.trim();

  if (tableId) {
    return `table:${tableId}`;
  }

  const branchKey = context?.branchId?.trim() || context?.branchName.trim() || 'current-branch';

  return `takeaway:${branchKey}`;
};

const hasMeaningfulDraft = (cart: OrderDraftItem[], draftOrder: DraftOrderMeta): boolean => {
  return cart.length > 0 || Boolean(draftOrder.orderId) || Boolean(draftOrder.createdAt);
};

const syncDraftsByContext = (
  draftsByContext: Record<string, PersistedOrderDraft>,
  tableContext: OrderTableContext | null,
  cart: OrderDraftItem[],
  draftOrder: DraftOrderMeta
): Record<string, PersistedOrderDraft> => {
  const nextDraftsByContext = { ...draftsByContext };
  const contextKey = getOrderContextKey(tableContext);

  // Luôn đồng bộ draft active vào map để mỗi bàn giữ được giỏ hàng riêng.
  if (hasMeaningfulDraft(cart, draftOrder)) {
    nextDraftsByContext[contextKey] = {
      cart,
      draftOrder,
      tableContext,
    };

    return nextDraftsByContext;
  }

  delete nextDraftsByContext[contextKey];

  return nextDraftsByContext;
};

const normalizeDraftsByContext = (
  draftsByContext: Record<string, PersistedOrderDraft> | undefined
): Record<string, PersistedOrderDraft> => {
  if (!draftsByContext) {
    return {};
  }

  return Object.entries(draftsByContext).reduce<Record<string, PersistedOrderDraft>>(
    (accumulator, [contextKey, draft]) => {
      const normalizedCart = normalizeCart(draft?.cart);
      const normalizedDraftOrder = normalizeDraftOrder(draft?.draftOrder);

      if (!hasMeaningfulDraft(normalizedCart, normalizedDraftOrder)) {
        return accumulator;
      }

      accumulator[contextKey] = {
        cart: normalizedCart,
        draftOrder: normalizedDraftOrder,
        tableContext: draft?.tableContext ?? null,
      };

      return accumulator;
    },
    {}
  );
};

const isSameTableContext = (
  currentContext: OrderTableContext | null,
  nextContext: OrderTableContext | null
): boolean => {
  return (
    currentContext?.tableId === nextContext?.tableId &&
    currentContext?.tableName === nextContext?.tableName &&
    currentContext?.zoneId === nextContext?.zoneId &&
    currentContext?.zoneName === nextContext?.zoneName &&
    currentContext?.branchId === nextContext?.branchId &&
    currentContext?.branchName === nextContext?.branchName
  );
};

/**
 * Store giữ state đơn nháp để chia sẻ giữa màn order và thanh toán.
 */
export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      cart: [],
      orders: [],
      tableContext: null,
      draftOrder: INITIAL_DRAFT_ORDER,
      draftsByContext: {},
      isLoading: false,
      isSyncingDraft: false,

      setTableContext: (context) =>
        set((state) => {
          if (isSameTableContext(state.tableContext, context)) {
            return state;
          }

          const persistedDrafts = syncDraftsByContext(
            state.draftsByContext,
            state.tableContext,
            state.cart,
            state.draftOrder
          );
          const nextContextKey = getOrderContextKey(context);
          const nextDraft = persistedDrafts[nextContextKey];

          return {
            draftsByContext: persistedDrafts,
            tableContext: context,
            cart: nextDraft?.cart ?? [],
            draftOrder: nextDraft?.draftOrder ?? INITIAL_DRAFT_ORDER,
          };
        }),

      setDraftOrder: (payload) =>
        set((state) => {
          const nextDraftOrder = normalizeDraftOrder({
            ...state.draftOrder,
            ...payload,
          });

          return {
            draftOrder: nextDraftOrder,
            draftsByContext: syncDraftsByContext(
              state.draftsByContext,
              state.tableContext,
              state.cart,
              nextDraftOrder
            ),
          };
        }),

      setCart: (items) =>
        set((state) => {
          const nextCart = normalizeCart(items);

          return {
            cart: nextCart,
            draftsByContext: syncDraftsByContext(
              state.draftsByContext,
              state.tableContext,
              nextCart,
              state.draftOrder
            ),
          };
        }),

      upsertCartItem: (item) =>
        set((state) => {
          const existingIndex = state.cart.findIndex(
            (cartItem) => cartItem.draftItemId === item.draftItemId
          );
          const normalizedItem = normalizeCartItem(item);

          const nextCart =
            existingIndex === -1
              ? [...state.cart, normalizedItem]
              : state.cart.map((cartItem, index) =>
                  index === existingIndex ? normalizedItem : cartItem
                );

          return {
            cart: nextCart,
            draftsByContext: syncDraftsByContext(
              state.draftsByContext,
              state.tableContext,
              nextCart,
              state.draftOrder
            ),
          };
        }),

      removeFromCart: (draftItemId) =>
        set((state) => {
          const nextCart = state.cart.filter((item) => item.draftItemId !== draftItemId);

          return {
            cart: nextCart,
            draftsByContext: syncDraftsByContext(
              state.draftsByContext,
              state.tableContext,
              nextCart,
              state.draftOrder
            ),
          };
        }),

      setSyncingDraft: (value) => set({ isSyncingDraft: value }),

      clearDraft: () =>
        set((state) => ({
          cart: [],
          draftOrder: INITIAL_DRAFT_ORDER,
          draftsByContext: syncDraftsByContext(
            state.draftsByContext,
            state.tableContext,
            [],
            INITIAL_DRAFT_ORDER
          ),
          isSyncingDraft: false,
        })),

      fetchOrders: async () => {
        set({ isLoading: true });

        try {
          const response = await orderService.getOrders();
          if (response.success) {
            set({ orders: response.data });
          }
        } catch (error) {
          console.error('Không thể tải danh sách đơn hàng:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      updateOrderStatus: async (orderId, status, reason) => {
        try {
          const response =
            status === 'CANCELLED'
              ? await orderService.cancelOrder(orderId, { reason })
              : await orderService.updateStatus(orderId, { newStatus: status, reason });

          if (response.success) {
            toast.success(`Đã cập nhật trạng thái đơn hàng sang ${status}`);

            set((state) => ({
              orders: state.orders.map((order) =>
                order.id === orderId
                  ? {
                      ...order,
                      status,
                    }
                  : order
              ),
            }));
          }
        } catch (error) {
          console.error('Không thể cập nhật trạng thái đơn hàng:', error);
        }
      },
    }),
    {
      name: 'smartfb-order-storage',
      merge: (persistedState, currentState) => {
        const typedState = persistedState as Partial<OrderState> | undefined;
        const normalizedDraftsByContext = normalizeDraftsByContext(typedState?.draftsByContext);
        const persistedTableContext = typedState?.tableContext ?? currentState.tableContext;
        const persistedCart = normalizeCart(typedState?.cart);
        const persistedDraftOrder = normalizeDraftOrder(typedState?.draftOrder);
        const legacyContextKey = getOrderContextKey(persistedTableContext);
        const hasLegacyDraft = hasMeaningfulDraft(persistedCart, persistedDraftOrder);

        if (
          hasLegacyDraft &&
          !normalizedDraftsByContext[legacyContextKey]
        ) {
          normalizedDraftsByContext[legacyContextKey] = {
            cart: persistedCart,
            draftOrder: persistedDraftOrder,
            tableContext: persistedTableContext,
          };
        }

        const activeDraft = normalizedDraftsByContext[legacyContextKey];

        return {
          ...currentState,
          ...typedState,
          cart: activeDraft?.cart ?? persistedCart,
          tableContext: persistedTableContext,
          draftOrder: activeDraft?.draftOrder ?? persistedDraftOrder,
          draftsByContext: normalizedDraftsByContext,
        };
      },
      partialize: (state) => ({
        cart: state.cart,
        tableContext: state.tableContext,
        draftOrder: state.draftOrder,
        draftsByContext: state.draftsByContext,
      }),
    }
  )
);
