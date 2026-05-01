import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type { CurrentSubscription } from '../types/subscription.types';

/**
 * Service thao tác với API gói dịch vụ của tenant hiện tại.
 * Chỉ gọi API và trả về dữ liệu backend.
 */
export const subscriptionService = {
  getCurrentSubscription: async (): Promise<CurrentSubscription> => {
    const response = await api.get<ApiResponse<CurrentSubscription>>('/subscriptions/current');
    return response.data.data;
  },
};
