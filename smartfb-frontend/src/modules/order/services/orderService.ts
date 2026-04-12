import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  CancelOrderRequest,
  OrderApiResponse,
  OrderListApiResponse,
  OrderListItemResponse,
  OrderListQueryParams,
  PlaceOrderRequest,
  UpdateOrderRequest,
  UpdateOrderStatusRequest,
} from '../types/order.types';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

interface OrderRequestOptions {
  signal?: AbortSignal;
}

const ORDER_PAGE_SIZE = 100;

const buildOrderListParams = (
  params?: OrderListQueryParams
): Record<string, number | string | undefined> => {
  return {
    status: params?.status,
    from: params?.from,
    to: params?.to,
    tableId: params?.tableId,
    page: params?.page ?? 0,
    size: params?.size ?? ORDER_PAGE_SIZE,
  };
};

const fetchOrderPage = async (
  params?: OrderListQueryParams,
  options?: OrderRequestOptions
): Promise<PageResponse<OrderListItemResponse>> => {
  const response = await api.get<ApiResponse<PageResponse<OrderListItemResponse>>>('/orders', {
    params: buildOrderListParams(params),
    signal: options?.signal,
  });

  return response.data.data;
};

/**
 * Lấy toàn bộ danh sách đơn hàng qua tất cả trang backend.
 *
 * Backend hiện trả dữ liệu phân trang kiểu Spring nên FE cần lặp qua `totalPages`
 * để trang quản lý đơn hàng luôn nhìn thấy đầy đủ dữ liệu thay vì chỉ 20 đơn đầu.
 */
const fetchAllOrderPages = async (
  params?: OrderListQueryParams,
  options?: OrderRequestOptions
): Promise<OrderListItemResponse[]> => {
  const firstPage = await fetchOrderPage(params, options);
  const pages = Array.from(
    { length: Math.max(firstPage.totalPages - 1, 0) },
    (_, index) => index + 1
  );

  if (pages.length === 0) {
    return firstPage.content;
  }

  const remainingPages = await Promise.all(
    pages.map(async (page) => {
      const nextPage = await fetchOrderPage({
        ...params,
        page,
        size: params?.size ?? ORDER_PAGE_SIZE,
      }, options);

      return nextPage.content;
    })
  );

  return [firstPage.content, ...remainingPages].flat();
};

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
   * Cập nhật toàn bộ đơn hàng đã tồn tại.
   */
  updateOrder: async (id: string, payload: UpdateOrderRequest): Promise<OrderApiResponse> => {
    const response = await api.put<OrderApiResponse>(`/orders/${id}`, payload);
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
   * FE chủ động gom tất cả trang để danh sách không bị cắt ở 20 bản ghi đầu.
   */
  getOrders: async (
    params?: OrderListQueryParams,
    options?: OrderRequestOptions
  ): Promise<OrderListApiResponse> => {
    const orders = await fetchAllOrderPages(params, options);

    return {
      success: true,
      data: orders,
    };
  },
};
