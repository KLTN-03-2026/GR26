import { axiosInstance as api } from '@lib/axios';
import type {
  ExpenseDetailApiResponse,
  ExpenseFilters,
  ExpenseListApiResponse,
  ExpenseMutationApiResponse,
  ExpenseRequest,
} from '../types/expense.types';

const normalizeCategoryName = (value?: string): string | undefined => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
};

/**
 * Service thao tác với Expense API.
 * Chỉ giữ vai trò gọi HTTP theo đúng contract backend.
 */
export const expenseService = {
  /**
   * Lấy danh sách phiếu chi theo chi nhánh làm việc hiện tại.
   */
  getList: async (filters: ExpenseFilters): Promise<ExpenseListApiResponse> => {
    const response = await api.get<ExpenseListApiResponse>('/expenses', {
      params: {
        categoryName: normalizeCategoryName(filters.categoryName),
        page: filters.page,
        size: filters.size,
      },
    });

    return response.data;
  },

  /**
   * Lấy chi tiết một phiếu chi theo ID.
   */
  getDetail: async (expenseId: string): Promise<ExpenseDetailApiResponse> => {
    const response = await api.get<ExpenseDetailApiResponse>(`/expenses/${expenseId}`);
    return response.data;
  },

  /**
   * Tạo mới phiếu chi.
   */
  create: async (payload: ExpenseRequest): Promise<ExpenseMutationApiResponse> => {
    const response = await api.post<ExpenseMutationApiResponse>('/expenses', payload);
    return response.data;
  },

  /**
   * Cập nhật phiếu chi hiện có.
   */
  update: async (expenseId: string, payload: ExpenseRequest): Promise<ExpenseMutationApiResponse> => {
    const response = await api.put<ExpenseMutationApiResponse>(`/expenses/${expenseId}`, payload);
    return response.data;
  },

  /**
   * Xóa mềm phiếu chi.
   */
  delete: async (expenseId: string): Promise<ExpenseMutationApiResponse> => {
    const response = await api.delete<ExpenseMutationApiResponse>(`/expenses/${expenseId}`);
    return response.data;
  },
};
