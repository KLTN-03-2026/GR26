/**
 * Common API Response types
 */
/**
 * Chi tiết lỗi theo contract backend SmartF&B.
 * Backend trả lỗi trong object `error` thay vì field `message` ở root.
 */
export interface ApiErrorDetail {
  code: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: ApiErrorDetail | null;
  timestamp?: number;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
