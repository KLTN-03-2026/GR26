import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { accountService } from '../services/accountService';

/**
 * Hook lấy thông tin profile cá nhân của user đang đăng nhập.
 * Tự động cache 5 phút, không refetch liên tục.
 */
export const useMyProfile = () =>
  useQuery({
    queryKey: queryKeys.account.me,
    queryFn: accountService.getMyProfile,
    staleTime: 5 * 60 * 1000,
  });
