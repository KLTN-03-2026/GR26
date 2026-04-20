import { QueryClient } from '@tanstack/react-query';

/**
<<<<<<< HEAD
 * TanStack Query client configuration
 * Global settings for all queries and mutations
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache time: Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests 1 time
      retry: 1,
      
      // Don't refetch on window focus by default (can enable per query)
      refetchOnWindowFocus: false,
      
      // Don't refetch on reconnect by default
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry failed mutations 0 times
      retry: 0,
=======
 * Query client dùng chung cho toàn bộ frontend.
 * Giữ cấu hình tập trung tại một chỗ để tránh `main.tsx` và các test setup tự khai báo lệch nhau.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
>>>>>>> origin/main
    },
  },
});
