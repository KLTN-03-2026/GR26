import type { ApiResponse } from '@shared/types/api.types';

/**
 * Phương thức chi hợp lệ theo contract backend Expense.
 */
export type ExpensePaymentMethod = 'CASH' | 'TRANSFER' | 'QR_CODE';

/**
 * Bộ phương thức chi FE còn cho phép thao tác trên form nghiệp vụ hiện tại.
 * `QR_CODE` vẫn giữ ở type gốc để hiển thị dữ liệu cũ từ backend nếu có.
 */
export type ExpenseEditablePaymentMethod = Exclude<ExpensePaymentMethod, 'QR_CODE'>;

/**
 * Trạng thái phiếu chi hiện tại backend đang trả về.
 */
export type ExpenseStatus = 'COMPLETED';

/**
 * Bộ lọc danh sách phiếu chi.
 */
export interface ExpenseFilters {
  categoryName?: string;
  page: number;
  size: number;
}

/**
 * Một phiếu chi backend trả về ở API list/detail.
 */
export interface ExpenseItem {
  id: string;
  amount: number;
  categoryName: string;
  description: string | null;
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod;
  status: ExpenseStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

/**
 * Form values dùng cho dialog tạo và sửa phiếu chi.
 */
export interface ExpenseFormValues {
  amount: string;
  categoryName: string;
  description: string;
  expenseDate: string;
  paymentMethod: ExpenseEditablePaymentMethod;
}

/**
 * Payload gửi lên backend khi tạo hoặc cập nhật phiếu chi.
 */
export interface ExpenseRequest {
  amount: number;
  categoryName: string;
  description: string | null;
  expenseDate: string;
  paymentMethod: ExpenseEditablePaymentMethod;
}

/**
 * Cấu trúc phân trang backend của module expense.
 */
export interface ExpensePageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type ExpenseListApiResponse = ApiResponse<ExpensePageResponse<ExpenseItem>>;
export type ExpenseDetailApiResponse = ApiResponse<ExpenseItem>;
export type ExpenseMutationApiResponse = ApiResponse<string | void>;
