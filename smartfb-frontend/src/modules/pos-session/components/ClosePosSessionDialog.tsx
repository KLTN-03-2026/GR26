// author: Hoàng | date: 2026-05-01 | note: Redesign modal đóng ca — layout thống nhất 1 card tổng quan + section kiểm kê.
import { useClosePosSession, usePosSessionExpenseBreakdown, usePosSessionRevenueBreakdown } from '@modules/pos-session/hooks/usePosSession';
import type { PosSession } from '@modules/pos-session/types/posSession.types';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { useToast } from '@shared/hooks/useToast';
import { cn } from '@shared/utils/cn';
import { formatVND } from '@shared/utils/formatCurrency';
import {
  formatNumericInputValue,
  parseNumericInputValue,
  sanitizeIntegerInputValue,
} from '@shared/utils/numberInput';
import { LockKeyhole, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useId, useMemo, useState } from 'react';

interface ClosePosSessionDialogProps {
  session: PosSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Hàng dữ liệu chính trong bảng tổng quan */
const SummaryRow = ({
  label,
  value,
  accent,
  bold,
  icon,
}: {
  label: string;
  value: string;
  accent?: 'green' | 'red' | 'default';
  bold?: boolean;
  icon?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3">
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        bold ? 'font-semibold text-text-primary' : 'text-text-secondary',
      )}
    >
      {icon}
      {label}
    </span>
    <span
      className={cn(
        'tabular-nums',
        bold ? 'font-bold' : 'font-medium',
        accent === 'green' && 'text-emerald-600',
        accent === 'red' && 'text-red-600',
        accent === 'default' || (!accent && bold) ? 'text-text-primary' : '',
        !accent && !bold && 'text-text-secondary',
      )}
    >
      {value}
    </span>
  </div>
);

/** Hàng con (indent) cho breakdown theo phương thức */
const SubRow = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'green' | 'red';
}) => (
  <div className="flex items-center justify-between gap-3 pl-4">
    <span className="text-text-secondary before:mr-1.5 before:content-['•']">{label}</span>
    <span
      className={cn(
        'tabular-nums font-medium',
        accent === 'green' && 'text-emerald-600',
        accent === 'red' && 'text-red-600',
      )}
    >
      {value}
    </span>
  </div>
);

