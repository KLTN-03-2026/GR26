import { formatDateTime } from '@shared/utils/formatDate';
import { formatVND } from '@shared/utils/formatCurrency';
import { Button } from '@shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import type { ExpenseItem, ExpensePaymentMethod } from '../types/expense.types';

interface ExpenseTableProps {
  expenses: ExpenseItem[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  canManageExpenses: boolean;
  emptyMessage: string;
  onEditExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (expense: ExpenseItem) => void;
  onPageChange: (page: number) => void;
}

const PAYMENT_METHOD_LABELS: Record<ExpensePaymentMethod, string> = {
  CASH: 'Tiền mặt',
  TRANSFER: 'Chuyển khoản',
  QR_CODE: 'QR',
};

const formatCreatedBy = (createdBy: string): string => {
  return createdBy ? createdBy.slice(0, 8).toUpperCase() : 'N/A';
};

/**
 * Bảng danh sách phiếu chi.
 */
export const ExpenseTable = ({
  expenses,
  currentPage,
  totalPages,
  totalElements,
  canManageExpenses,
  emptyMessage,
  onEditExpense,
  onDeleteExpense,
  onPageChange,
}: ExpenseTableProps) => {
  if (expenses.length === 0) {
    return (
      <section className="rounded-card border border-dashed border-border bg-card px-6 py-10 text-center shadow-card">
        <h2 className="text-lg font-semibold text-text-primary">Chưa có dữ liệu chi tiêu</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-card border border-border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Danh mục</TableHead>
            <TableHead>Số tiền</TableHead>
            <TableHead>Phương thức</TableHead>
            <TableHead>Ngày chi</TableHead>
            <TableHead>Người tạo</TableHead>
            <TableHead>Thời gian tạo</TableHead>
            {canManageExpenses ? <TableHead className="w-[160px] text-right">Thao tác</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-semibold text-text-primary">{expense.categoryName}</p>
                  <p className="text-xs leading-5 text-text-secondary">
                    {expense.description?.trim() || 'Không có ghi chú'}
                  </p>
                </div>
              </TableCell>
              <TableCell className="font-semibold text-text-primary">{formatVND(expense.amount)}</TableCell>
              <TableCell>{PAYMENT_METHOD_LABELS[expense.paymentMethod]}</TableCell>
              <TableCell>{formatDateTime(expense.expenseDate)}</TableCell>
              <TableCell>{formatCreatedBy(expense.createdByName)}</TableCell>
              <TableCell>{formatDateTime(expense.createdAt)}</TableCell>
              {canManageExpenses ? (
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEditExpense(expense)}>
                      Sửa
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDeleteExpense(expense)}>
                      Xóa
                    </Button>
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-text-secondary md:flex-row md:items-center md:justify-between">
        <p>
          Hiển thị {expenses.length} / {totalElements} phiếu chi
        </p>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage <= 0}
          >
            Trước
          </Button>
          <span className="min-w-[96px] text-center text-text-primary">
            Trang {currentPage + 1} / {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(Math.max(totalPages - 1, 0), currentPage + 1))}
            disabled={totalPages === 0 || currentPage >= totalPages - 1}
          >
            Sau
          </Button>
        </div>
      </div>
    </section>
  );
};
