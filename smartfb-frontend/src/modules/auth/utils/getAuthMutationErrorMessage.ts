import { AxiosError } from 'axios';
import type { ApiResponse } from '@shared/types/api.types';

/**
 * Trích xuất message lỗi từ response auth để các mutation hiển thị toast nhất quán.
 */
export const getAuthMutationErrorMessage = (
  error: unknown,
  fallbackMessage: string
): string => {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as ApiResponse<unknown> | undefined;

    return responseData?.error?.message ?? responseData?.message ?? fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};
