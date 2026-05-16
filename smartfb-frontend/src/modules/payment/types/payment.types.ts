import type { ApiResponse } from '@shared/types/api.types';

/**
 * Trạng thái giao dịch thanh toán theo contract backend.
 */
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

/**
 * Phương thức thanh toán backend đang hỗ trợ.
 * ZALOPAY chưa được BE xử lý nên không khai báo ở đây.
 * PAYOS: cổng thanh toán PayOS — khách quét QR bằng app ngân hàng bất kỳ (chuẩn VietQR).
 */
export type PaymentMethod = 'CASH' | 'VIETQR' | 'MOMO' | 'PAYOS';

/**
 * Payload xử lý thanh toán tiền mặt.
 * `amount` là số tiền khách thực đưa tại quầy.
 */
export interface ProcessCashPaymentRequest {
  orderId: string;
  amount: number;
}

/**
 * Payload tạo QR thanh toán.
 * BE tự lookup config PayOS của chi nhánh khi qrMethod = 'PAYOS'.
 */
export interface ProcessQRPaymentRequest {
  orderId: string;
  amount: number;
  qrMethod: 'VIETQR' | 'MOMO' | 'PAYOS';
}

/**
 * Response khi QR code được tạo thành công từ BE.
 * `qrCodeUrl` là URL thanh toán — FE render thành hình QR để khách quét.
 * `expiresInSeconds` thường là 180 (3 phút).
 */
export interface ProcessQRPaymentResponse {
  paymentId: string;
  qrCodeUrl: string;
  qrCodeData: string;
  expiresInSeconds: number;
  orderNumber: string;
}

/**
 * Response payment backend trả về sau khi thanh toán hoặc khi truy vấn lại giao dịch.
 */
export interface PaymentResponse {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  paidAt?: string | null;
  createdAt?: string | null;
}

/**
 * Tham số tìm kiếm invoice theo contract backend.
 * FE dùng page/size để dò invoice khớp với order hiện tại.
 */
export interface SearchInvoicesParams {
  invoiceNumber?: string;
  page?: number;
  size?: number;
}

/**
 * Dòng invoice rút gọn trả về từ API search.
 */
export interface InvoiceSearchItemResponse {
  id: string;
  invoiceNumber: string;
  orderId: string;
  total: number;
  issuedAt: string;
}

/**
 * Kết quả search invoice có phân trang.
 */
export interface SearchInvoiceResponse {
  items: InvoiceSearchItemResponse[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Topping snapshot lấy từ order để bổ sung vào chi tiết hóa đơn.
 * Invoice backend hiện chưa trả topping trong `invoice_items`.
 */
export interface InvoiceItemAddonResponse {
  addonId: string;
  addonName: string;
  extraPrice: number;
  quantity: number;
}

/**
 * Dòng món snapshot trong hóa đơn.
 */
export interface InvoiceItemResponse {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addons?: InvoiceItemAddonResponse[];
}

/**
 * Hình thức phục vụ của order gốc.
 */
export type InvoiceOrderSource = 'IN_STORE' | 'TAKEAWAY' | 'DELIVERY' | string;

/**
 * Thông tin order gốc dùng để bổ sung ngữ cảnh cho hóa đơn.
 */
export interface InvoiceOrderSummary {
  id: string;
  orderNumber?: string | null;
  tableId?: string | null;
  tableName?: string | null;
  userId?: string | null;
  staffName?: string | null;
  source?: InvoiceOrderSource | null;
}

/**
 * Chi tiết hóa đơn backend trả về sau khi thanh toán thành công.
 * `paymentMethod` là tên phương thức: CASH | VIETQR | MOMO.
 */
export interface InvoiceResponse {
  id: string;
  orderId: string;
  paymentMethod: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  issuedAt: string;
  items: InvoiceItemResponse[];
  order?: InvoiceOrderSummary;
}

/**
 * Dữ liệu tổng hợp FE cần để hiển thị block thanh toán trên order detail.
 */
export interface OrderInvoiceResponse {
  invoice: InvoiceResponse;
  payment: PaymentResponse | null;
}

/**
 * Dòng món tối thiểu từ order detail dùng để enrich topping cho hóa đơn.
 */
export interface InvoiceOrderItemSnapshot {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addons?: string | InvoiceItemAddonResponse[] | null;
}

/**
 * Snapshot tối thiểu của order liên quan đến invoice.
 */
export interface InvoiceOrderSnapshot {
  id: string;
  orderNumber?: string | null;
  tableId?: string | null;
  tableName?: string | null;
  userId?: string | null;
  staffName?: string | null;
  source?: InvoiceOrderSource | null;
  items: InvoiceOrderItemSnapshot[];
}

export type PaymentApiResponse = ApiResponse<PaymentResponse>;
export type ProcessCashPaymentApiResponse = PaymentApiResponse;
export type ProcessQRPaymentApiResponse = ApiResponse<ProcessQRPaymentResponse>;
export type SearchInvoiceApiResponse = ApiResponse<SearchInvoiceResponse>;
export type InvoiceApiResponse = ApiResponse<InvoiceResponse>;
export type InvoiceOrderSnapshotApiResponse = ApiResponse<InvoiceOrderSnapshot>;
