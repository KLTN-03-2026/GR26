import type { ApiResponse } from '@shared/types/api.types';

/**
 * Trạng thái giao dịch thanh toán theo contract backend.
 */
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

/**
 * Phương thức thanh toán backend đang hỗ trợ.
 */
export type PaymentMethod = 'CASH' | 'VIETQR' | 'MOMO' | 'ZALOPAY';

/**
 * Payload xử lý thanh toán tiền mặt.
 * `amount` là số tiền khách thực đưa tại quầy.
 */
export interface ProcessCashPaymentRequest {
  orderId: string;
  amount: number;
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
 * Dòng món snapshot trong hóa đơn.
 */
export interface InvoiceItemResponse {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * Chi tiết hóa đơn backend trả về sau khi thanh toán thành công.
 */
export interface InvoiceResponse {
  id: string;
  orderId: string;
  paymentId: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  issuedAt: string;
  items: InvoiceItemResponse[];
}

/**
 * Dữ liệu tổng hợp FE cần để hiển thị block thanh toán trên order detail.
 */
export interface OrderInvoiceResponse {
  invoice: InvoiceResponse;
  payment: PaymentResponse | null;
}

export type PaymentApiResponse = ApiResponse<PaymentResponse>;
export type ProcessCashPaymentApiResponse = PaymentApiResponse;
export type SearchInvoiceApiResponse = ApiResponse<SearchInvoiceResponse>;
export type InvoiceApiResponse = ApiResponse<InvoiceResponse>;
