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
 * Một dòng món gửi lên API cập nhật đơn hàng.
 * `id` là order item id hiện có trên backend, để `null/undefined` nếu là món mới.
 */
export interface UpdateOrderItemCommand extends OrderItemCommand {
  id?: string | null;
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
 * Payload cập nhật toàn bộ đơn hàng.
 * Backend hiện dùng full update cho danh sách món.
 */
export interface UpdateOrderRequest {
  tableId?: string;
  notes?: string;
  items: UpdateOrderItemCommand[];
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
 * Bộ lọc FE dùng khi gọi API danh sách đơn hàng.
 * `tableId` giúp POS dò order đang mở của một bàn trước khi lấy chi tiết đơn.
 */
export interface OrderListQueryParams {
  status?: OrderStatus;
  from?: string;
  to?: string;
  tableId?: string;
  /**
   * Trang backend dùng zero-based index.
   */
  page?: number;
  /**
   * Số order mỗi trang, backend giới hạn tối đa 100.
   */
  size?: number;
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
  /**
   * Backend có thể trả JSON string, còn FE sẽ chuẩn hóa về mảng khi đi qua hook detail.
   */
  addons?: string | OrderAddonSelection[] | null;
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

/**
 * Dòng dữ liệu rút gọn backend trả về ở API danh sách đơn hàng.
 */
export interface OrderListItemResponse {
  id: string;
  orderNumber: string;
  tableId?: string | null;
  tableName?: string | null;
  status: OrderStatus;
  totalAmount: number;
  createdAt?: string;
  staffName?: string | null;
}

/**
 * Response phân trang của API danh sách order.
 * Backend trả `page` theo zero-based index và `content` là dữ liệu của trang hiện tại.
 */
export interface OrderListPageResponse {
  content: OrderListItemResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type OrderApiResponse = ApiResponse<OrderResponse>;
export type OrderListApiResponse = ApiResponse<OrderListItemResponse[]>;
export type OrderListPageApiResponse = ApiResponse<OrderListPageResponse>;
