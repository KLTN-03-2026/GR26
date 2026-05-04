import { ReceiptText } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { ExpenseFilterBar } from './ExpenseFilterBar';
import { ExpenseFormDialog } from './ExpenseFormDialog';
import { ExpenseTable } from './ExpenseTable';
import { DeleteExpenseDialog } from './DeleteExpenseDialog';
import { useExpenseManagement } from '../hooks/useExpenseManagement';

/**
 * Container chính của module chi tiêu.
 * Page chỉ render component này để giữ logic nghiệp vụ trong module.
 */
export const ExpenseManagementContent = () => {
  const {
    currentBranchId,
    currentBranchName,
    branchRequiredMessage,
    categoryKeyword,
    setCategoryKeyword,
    currentPage,
    totalPages,
    totalElements,
    expenses,
    canManageExpenses,
    emptyMessage,
    isLoading,
    isError,
    isFetching,
    refetch,
    isFormDialogOpen,
    editingExpense,
    deletingExpense,
    isSubmittingExpense,
    isDeletingExpense,
    openCreateDialog,
    openEditDialog,
    closeFormDialog,
    submitExpense,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDeleteExpense,
    setCurrentPage,
  } = useExpenseManagement();

  if (!currentBranchId) {
    return (
      <section className="rounded-card border border-dashed border-border bg-card p-8 shadow-card">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Chi tiêu theo chi nhánh</p>
          <h2 className="mt-3 text-2xl font-bold text-text-primary">Chọn chi nhánh trước khi làm việc</h2>
          <p className="mt-3 text-base leading-7 text-text-secondary">{branchRequiredMessage}</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner spinner-md" />
      </div>
    );
  }

  if (isError) {
    return (
      <section className="rounded-card border border-border bg-card p-8 text-center shadow-card">
        <ReceiptText className="mx-auto h-12 w-12 text-red-300" />
        <h2 className="mt-4 text-lg font-semibold text-text-primary">Không thể tải phiếu chi</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Hệ thống chưa lấy được dữ liệu chi tiêu của chi nhánh hiện tại. Vui lòng thử lại.
        </p>
        <Button className="mt-5" onClick={() => void refetch()}>
          Tải lại
        </Button>
      </section>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-card border border-border bg-card p-4 shadow-card">
          <p className="text-sm text-text-secondary">Chi nhánh đang làm việc</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">{currentBranchName ?? 'Chưa xác định'}</p>
        </div>
        <div className="rounded-card border border-border bg-card p-4 shadow-card">
          <p className="text-sm text-text-secondary">Tổng phiếu chi</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">{totalElements}</p>
        </div>
        <div className="rounded-card border border-border bg-card p-4 shadow-card">
          <p className="text-sm text-text-secondary">Trạng thái dữ liệu</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">
            {isFetching ? 'Đang đồng bộ...' : 'Đã đồng bộ'}
          </p>
        </div>
      </div>

      <ExpenseFilterBar
        categoryKeyword={categoryKeyword}
        onCategoryKeywordChange={setCategoryKeyword}
        onCreateExpense={openCreateDialog}
        canManageExpenses={canManageExpenses}
        isCreateDisabled={!currentBranchId}
      />

      <ExpenseTable
        expenses={expenses}
        currentPage={currentPage}
        totalPages={totalPages}
        totalElements={totalElements}
        canManageExpenses={canManageExpenses}
        emptyMessage={emptyMessage}
        onEditExpense={openEditDialog}
        onDeleteExpense={openDeleteDialog}
        onPageChange={setCurrentPage}
      />

      <ExpenseFormDialog
        open={isFormDialogOpen}
        onOpenChange={closeFormDialog}
        initialExpense={editingExpense}
        branchName={currentBranchName}
        isPending={isSubmittingExpense}
        onSubmit={submitExpense}
      />

      <DeleteExpenseDialog
        open={Boolean(deletingExpense)}
        onOpenChange={closeDeleteDialog}
        expense={deletingExpense}
        isPending={isDeletingExpense}
        onConfirm={confirmDeleteExpense}
      />
    </div>
  );
};
