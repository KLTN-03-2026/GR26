import { usePosSessionHistory } from '@modules/pos-session/hooks/usePosSession';
import { PosSessionStatusControl } from '@modules/pos-session/components/PosSessionStatusControl';
import type { PosSession } from '@modules/pos-session/types/posSession.types';
import { Badge } from '@shared/components/ui/badge';
import { formatVND } from '@shared/utils/formatCurrency';
import { formatDateTime } from '@shared/utils/formatDate';
import { AlertCircle, Clock, LockKeyhole, RefreshCw, Wallet } from 'lucide-react';

/** Màu sắc chênh lệch tiền: âm = đỏ, dương = xanh, bằng 0 = mặc định */
const getCashDiffColor = (diff: number | null): string => {
  if (diff === null) return 'text-text-secondary';
  if (diff < 0) return 'text-red-600 font-semibold';
  if (diff > 0) return 'text-emerald-600 font-semibold';
  return 'text-text-secondary';
};

interface SessionRowProps {
  session: PosSession;
}

const SessionRow = ({ session }: SessionRowProps) => {
  const isOpen = session.status === 'OPEN';
  const cashDiff = session.cashDifference ?? null;

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 text-sm">
        {isOpen ? (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            <LockKeyhole className="mr-1 h-3 w-3" />
            Đang mở
          </Badge>
        ) : (
          <Badge variant="secondary">Đã đóng</Badge>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-text-primary">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-text-secondary" />
          {formatDateTime(session.startTime)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">
        {session.endTime ? formatDateTime(session.endTime) : '—'}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-text-primary">
        {formatVND(session.startingCash)}
      </td>
      {/* author: Hoàng | date: 2026-04-30 | note: Thêm 2 cột breakdown cashSales/cashExpenses từ backend Plan B V26. */}
      <td className="px-4 py-3 text-sm text-emerald-600">
        {session.cashSales !== null ? formatVND(session.cashSales) : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-red-600">
        {session.cashExpenses !== null ? formatVND(session.cashExpenses) : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">
        {session.endingCashExpected !== null ? formatVND(session.endingCashExpected) : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">
        {session.endingCashActual !== null ? formatVND(session.endingCashActual) : '—'}
      </td>
      <td className={`px-4 py-3 text-sm ${getCashDiffColor(cashDiff)}`}>
        {cashDiff !== null
          ? `${cashDiff >= 0 ? '+' : ''}${formatVND(cashDiff)}`
          : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary max-w-[200px] truncate">
        {session.note ?? '—'}
      </td>
    </tr>
  );
};

/**
 * Trang lịch sử phiên POS của chi nhánh hiện tại.
 * Chỉ OWNER và BRANCH_MANAGER được xem (BE giới hạn quyền).
 */
export default function PosSessionHistoryPage() {
  const { data: sessions = [], isLoading, isError, refetch } = usePosSessionHistory();

  const pageHeader = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Lịch sử ca POS</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Theo dõi các phiên mở/đóng ca của chi nhánh hiện tại.
        </p>
      </div>
      <PosSessionStatusControl className="w-full sm:w-auto" />
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {pageHeader}
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-text-secondary">Đang tải lịch sử ca POS...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        {pageHeader}
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
            <p className="font-medium text-text-primary">Không thể tải lịch sử ca POS</p>
            <button
              type="button"
              className="mt-4 text-sm text-primary underline-offset-2 hover:underline"
              onClick={() => void refetch()}
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-4">
        {pageHeader}
        <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-border">
          <div className="text-center">
            <Wallet className="mx-auto mb-3 h-8 w-8 text-text-secondary" />
            <p className="font-medium text-text-primary">Chưa có phiên POS nào</p>
            <p className="mt-1 text-sm text-text-secondary">
              Lịch sử ca sẽ xuất hiện sau khi mở ca POS đầu tiên tại chi nhánh này.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pageHeader}

      <p className="text-sm text-text-secondary">
        Tổng cộng {sessions.length} phiên - sắp xếp mới nhất trước.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[1020px] text-left">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Mở ca lúc
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Đóng ca lúc
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Tiền đầu ca
              </th>
              {/* author: Hoàng | date: 2026-04-30 | note: Cột breakdown cashSales/cashExpenses từ backend Plan B V26. */}
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                DT tiền mặt
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Chi tiền mặt
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Kỳ vọng
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Thực tế
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Chênh lệch
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Ghi chú
              </th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
