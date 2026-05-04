import { isAxiosError } from 'axios';
import type { ApiResponse } from '@shared/types/api.types';

/**
 * Trich xuat thong bao loi tu ApiResponse backend.
 * Dung trong catch cua mutation de man hinh hien dung loi nghiep vu thay vi thong bao chung.
 *
 * @param error - Loi bat duoc tu axios/TanStack Query
 * @param fallbackMessage - Thong bao du phong khi response khong dung contract
 * @returns Message co the hien thi cho nguoi dung
 */
export const getApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.error?.message ?? error.response?.data?.message ?? fallbackMessage;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
};