export const ClosePosSessionDialog = ({
  session,
  open,
  onOpenChange,
}: ClosePosSessionDialogProps) => {
  const cashInputId = useId();
  const noteInputId = useId();
  const [endingCashActual, setEndingCashActual] = useState('');
  const [note, setNote] = useState('');
  const { error } = useToast();
  const closeSession = useClosePosSession();

  // author: Hoàng | date: 2026-05-01 | note: Breakdown doanh thu — live-query khi dialog mở.
  const revenueBreakdown = usePosSessionRevenueBreakdown(open ? session.id : null);
  const revenueEntries = (revenueBreakdown.data?.methods ?? []).filter((m) => m.amount > 0);
  const totalRevenue = revenueBreakdown.data?.totalRevenue ?? 0;

  // author: Hoàng | date: 2026-05-01 | note: Breakdown chi phí — financial invoices API filter theo ngày ca, group trên FE.
  const expenseBreakdown = usePosSessionExpenseBreakdown(session, open);
  const expenseEntries = (expenseBreakdown.data?.entries ?? []).filter((e) => e.amount > 0);
  const totalExpenses = expenseBreakdown.data?.totalExpenses ?? 0;

  // Tiền mặt dự kiến trong két = đầu ca + cash thu - cash chi (đã tính sẵn ở BE)
  const expectedCash = session.endingCashExpected ?? session.startingCash;

  // author: Hoàng | date: 2026-05-01 | note: Tính chênh lệch realtime khi nhập — dương = thừa, âm = thiếu.
  const diff = useMemo(() => {
    if (endingCashActual === '') return null;
    const actual = parseNumericInputValue(endingCashActual);
    if (actual === null) return null;
    return actual - expectedCash;
  }, [endingCashActual, expectedCash]);

  const handleSubmit = () => {
    if (endingCashActual === '') {
      error('Chưa nhập tiền kiểm kê', 'Vui lòng nhập số tiền kiểm kê thực tế trước khi đóng ca.');
      return;
    }

    const amount = parseNumericInputValue(endingCashActual);
    if (amount === null || amount < 0) {
      error('Tiền kiểm kê không hợp lệ', 'Vui lòng nhập số tiền lớn hơn hoặc bằng 0.');
      return;
    }
    closeSession.mutate(
      { sessionId: session.id, payload: { endingCashActual: amount, note: note.trim() || null } },
      {
        onSuccess: () => {
          setEndingCashActual('');
          setNote('');
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-md">
        {/* Header */}
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <LockKeyhole className="h-4 w-4 text-primary" />
            Ca làm việc hiện tại
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">

          {/* ── Card tổng quan ── */}
          {/* author: Hoàng | date: 2026-05-01 | note: Gộp tất cả số liệu ca vào 1 card — rõ ràng hơn layout nhiều card cũ. */}
          <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Tổng quan
            </p>

            {/* Tiền đầu ca */}
            <SummaryRow
              label="Tiền đầu ca"
              value={formatVND(session.startingCash)}
              icon={<Wallet className="h-3.5 w-3.5" />}
            />

            {/* Doanh thu trong ca */}
            <div className="space-y-1.5">
              <SummaryRow
                label="Doanh thu trong ca"
                value={`+${formatVND(totalRevenue)}`}
                accent="green"
                bold
                icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
              />
              {revenueEntries.map((entry) => (
                <SubRow
                  key={entry.method}
                  label={entry.displayName}
                  value={formatVND(entry.amount)}
                  accent="green"
                />
              ))}
            </div>

            {/* Chi phí trong ca */}
            <div className="space-y-1.5">
              <SummaryRow
                label="Chi phí trong ca"
                value={totalExpenses > 0 ? `-${formatVND(totalExpenses)}` : formatVND(0)}
                accent="red"
                bold
                icon={<TrendingDown className="h-3.5 w-3.5 text-red-500" />}
              />
              {expenseEntries.map((entry) => (
                <SubRow
                  key={entry.method}
                  label={entry.displayName}
                  value={`-${formatVND(entry.amount)}`}
                  accent="red"
                />
              ))}
            </div>

            {/* Separator */}
            <div className="border-t border-border pt-1" />

            {/* Tiền mặt trong két */}
            <SummaryRow
              label="Tiền mặt trong két"
              value={formatVND(expectedCash)}
              accent="default"
              bold
            />
          </div>

          {/* ── Section kiểm kê ── */}
          {/* author: Hoàng | date: 2026-05-01 | note: Nhập tiền thực tế và tự tính chênh lệch realtime. */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={cashInputId} className="text-sm font-medium">
                Tiền kiểm kê thực tế
              </Label>
              <Input
                id={cashInputId}
                inputMode="numeric"
                aria-invalid={endingCashActual === ''}
                placeholder="Ví dụ: 4.500.000"
                type="text"
                value={formatNumericInputValue(endingCashActual)}
                onChange={(event) => setEndingCashActual(sanitizeIntegerInputValue(event.target.value))}
              />
            </div>

            {/* Chênh lệch — chỉ hiện khi đã nhập */}
            {diff !== null && (
              <div
                className={cn(
                  'flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm',
                  diff === 0 && 'border-emerald-200 bg-emerald-50',
                  diff > 0 && 'border-emerald-200 bg-emerald-50',
                  diff < 0 && 'border-red-200 bg-red-50',
                )}
              >
                <span
                  className={cn(
                    'font-medium',
                    diff === 0 && 'text-emerald-700',
                    diff > 0 && 'text-emerald-700',
                    diff < 0 && 'text-red-700',
                  )}
                >
                  Chênh lệch
                </span>
                <span
                  className={cn(
                    'font-bold tabular-nums',
                    diff === 0 && 'text-emerald-700',
                    diff > 0 && 'text-emerald-700',
                    diff < 0 && 'text-red-700',
                  )}
                >
                  {diff === 0
                    ? 'Đủ'
                    : diff > 0
                      ? `+${formatVND(diff)} (thừa)`
                      : `-${formatVND(Math.abs(diff))} (thiếu)`}
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor={noteInputId} className="text-sm font-medium">
                Ghi chú
              </Label>
              <Textarea
                id={noteInputId}
                placeholder="Lý do chênh lệch hoặc ghi chú bàn giao..."
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer cố định */}
        <DialogFooter className="border-t border-border px-5 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={closeSession.isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={closeSession.isPending || endingCashActual === ''}
          >
            {closeSession.isPending ? 'Đang đóng ca...' : 'Đóng ca'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
