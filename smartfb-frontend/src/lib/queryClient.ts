import { QueryClient } from '@tanstack/react-query';

/**
 * Query client dùng chung cho toàn bộ frontend.
 * Giữ cấu hình tập trung tại một chỗ để tránh `main.tsx` và các test setup tự khai báo lệch nhau.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});
