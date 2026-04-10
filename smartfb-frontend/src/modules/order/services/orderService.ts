import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  CancelOrderRequest,
  OrderApiResponse,
  OrderListApiResponse,
  OrderResponse,
  PlaceOrderRequest,
  UpdateOrderStatusRequest,
} from '../types/order.types';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

/**
 * Service thao tác với API đơn hàng.
 * Giữ service thuần gọi API, không đặt logic nghiệp vụ tại đây.
 */
export const orderService = {
  /**
   * Tạo mới đơn hàng POS.
   */
  placeOrder: async (payload: PlaceOrderRequest): Promise<OrderApiResponse> => {
    const response = await api.post<OrderApiResponse>('/orders', payload);
    return response.data;
  },

  /**
   * Lấy chi tiết một đơn hàng.
   */
  getById: async (id: string): Promise<OrderApiResponse> => {
    const response = await api.get<OrderApiResponse>(`/orders/${id}`);
    return response.data;
  },

  /**
   * Cập nhật trạng thái đơn hàng.
   */
  updateStatus: async (id: string, payload: UpdateOrderStatusRequest): Promise<OrderApiResponse> => {
    const response = await api.put<OrderApiResponse>(`/orders/${id}/status`, payload);
    return response.data;
  },

  /**
   * Hủy đơn hàng theo endpoint riêng của backend.
   */
  cancelOrder: async (id: string, payload: CancelOrderRequest): Promise<OrderApiResponse> => {
    const response = await api.post<OrderApiResponse>(`/orders/${id}/cancel`, payload);
    return response.data;
  },

  /**
   * Lấy danh sách đơn hàng cho trang quản lý.
   * Hiện backend trả dữ liệu phân trang kiểu Spring `content`.
   */
  getOrders: async (): Promise<OrderListApiResponse> => {
    const response = await api.get<ApiResponse<PageResponse<OrderResponse>>>('/orders', {
      params: {
        page: 0,
        size: 20,
      },
    });

    return {
      ...response.data,
      data: response.data.data.content,
    };
  },
};
