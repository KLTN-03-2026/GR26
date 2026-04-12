import { create } from 'zustand';
import toast from 'react-hot-toast';
import { orderService } from '../services/orderService';
import type {
  DraftOrderMeta,
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
  isLoading: boolean;
  isSyncingDraft: boolean;
  setTableContext: (context: OrderTableContext | null) => void;
  setDraftOrder: (payload: Partial<DraftOrderMeta>) => void;
  setCart: (items: OrderDraftItem[]) => void;
  upsertCartItem: (item: OrderDraftItem) => void;
  removeFromCart: (draftItemId: string) => void;
  setSyncingDraft: (value: boolean) => void;
  clearDraft: () => void;
  clearDraftAndContext: () => void;
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, reason?: string) => Promise<void>;
}

const INITIAL_DRAFT_ORDER: DraftOrderMeta = {
  orderId: null,
  orderNumber: null,
  status: 'PENDING',
  createdAt: null,
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

const normalizeCartItem = (item: OrderDraftItem): OrderDraftItem => {
  return {
    ...item,
    addons: Array.isArray(item.addons) ? item.addons : [],
    notes: item.notes ?? '',
    quantity: item.quantity > 0 ? item.quantity : 1,
  };
};

const normalizeCart = (cart: OrderDraftItem[]): OrderDraftItem[] => {
  return cart
    .map(normalizeCartItem)
    .filter((item) => item.menuItemId.trim().length > 0);
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
 * Store giữ state runtime của order/cart giữa màn tạo đơn và thanh toán.
 * Không persist xuống localStorage vì source of truth của đơn hàng đã chuyển sang API.
 */
export const useOrderStore = create<OrderState>()((set) => ({
  cart: [],
  orders: [],
  tableContext: null,
  draftOrder: INITIAL_DRAFT_ORDER,
  isLoading: false,
  isSyncingDraft: false,

  setTableContext: (context) =>
    set((state) => {
      if (isSameTableContext(state.tableContext, context)) {
        return state;
      }

      return {
        tableContext: context,
        cart: [],
        draftOrder: INITIAL_DRAFT_ORDER,
        isSyncingDraft: false,
      };
    }),

  setDraftOrder: (payload) =>
    set((state) => ({
      draftOrder: normalizeDraftOrder({
        ...state.draftOrder,
        ...payload,
      }),
    })),

  setCart: (items) =>
    set({
      cart: normalizeCart(items),
    }),

  upsertCartItem: (item) =>
    set((state) => {
      const normalizedItem = normalizeCartItem(item);
      const existingIndex = state.cart.findIndex(
        (cartItem) => cartItem.draftItemId === normalizedItem.draftItemId
      );

      const nextCart =
        existingIndex === -1
          ? [...state.cart, normalizedItem]
          : state.cart.map((cartItem, index) =>
              index === existingIndex ? normalizedItem : cartItem
            );

      return {
        cart: nextCart,
      };
    }),

  removeFromCart: (draftItemId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.draftItemId !== draftItemId),
    })),

  setSyncingDraft: (value) => set({ isSyncingDraft: value }),

  clearDraft: () =>
    set({
      cart: [],
      draftOrder: INITIAL_DRAFT_ORDER,
      isSyncingDraft: false,
    }),

  clearDraftAndContext: () =>
    set({
      cart: [],
      tableContext: null,
      draftOrder: INITIAL_DRAFT_ORDER,
      isSyncingDraft: false,
    }),

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
}));
