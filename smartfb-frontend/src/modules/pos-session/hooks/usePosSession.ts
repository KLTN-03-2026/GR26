import { selectCurrentBranchId, useAuthStore } from '@modules/auth/stores/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { getApiErrorMessage } from '@shared/utils/getApiErrorMessage';
import { posSessionService } from '../services/posSessionService';
import type { ClosePosSessionPayload, OpenPosSessionPayload, PosSession } from '../types/posSession.types';

/**
 * Hook đọc phiên POS đang mở của chi nhánh hiện tại.
 */
export const useActivePosSession = () => {
  const branchId = useAuthStore(selectCurrentBranchId);

  return useQuery({
    queryKey: queryKeys.posSessions.active(branchId),
    queryFn: () => posSessionService.getActive().then((response) => response.data ?? null),
    enabled: Boolean(branchId),
    staleTime: 30 * 1000,
  });
};

/**
 * Hook đọc lịch sử phiên POS của chi nhánh hiện tại.
 */
export const usePosSessionHistory = () => {
  const branchId = useAuthStore(selectCurrentBranchId);

  return useQuery({
    queryKey: queryKeys.posSessions.history(branchId),
    queryFn: () => posSessionService.getHistory().then((response) => response.data ?? []),
    enabled: Boolean(branchId),
    staleTime: 60 * 1000,
  });
};

/**
 * Hook mở phiên POS đầu ca.
 */
export const useOpenPosSession = () => {
  const queryClient = useQueryClient();
  const branchId = useAuthStore(selectCurrentBranchId);
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: OpenPosSessionPayload) => posSessionService.open(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.posSessions.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.posSessions.active(branchId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.posSessions.history(branchId) });
      success('Mở ca POS thành công', 'Phiên bán hàng đã sẵn sàng.');
    },
    onError: (err) => {
      error('Không thể mở ca POS', getApiErrorMessage(err, 'Vui lòng thử lại sau.'));
      void queryClient.invalidateQueries({ queryKey: queryKeys.posSessions.active(branchId) });
    },
  });
};

/**
 * Hook lấy breakdown doanh thu theo từng phương thức thanh toán trong một ca POS.
 * Query live từ backend — stale sau 30s, tự refetch khi sessionId thay đổi.
 * author: Hoàng | date: 2026-04-30 | note: Dùng cho cả OPEN (real-time) và CLOSED (tính lại từ payments).
 */
export const usePosSessionRevenueBreakdown = (sessionId: string | null) => {
  return useQuery({
    queryKey: queryKeys.posSessions.revenueBreakdown(sessionId ?? ''),
    queryFn: () => posSessionService.getRevenueBreakdown(sessionId!).then((response) => response.data ?? null),
    enabled: Boolean(sessionId),
    staleTime: 30 * 1000,
  });
};

/**
 * Hook lấy breakdown chi phí theo phương thức trong ngày của ca POS.
 * Dùng financial invoices API (type=EXPENSE) filter theo ngày ca rồi group trên FE.
 * author: Hoàng | date: 2026-05-01 | note: Approximate theo ngày — đủ dùng cho 99% F&B 1 ca/ngày.
 *   enabled=false khi dialog chưa mở để tránh request thừa.
 *
 * @param session  Ca POS cần xem (null nếu chưa có)
 * @param enabled  Chỉ fetch khi dialog/panel đang mở
 */
export const usePosSessionExpenseBreakdown = (session: PosSession | null, enabled: boolean) => {
  const branchId = useAuthStore(selectCurrentBranchId);

  // Lấy ngày bắt đầu ca (YYYY-MM-DD) — slice 10 ký tự đầu của ISO string
  const startDate = session?.startTime.slice(0, 10) ?? null;
  // Dùng ngày kết thúc ca nếu đã đóng, hoặc ngày hôm nay nếu ca đang mở
  const endDate = session
    ? (session.endTime ?? new Date().toISOString()).slice(0, 10)
    : null;

  return useQuery({
    queryKey: queryKeys.posSessions.expenseBreakdown(session?.id ?? ''),
    queryFn: () =>
      posSessionService.getSessionExpenseBreakdown(branchId!, startDate!, endDate!),
    enabled: Boolean(enabled && session && branchId && startDate && endDate),
    staleTime: 30 * 1000,
  });
};

/**
 * Hook đóng phiên POS cuối ca.
 */
export const useClosePosSession = () => {
  const queryClient = useQueryClient();
  const branchId = useAuthStore(selectCurrentBranchId);
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: ClosePosSessionPayload }) =>
      posSessionService.close(sessionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.posSessions.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.posSessions.active(branchId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.posSessions.history(branchId) });
      success('Đóng ca POS thành công', 'Phiên bán hàng đã được kết thúc.');
    },
    onError: (err) => {
      error('Không thể đóng ca POS', getApiErrorMessage(err, 'Vui lòng tải lại phiên POS và thử lại.'));
      void queryClient.invalidateQueries({ queryKey: queryKeys.posSessions.active(branchId) });
    },
  });
};
