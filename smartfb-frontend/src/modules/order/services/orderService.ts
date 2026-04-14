import axiosInstance from '@lib/axios';
import type { 
  OrderApiResponse, 
  OrderListApiResponse, 
  PlaceOrderRequest, 
  UpdateOrderStatusRequest 
} from '../types/order.types';

export const orderService = {
  async placeOrder(payload: PlaceOrderRequest): Promise<OrderApiResponse> {
    const response = await axiosInstance.post<OrderApiResponse>('/orders', payload);
    return response.data;
  },

  async updateStatus(id: string, payload: UpdateOrderStatusRequest): Promise<OrderApiResponse> {
    const response = await axiosInstance.put<OrderApiResponse>(`/orders/${id}/status`, payload);
    return response.data;
  },

  async getOrders(): Promise<OrderListApiResponse> {
    const response = await axiosInstance.get<OrderListApiResponse>('/orders');
    return response.data;
  },

  async getOrderById(id: string): Promise<OrderApiResponse> {
    const response = await axiosInstance.get<OrderApiResponse>(`/orders/${id}`);
    return response.data;
  }
};
