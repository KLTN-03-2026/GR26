export type PosSessionStatus = 'OPEN' | 'CLOSED';

export interface PosSession {
  id: string;
  branchId: string;
  openedByUserId: string;
  closedByUserId: string | null;
  shiftScheduleId: string | null;
  startTime: string;
  endTime: string | null;
  startingCash: number;
  endingCashExpected: number | null;
  endingCashActual: number | null;
  cashDifference: number | null;
  note: string | null;
  status: PosSessionStatus;
  // author: Hoàng | date: 2026-04-30 | note: Đồng bộ breakdown đối soát tiền mặt cuối ca từ backend (Plan B V26).
  cashSales: number | null;
  cashExpenses: number | null;
}

// author: Hoàng | date: 2026-05-11 | note: Params phân trang lịch sử ca POS theo contract backend Spring Page.
export interface PosSessionHistoryParams {
  /** Trang hiện tại, 0-indexed theo Spring Pageable */
  page: number;
  /** Số bản ghi mỗi trang */
  size: number;
}

// author: Hoàng | date: 2026-05-11 | note: Response phân trang từ GET /pos-sessions để FE render totalElements/totalPages.
export interface PosSessionPageResponse {
  content: PosSession[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// author: Hoàng | date: 2026-04-30 | note: DTO phản ánh response từ GET /pos-sessions/{id}/payment-breakdown — query live, không lưu DB.
export interface PosSessionPaymentMethodEntry {
  /** Tên enum phương thức: CASH, VIETQR, MOMO, PAYOS, ZALOPAY */
  method: string;
  /** Tên hiển thị tiếng Việt do backend trả về */
  displayName: string;
  amount: number;
  transactionCount: number;
}

export interface PosSessionRevenueBreakdown {
  sessionId: string;
  methods: PosSessionPaymentMethodEntry[];
  totalRevenue: number;
}

// author: Hoàng | date: 2026-05-01 | note: Breakdown chi phí theo phương thức trong ca — tổng hợp từ financial invoices API filter theo ngày.
export interface PosSessionExpenseBreakdownEntry {
  /** Tên phương thức: CASH, TRANSFER, QR_CODE */
  method: string;
  /** Tên hiển thị tiếng Việt */
  displayName: string;
  /** Tổng tiền chi của phương thức này trong ngày ca */
  amount: number;
}

export interface PosSessionExpenseBreakdown {
  entries: PosSessionExpenseBreakdownEntry[];
  totalExpenses: number;
}

export interface OpenPosSessionPayload {
  startingCash: number;
  shiftScheduleId?: string | null;
}

export interface ClosePosSessionPayload {
  endingCashActual: number;
  note?: string | null;
}
