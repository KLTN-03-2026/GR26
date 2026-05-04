import { useMemo, useState } from 'react';
import { CalendarDays, CreditCard, Eye, Plus, ReceiptText, RefreshCcw, Wallet, type LucideIcon } from 'lucide-react';
import { useFinancialInvoices } from '@modules/report/hooks/useRevenueReport';
import type { FinancialInvoiceItem, FinancialInvoiceType } from '@modules/report/types/report.types';
import { DeleteExpenseDialog } from '@modules/expense/components/DeleteExpenseDialog';
import { ExpenseFormDialog } from '@modules/expense/components/ExpenseFormDialog';
import { useExpenseManagement } from '@modules/expense/hooks/useExpenseManagement';
import { InvoiceDetailDialog } from '@modules/payment/components/InvoiceDetailDialog';
import { Button } from '@shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { PERMISSIONS } from '@shared/constants/permissions';
import { usePermission } from '@shared/hooks/usePermission';
import { cn } from '@shared/utils/cn';
import { formatVND } from '@shared/utils/formatCurrency';
import { formatDateTime } from '@shared/utils/formatDate';

const LEDGER_PAGE_SIZE = 20;

const TRANSACTION_TYPE_OPTIONS: Array<{ value: FinancialInvoiceType; label: string; icon: LucideIcon }> = [
  { value: 'ALL', label: 'Tất cả', icon: Wallet },
  { value: 'INCOME', label: 'Thu', icon: CreditCard },
  { value: 'EXPENSE', label: 'Chi', icon: ReceiptText },
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  TRANSFER: 'Chuyển khoản',
  QR_CODE: 'QR',
  VIETQR: 'VietQR',
  MOMO: 'MoMo',
  ZALOPAY: 'ZaloPay',
};

