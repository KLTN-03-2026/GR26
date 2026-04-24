import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  OrderResponse, 
  PlaceOrderRequest, 
  OrderStatus, 
  OrderItemCommand 
} from '../types/order.types';
import { orderService } from '../services/orderService';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface OrderState {
  cart: CartItem[];
  orders: OrderResponse[];
  isLoading: boolean;
  
  addToCart: (item: any) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  
  fetchOrders: () => Promise<void>;
  placeOrder: (tableId?: string, notes?: string) => Promise<string | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      cart: [],
      orders: [],
      isLoading: false,

      addToCart: (item) => {
        set((state) => {
          const existing = state.cart.find((i) => i.id === item.id);
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return {
            cart: [...state.cart, { id: item.id, name: item.name, price: item.price, quantity: 1 }],
          };
        });
        toast.success(`Đã thêm ${item.name}`);
      },

      removeFromCart: (id) => {
        set((state) => ({
          cart: state.cart.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: (id, delta) => {
        set((state) => ({
          cart: state.cart.map((i) => {
            if (i.id === id) {
              return { ...i, quantity: Math.max(1, i.quantity + delta) };
            }
            return i;
          }),
        }));
      },

      clearCart: () => set({ cart: [] }),

      fetchOrders: async () => {
        set({ isLoading: true });
        try {
          const response = await orderService.getOrders();
          if (response.success) {
            set({ orders: response.data });
          }
        } catch (error) {
          console.error('Failed to fetch orders:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      placeOrder: async (tableId, notes) => {
        const { cart, clearCart } = get();
        if (cart.length === 0) return false;

        const items: OrderItemCommand[] = cart.map((item) => ({
          itemId: item.id,
          itemName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          notes: item.notes,
        }));

        const payload: PlaceOrderRequest = {
          tableId,
          notes,
          source: 'POS',
          items,
        };

        set({ isLoading: true });
        try {
          const response = await orderService.placeOrder(payload);
          if (response.success && response.data) {
            toast.success('Đặt món thành công!');
            const orderId = response.data.id;
            clearCart();
            return orderId;
          }
          return null;
        } catch (error) {
          console.error('Order failed:', error);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      updateOrderStatus: async (orderId, status) => {
        try {
          const response = await orderService.updateStatus(orderId, { newStatus: status });
          if (response.success) {
            toast.success(`Đã cập nhật trạng thái đơn hàng sang ${status}`);
            set((state) => ({
              orders: state.orders.map((o) => 
                o.id === orderId ? { ...o, status } : o
              ),
            }));
          }
        } catch (error) {
          console.error('Update status failed:', error);
        }
      },
    }),
    {
      name: 'smartfb-order-storage',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
