import axiosInstance from '@/lib/axios';
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

  async getById(id: string): Promise<OrderApiResponse> {
    const response = await axiosInstance.get<OrderApiResponse>(`/orders/${id}`);
    return response.data;
  },

  async updateStatus(id: string, payload: UpdateOrderStatusRequest): Promise<OrderApiResponse> {
    const response = await axiosInstance.put<OrderApiResponse>(`/orders/${id}/status`, payload);
    return response.data;
  },

  async cancelOrder(id: string, payload?: { reason?: string }): Promise<OrderApiResponse> {
    const response = await axiosInstance.post<OrderApiResponse>(`/orders/${id}/cancel`, payload);
    return response.data;
  },

  async getOrders(): Promise<OrderListApiResponse> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockOrders: any[] = [
      {
        id: 'o-001',
        orderNumber: 'ORD-20240408-001',
        status: 'PENDING',
        source: 'POS',
        tableName: 'Bàn 01',
        totalAmount: 125000,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        items: [
          { id: 'i-1', itemName: 'Cà phê Muối', quantity: 2, unitPrice: 35000, totalPrice: 70000 },
          { id: 'i-2', itemName: 'Bánh Tiramisu', quantity: 1, unitPrice: 55000, totalPrice: 55000 }
        ]
      },
      {
        id: 'o-002',
        orderNumber: 'ORD-20240408-002',
        status: 'PROCESSING',
        source: 'POS',
        tableName: 'Bàn 05',
        totalAmount: 45000,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        items: [
          { id: 'i-3', itemName: 'Trà Đào Cam Sả', quantity: 1, unitPrice: 45000, totalPrice: 45000 }
        ]
      },
      {
        id: 'o-003',
        orderNumber: 'ORD-20240408-003',
        status: 'COMPLETED',
        source: 'WEB',
        tableName: 'Mang đi',
        totalAmount: 85000,
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        items: [
          { id: 'i-4', itemName: 'Nước Ép Cam', quantity: 1, unitPrice: 40000, totalPrice: 40000 },
          { id: 'i-5', itemName: 'Sữa Hạnh Nhân', quantity: 1, unitPrice: 45000, totalPrice: 45000 }
        ]
      }
    ];

    return {
      success: true,
      data: mockOrders,
      message: 'Lấy danh sách đơn hàng thành công (Mock)'
    };
  }
};
