import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  ClosePosSessionPayload,
  OpenPosSessionPayload,
  PosSession,
  PosSessionExpenseBreakdown,
  PosSessionRevenueBreakdown,
} from '../types/posSession.types';

// author: Hoàng | date: 2026-05-01 | note: Response shape minimal từ /reports/financial/invoices — không import từ report module để tránh cross-module dependency.
interface FinancialInvoiceRaw {
  paymentMethod: string | null;
  amount: number | string | null;
}

interface FinancialPageRaw {
  content: FinancialInvoiceRaw[];
}

// Map phương thức chi → tên hiển thị tiếng Việt
const EXPENSE_METHOD_DISPLAY: Record<string, string> = {
  CASH: 'Tiền mặt',
  TRANSFER: 'Chuyển khoản',
  QR_CODE: 'QR Code',
};

/**
 * Service gọi API POS session.
 * Backend lấy tenantId, branchId và userId từ JWT hiện tại.
 */
export const posSessionService = {
  /**
   * Lấy phiên POS đang mở của chi nhánh hiện tại.
   */
  getActive: async (): Promise<ApiResponse<PosSession | null>> => {
    return api.get<ApiResponse<PosSession | null>>('/pos-sessions/active').then((response) => response.data);
  },

  /**
   * Lấy lịch sử phiên POS của chi nhánh hiện tại.
   */
  getHistory: async (): Promise<ApiResponse<PosSession[]>> => {
    return api.get<ApiResponse<PosSession[]>>('/pos-sessions').then((response) => response.data);
  },

  /**
   * Mở phiên POS đầu ca cho chi nhánh hiện tại.
   */
  open: async (payload: OpenPosSessionPayload): Promise<ApiResponse<string>> => {
    return api.post<ApiResponse<string>>('/pos-sessions/open', payload).then((response) => response.data);
  },

  /**
   * Đóng phiên POS đang mở.
   */
  close: async (sessionId: string, payload: ClosePosSessionPayload): Promise<ApiResponse<void>> => {
    return api
      .post<ApiResponse<void>>(`/pos-sessions/${sessionId}/close`, payload)
      .then((response) => response.data);
  },

  /**
   * Lấy breakdown doanh thu theo từng phương thức thanh toán trong một ca POS.
   * author: Hoàng | date: 2026-04-30 | note: Query live từ BE — GROUP BY method, không lưu DB, luôn real-time.
   */
  getRevenueBreakdown: async (sessionId: string): Promise<ApiResponse<PosSessionRevenueBreakdown>> => {
    return api
      .get<ApiResponse<PosSessionRevenueBreakdown>>(`/pos-sessions/${sessionId}/payment-breakdown`)
      .then((response) => response.data);
  },

  /**
   * Lấy breakdown chi phí theo phương thức thanh toán trong ngày của ca POS.
   * author: Hoàng | date: 2026-05-01 | note: Dùng financial invoices API (type=EXPENSE) filter theo ngày ca,
   *   group by paymentMethod trên FE — không cần endpoint mới, approximate theo ngày (đủ cho 99% F&B 1 ca/ngày).
   *   pageSize=200 để lấy đủ trong 1 call, tránh pagination cho ca bình thường.
   *
   * @param branchId   UUID chi nhánh hiện tại (lấy từ authStore)
   * @param startDate  Ngày bắt đầu ca (YYYY-MM-DD)
   * @param endDate    Ngày kết thúc ca (YYYY-MM-DD), dùng ngày hôm nay nếu ca đang mở
   */
  getSessionExpenseBreakdown: async (
    branchId: string,
    startDate: string,
    endDate: string,
  ): Promise<PosSessionExpenseBreakdown> => {
    const response = await api
      .get<ApiResponse<FinancialPageRaw>>('/reports/financial/invoices', {
        params: { branchId, startDate, endDate, type: 'EXPENSE', page: 0, size: 200 },
      })
      .then((r) => r.data);

    const items: FinancialInvoiceRaw[] = response.data?.content ?? [];

    // Tổng hợp amount theo paymentMethod
    const map = new Map<string, number>();
    for (const item of items) {
      const method = item.paymentMethod ?? 'UNKNOWN';
      const amount = Number(item.amount) || 0;
      map.set(method, (map.get(method) ?? 0) + amount);
    }

    const entries = Array.from(map.entries())
      .map(([method, amount]) => ({
        method,
        displayName: EXPENSE_METHOD_DISPLAY[method] ?? method,
        amount,
      }))
      // CASH lên đầu, các method khác theo sau
      .sort((a, b) => {
        if (a.method === 'CASH') return -1;
        if (b.method === 'CASH') return 1;
        return a.displayName.localeCompare(b.displayName);
      });

    const totalExpenses = entries.reduce((sum, e) => sum + e.amount, 0);
    return { entries, totalExpenses };
  },
};