const getTodayInputValue = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${date}`;
};

const getPaymentMethodLabel = (method: string | null): string => {
  if (!method) {
    return 'Chưa xác định';
  }

  return PAYMENT_METHOD_LABELS[method] ?? method;
};

/**
 * Container dùng chung cho màn thu chi.
 * Danh sách chính dùng API báo cáo tổng hợp để phân trang đúng cho cả Thu và Chi.
 */
export const FinanceManagementContent = () => {
  const expenseManagement = useExpenseManagement(false);
  const { can, isOwner } = usePermission();
  const [transactionType, setTransactionType] = useState<FinancialInvoiceType>('ALL');
  const [startDate, setStartDate] = useState(() => getTodayInputValue());
  const [endDate, setEndDate] = useState(() => getTodayInputValue());
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedIncomeInvoiceId, setSelectedIncomeInvoiceId] = useState<string | null>(null);

  const canViewIncome = can(PERMISSIONS.PAYMENT_VIEW) || can(PERMISSIONS.PAYMENT_CREATE) || can(PERMISSIONS.PAYMENT_PROCESS);
  const canViewExpense = expenseManagement.canViewExpenses;
  const currentBranchId = expenseManagement.currentBranchId;
  const currentBranchName = expenseManagement.currentBranchName;

  const availableTypes = useMemo(() => {
    if (canViewIncome && canViewExpense) {
      return TRANSACTION_TYPE_OPTIONS;
    }

    if (canViewIncome) {
      return TRANSACTION_TYPE_OPTIONS.filter((option) => option.value === 'INCOME');
    }

    if (canViewExpense) {
      return TRANSACTION_TYPE_OPTIONS.filter((option) => option.value === 'EXPENSE');
    }

    return [];
  }, [canViewExpense, canViewIncome]);

  const resolvedTransactionType = availableTypes.some((option) => option.value === transactionType)
    ? transactionType
    : availableTypes[0]?.value ?? 'ALL';

  const financialInvoicesQuery = useFinancialInvoices(
    currentBranchId && availableTypes.length > 0
      ? {
          branchId: currentBranchId,
          startDate,
          endDate,
          type: resolvedTransactionType,
          page: currentPage,
          size: LEDGER_PAGE_SIZE,
        }
      : undefined,
  );

  const ledgerItems = financialInvoicesQuery.data?.content ?? [];
  const totalElements = financialInvoicesQuery.data?.totalElements ?? 0;
  const totalPages = financialInvoicesQuery.data?.totalPages ?? 0;
  const incomeOnPage = ledgerItems
    .filter((item) => item.type === 'INCOME')
    .reduce((sum, item) => sum + item.amount, 0);
  const expenseOnPage = ledgerItems
    .filter((item) => item.type === 'EXPENSE')
    .reduce((sum, item) => sum + item.amount, 0);

  const branchRequiredMessage = isOwner
    ? 'Hãy chọn một chi nhánh cụ thể ở thanh điều hướng trước khi xem hoặc thao tác thu chi.'
    : 'Phiên làm việc hiện chưa có chi nhánh hợp lệ để truy cập màn thu chi.';

  const handleTransactionTypeChange = (nextType: FinancialInvoiceType) => {
    setTransactionType(nextType);
    setCurrentPage(0);
  };

  const handleStartDateChange = (nextDate: string) => {
    setStartDate(nextDate);
    setCurrentPage(0);
  };

  const handleEndDateChange = (nextDate: string) => {
    setEndDate(nextDate);
    setCurrentPage(0);
  };

  const openIncomeInvoiceDetail = (item: FinancialInvoiceItem) => {
    if (item.type !== 'INCOME') {
      return;
    }

    setSelectedIncomeInvoiceId(item.id);
  };

  const closeIncomeInvoiceDetail = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedIncomeInvoiceId(null);
    }
  };

  if (availableTypes.length === 0) {
    return (
      <section className="rounded-card border border-dashed border-border bg-card p-8 shadow-card">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Thu chi chi nhánh</p>
          <h2 className="mt-3 text-2xl font-bold text-text-primary">Bạn chưa có quyền truy cập màn này</h2>
          <p className="mt-3 text-base leading-7 text-text-secondary">
            Tài khoản hiện tại chưa có quyền xem hóa đơn thu hoặc phiếu chi của chi nhánh.
          </p>
        </div>
      </section>
    );
  }

  if (!currentBranchId) {
    return (
      <section className="rounded-card border border-dashed border-border bg-card p-8 shadow-card">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Thu chi theo chi nhánh</p>
          <h2 className="mt-3 text-2xl font-bold text-text-primary">Chọn chi nhánh trước khi làm việc</h2>
          <p className="mt-3 text-base leading-7 text-text-secondary">{branchRequiredMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Wallet className="h-3.5 w-3.5" />
            Tài chính chi nhánh
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Danh sách hoá đơn thu chi</h1>
        </div>

        {expenseManagement.canManageExpenses ? (
          <Button onClick={expenseManagement.openCreateDialog}>
            <Plus className="h-4 w-4" />
            Tạo phiếu chi
          </Button>
        ) : null}
      </div>

      <section className="space-y-4 rounded-card border border-border bg-card p-4 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="inline-flex rounded-full border border-border bg-slate-100 p-1">
            {availableTypes.map((option) => {
              const Icon = option.icon;
              const isActive = resolvedTransactionType === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleTransactionTypeChange(option.value)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-text-secondary">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Từ ngày
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => handleStartDateChange(event.target.value)}
                className="h-10 rounded-md border border-border bg-white px-3 text-sm text-text-primary"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-text-secondary">
              <span>Đến ngày</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => handleEndDateChange(event.target.value)}
                className="h-10 rounded-md border border-border bg-white px-3 text-sm text-text-primary"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-card border border-border bg-white p-4 shadow-card">
            <p className="text-sm text-text-secondary">Chi nhánh đang làm việc</p>
            <p className="mt-2 text-lg font-semibold text-text-primary">{currentBranchName ?? 'Chưa xác định'}</p>
          </div>
          <div className="rounded-card border border-border bg-white p-4 shadow-card">
            <p className="text-sm text-text-secondary">Tổng giao dịch</p>
            <p className="mt-2 text-lg font-semibold text-text-primary">{totalElements}</p>
          </div>
          <div className="rounded-card border border-border bg-white p-4 shadow-card">
            <p className="text-sm text-text-secondary">Thu trên trang</p>
            <p className="mt-2 text-lg font-semibold text-success-text">{formatVND(incomeOnPage)}</p>
          </div>
          <div className="rounded-card border border-border bg-white p-4 shadow-card">
            <p className="text-sm text-text-secondary">Chi trên trang</p>
            <p className="mt-2 text-lg font-semibold text-danger-text">{formatVND(expenseOnPage)}</p>
          </div>
        </div>

        {financialInvoicesQuery.isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="spinner spinner-md" />
          </div>
        ) : financialInvoicesQuery.isError ? (
          <section className="rounded-card border border-border bg-card p-8 text-center shadow-card">
            <Wallet className="mx-auto h-12 w-12 text-red-300" />
            <h2 className="mt-4 text-lg font-semibold text-text-primary">Không thể tải dữ liệu thu chi</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Hệ thống chưa lấy được sổ thu chi của chi nhánh hiện tại. Vui lòng thử lại.
            </p>
            <Button className="mt-5" onClick={() => void financialInvoicesQuery.refetch()}>
              <RefreshCcw className="h-4 w-4" />
              Tải lại
            </Button>
          </section>
        ) : ledgerItems.length === 0 ? (
          <section className="rounded-card border border-dashed border-border bg-card px-6 py-10 text-center shadow-card">
            <h2 className="text-lg font-semibold text-text-primary">Chưa có dữ liệu thu chi</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">Khoảng ngày đang chọn chưa có giao dịch phù hợp.</p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-card border border-border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại</TableHead>
                  <TableHead>Mã / Mô tả</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead className="w-[150px] text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerItems.map((item) => {
                  const isIncome = item.type === 'INCOME';

                  return (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell>
                        <span className={cn('badge', isIncome ? 'badge-success' : 'badge-cancelled')}>
                          {isIncome ? 'Thu' : 'Chi'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-text-primary">{item.referenceCode ?? 'Chưa có mã'}</p>
                        {item.description ? (
                          <p className="mt-0.5 text-xs text-text-secondary">{item.description}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>{getPaymentMethodLabel(item.paymentMethod)}</TableCell>
                      <TableCell>{item.transactionDate ? formatDateTime(item.transactionDate) : 'Chưa xác định'}</TableCell>
                      <TableCell className={cn('text-right font-semibold', isIncome ? 'text-success-text' : 'text-danger-text')}>
                        {isIncome ? '+' : '-'}{formatVND(item.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          {isIncome ? (
                            <Button variant="ghost" size="sm" onClick={() => openIncomeInvoiceDetail(item)}>
                              <Eye className="h-4 w-4" />
                              Chi tiết
                            </Button>
                          ) : (
                            <span className="text-xs text-text-secondary">Phiếu chi</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-text-secondary md:flex-row md:items-center md:justify-between">
              <p>
                Hiển thị {ledgerItems.length} / {totalElements} giao dịch
              </p>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
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
                  onClick={() => setCurrentPage(Math.min(Math.max(totalPages - 1, 0), currentPage + 1))}
                  disabled={totalPages === 0 || currentPage >= totalPages - 1}
                >
                  Sau
                </Button>
              </div>
            </div>
          </section>
        )}
      </section>

      <ExpenseFormDialog
        open={expenseManagement.isFormDialogOpen}
        onOpenChange={expenseManagement.closeFormDialog}
        initialExpense={expenseManagement.editingExpense}
        branchName={currentBranchName}
        isPending={expenseManagement.isSubmittingExpense}
        onSubmit={expenseManagement.submitExpense}
      />

      <DeleteExpenseDialog
        open={Boolean(expenseManagement.deletingExpense)}
        onOpenChange={expenseManagement.closeDeleteDialog}
        expense={expenseManagement.deletingExpense}
        isPending={expenseManagement.isDeletingExpense}
        onConfirm={expenseManagement.confirmDeleteExpense}
      />

      <InvoiceDetailDialog
        open={Boolean(selectedIncomeInvoiceId)}
        invoiceId={selectedIncomeInvoiceId}
        onOpenChange={closeIncomeInvoiceDetail}
      />
    </div>
  );
};
