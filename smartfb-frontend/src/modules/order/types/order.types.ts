import type { ApiResponse } from '@shared/types/api.types';

/**
 * Trạng thái chính của đơn hàng trong POS.
 */
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

/**
 * Nguồn tạo đơn hàng.
 */
export type OrderSource = 'IN_STORE' | 'TAKEAWAY' | 'DELIVERY';

/**
 * Topping đã chọn trên một dòng món.
 */
export interface OrderAddonSelection {
  addonId: string;
  addonName: string;
  extraPrice: number;
  quantity: number;
}

/**
 * Context bàn đang thao tác trên màn tạo đơn.
 */
export interface OrderTableContext {
  tableId: string | null;
  tableName: string;
  zoneId?: string;
  zoneName: string;
  branchId?: string | null;
  branchName: string;
}

/**
 * Dòng món FE dùng để render giỏ hàng và màn thanh toán.
 * `orderItemId` chỉ có sau khi backend đã tạo item thật trên đơn.
 */
export interface OrderDraftItem {
  draftItemId: string;
  menuItemId: string;
  orderItemId?: string;
  name: string;
  description?: string;
  image: string;
  categoryId?: string;
  quantity: number;
  unitPrice: number;
  addons: OrderAddonSelection[];
  notes: string;
  lineTotal: number;
}

/**
 * Meta của đơn nháp đang thao tác.
 */
export interface DraftOrderMeta {
  orderId: string | null;
  orderNumber: string | null;
  status: OrderStatus;
  createdAt: string | null;
}

/**
 * Một dòng món gửi lên API tạo/cập nhật đơn.
 * Backend hiện yêu cầu `addons` là JSON string hợp lệ để lưu vào cột `jsonb`.
 */
export interface OrderItemCommand {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  addons?: string;
  notes?: string;
}

/**
 * Payload tạo đơn hàng mới.
 */
export interface PlaceOrderRequest {
  tableId?: string;
  source: OrderSource;
  notes?: string;
  items: OrderItemCommand[];
}

/**
 * Payload cập nhật trạng thái đơn.
 */
export interface UpdateOrderStatusRequest {
  newStatus: OrderStatus;
  reason?: string;
}

/**
 * Payload hủy đơn hàng theo contract hiện tại của backend.
 */
export interface CancelOrderRequest {
  reason?: string;
}

/**
 * Dòng món backend trả về trong chi tiết đơn.
 */
export interface OrderItemResponse {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addons?: string | null;
  notes?: string | null;
  status?: string | null;
}

/**
 * Đơn hàng backend trả về sau khi tạo/chi tiết đơn.
 */
export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  source: OrderSource;
  tableId?: string | null;
  tableName?: string | null;
  notes?: string | null;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  items: OrderItemResponse[];
  createdAt?: string;
  completedAt?: string | null;
  tenantId?: string;
  branchId?: string;
}

export type OrderApiResponse = ApiResponse<OrderResponse>;
export type OrderListApiResponse = ApiResponse<OrderResponse[]>;
