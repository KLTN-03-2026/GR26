import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type { Position, CreatePositionPayload, UpdatePositionPayload } from '../types/position.types';

/**
 * Position service - Quản lý chức vụ (Barista, Cashier, Waiter...)
 * Base URL: /api/v1/positions
 */
export const positionService = {
  /**
   * Lấy danh sách chức vụ
   */
  getList: async (): Promise<ApiResponse<Position[]>> => {
    return api.get<ApiResponse<Position[]>>('/positions').then(r => r.data);
  },

  /**
   * Tạo chức vụ mới
   */
  create: async (payload: CreatePositionPayload): Promise<ApiResponse<Position>> => {
    return api.post<ApiResponse<Position>>('/positions', payload).then(r => r.data);
  },

  /**
   * Cập nhật chức vụ
   */
  update: async (id: string, payload: UpdatePositionPayload): Promise<ApiResponse<Position>> => {
    return api.put<ApiResponse<Position>>(`/positions/${id}`, payload).then(r => r.data);
  },

  /**
   * Xóa chức vụ
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<ApiResponse<void>>(`/positions/${id}`).then(r => r.data);
  },
};
