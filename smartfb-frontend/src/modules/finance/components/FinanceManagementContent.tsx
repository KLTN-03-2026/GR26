import { useMemo, useState } from 'react';
import { CreditCard, ReceiptText, Wallet } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';
import { useExpenseManagement } from '@modules/expense/hooks/useExpenseManagement';
import { DeleteExpenseDialog } from '@modules/expense/components/DeleteExpenseDialog';
import { ExpenseFilterBar } from '@modules/expense/components/ExpenseFilterBar';
import { ExpenseFormDialog } from '@modules/expense/components/ExpenseFormDialog';
import { ExpenseTable } from '@modules/expense/components/ExpenseTable';
import { InvoiceDetailDialog } from '@modules/payment/components/InvoiceDetailDialog';
import { InvoiceFilterBar } from '@modules/payment/components/InvoiceFilterBar';
import { InvoiceTable } from '@modules/payment/components/InvoiceTable';
import { useInvoiceManagement } from '@modules/payment/hooks/useInvoiceManagement';
import { usePermission } from '@shared/hooks/usePermission';

type FinanceView = 'income' | 'expense';

/**
 * Container dùng chung cho màn thu chi.
 * Gom hai luồng tra cứu hóa đơn thu và quản lý phiếu chi vào cùng một page theo branch hiện tại.
 */
export const FinanceManagementContent = () => {
  const expenseManagement = useExpenseManagement();
  const invoiceManagement = useInvoiceManagement();
  const { isOwner } = usePermission();
  const [activeView, setActiveView] = useState<FinanceView>('income');

  const availableViews = useMemo<FinanceView[]>(() => {
    const views: FinanceView[] = [];

    if (invoiceManagement.canViewInvoices) {
      views.push('income');
    }

    if (expenseManagement.canViewExpenses) {
      views.push('expense');
    }

    return views;
  }, [expenseManagement.canViewExpenses, invoiceManagement.canViewInvoices]);

  const currentBranchId = expenseManagement.currentBranchId;
  const currentBranchName = expenseManagement.currentBranchName;
  const resolvedActiveView = availableViews.includes(activeView) ? activeView : availableViews[0] ?? 'income';
  const isIncomeView = resolvedActiveView === 'income';
  const activeSummaryLabel = isIncomeView ? 'Tổng hóa đơn thu' : 'Tổng phiếu chi';
  const activeTotal = isIncomeView ? invoiceManagement.totalItems : expenseManagement.totalElements;
  const isActiveFetching = isIncomeView ? invoiceManagement.isFetching : expenseManagement.isFetching;
  const isActiveLoading = isIncomeView ? invoiceManagement.isLoading : expenseManagement.isLoading;
  const isActiveError = isIncomeView ? invoiceManagement.isError : expenseManagement.isError;

  const branchRequiredMessage = isOwner
    ? 'Hãy chọn một chi nhánh cụ thể ở thanh điều hướng trước khi xem hoặc thao tác thu chi. C'
    : 'Phiên làm việc hiện chưa có chi nhánh hợp lệ để truy cập màn thu chi.';

  const handleRefetch = () => {
    if (isIncomeView) {
      void invoiceManagement.refetch();
      return;
    }

    void expenseManagement.refetch();
  };

  if (availableViews.length === 0) {
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

  if (isActiveLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner spinner-md" />
      </div>
    );
  }

  if (isActiveError) {
    return (
      <section className="rounded-card border border-border bg-card p-8 text-center shadow-card">
        <Wallet className="mx-auto h-12 w-12 text-red-300" />
        <h2 className="mt-4 text-lg font-semibold text-text-primary">Không thể tải dữ liệu thu chi</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Hệ thống chưa lấy được dữ liệu của chi nhánh hiện tại. Vui lòng thử lại.
        </p>
        <Button className="mt-5" onClick={handleRefetch}>
          Tải lại
        </Button>
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
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Danh sách hoá đơn thu chi</h1>
         
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-card border border-border bg-card p-4 shadow-card">
        {availableViews.length > 1 ? (
          <div className="inline-flex rounded-full border border-border bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveView('income')}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                resolvedActiveView === 'income'
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              <CreditCard className="h-4 w-4" />
              Hóa đơn thu
            </button>
            <button
              type="button"
              onClick={() => setActiveView('expense')}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                resolvedActiveView === 'expense'
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              <ReceiptText className="h-4 w-4" />
              Phiếu chi
            </button>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-card border border-border bg-white p-4 shadow-card">
            <p className="text-sm text-text-secondary">Chi nhánh đang làm việc</p>
            <p className="mt-2 text-lg font-semibold text-text-primary">{currentBranchName ?? 'Chưa xác định'}</p>
          </div>
          <div className="rounded-card border border-border bg-white p-4 shadow-card">
            <p className="text-sm text-text-secondary">{activeSummaryLabel}</p>
            <p className="mt-2 text-lg font-semibold text-text-primary">{activeTotal}</p>
          </div>
          <div className="rounded-card border border-border bg-white p-4 shadow-card">
            <p className="text-sm text-text-secondary">Trạng thái dữ liệu</p>
            <p className="mt-2 text-lg font-semibold text-text-primary">
              {isActiveFetching ? 'Đang đồng bộ...' : 'Đã đồng bộ'}
            </p>
          </div>
        </div>

        {isIncomeView ? (
          <div className="space-y-4">
            <InvoiceFilterBar
              invoiceKeyword={invoiceManagement.invoiceKeyword}
              onInvoiceKeywordChange={invoiceManagement.setInvoiceKeyword}
            />

            <InvoiceTable
              invoices={invoiceManagement.invoices}
              currentPage={invoiceManagement.currentPage}
              totalPages={invoiceManagement.totalPages}
              totalItems={invoiceManagement.totalItems}
              emptyMessage={invoiceManagement.emptyMessage}
              onViewInvoice={invoiceManagement.openInvoiceDetail}
              onPageChange={invoiceManagement.setCurrentPage}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <ExpenseFilterBar
              categoryKeyword={expenseManagement.categoryKeyword}
              onCategoryKeywordChange={expenseManagement.setCategoryKeyword}
              onCreateExpense={expenseManagement.openCreateDialog}
              canManageExpenses={expenseManagement.canManageExpenses}
              isCreateDisabled={!currentBranchId}
            />

            <ExpenseTable
              expenses={expenseManagement.expenses}
              currentPage={expenseManagement.currentPage}
              totalPages={expenseManagement.totalPages}
              totalElements={expenseManagement.totalElements}
              canManageExpenses={expenseManagement.canManageExpenses}
              emptyMessage={expenseManagement.emptyMessage}
              onEditExpense={expenseManagement.openEditDialog}
              onDeleteExpense={expenseManagement.openDeleteDialog}
              onPageChange={expenseManagement.setCurrentPage}
            />
          </div>
        )}
      </div>

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
        open={invoiceManagement.isInvoiceDetailOpen}
        invoiceId={invoiceManagement.selectedInvoiceId}
        onOpenChange={invoiceManagement.closeInvoiceDetail}
      />
    </div>
  );
};
