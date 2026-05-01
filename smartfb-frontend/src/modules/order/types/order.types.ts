import type { ApiResponse } from '@shared/types/api.types';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export type OrderSource = 'POS' | 'WEB' | 'MOBILE' | 'IN_STORE' | 'TAKEAWAY' | 'DELIVERY';

export type PaymentMethod = 'CASH' | 'VIETQR' | 'MOMO' | 'ZALOPAY';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface OrderAddonResponse {
  id: string;
  addonName: string;
  quantity: number;
  price: number;
}

export interface OrderItemCommand {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  addons?: string[];
  notes?: string;
}

export interface PlaceOrderRequest {
  tableId?: string;
  source: OrderSource;
  notes?: string;
  items: OrderItemCommand[];
}

export interface UpdateOrderStatusRequest {
  newStatus: OrderStatus;
  reason?: string;
}

export interface OrderItemResponse {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addons?: OrderAddonResponse[];
  notes?: string;
}

export interface OrderResponse {
  id: string;
  tenantId: string;
  branchId: string;
  orderNumber: string;
  status: OrderStatus;
  source: OrderSource;
  tableId?: string;
  tableName?: string;
  notes?: string;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  items: OrderItemResponse[];
  createdAt: string;
  completedAt?: string;
}

export type OrderApiResponse = ApiResponse<OrderResponse>;
export type OrderListApiResponse = ApiResponse<OrderResponse[]>;

export interface CashPaymentRequest {
  orderId: string;
  amount: number;
}

export interface PaymentResponse {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
}

export interface QRPaymentData {
  qrCode: string;
  orderId: string;
  amount: number;
  qrImage?: string;
}

export type PaymentApiResponse = ApiResponse<PaymentResponse>;
export type QRPaymentApiResponse = ApiResponse<QRPaymentData>;
