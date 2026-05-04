import { useMemo, useState } from 'react';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useBranches } from '@modules/branch/hooks/useBranches';
import { PERMISSIONS } from '@shared/constants/permissions';
import { useDebounce } from '@shared/hooks/useDebounce';
import { usePermission } from '@shared/hooks/usePermission';
import { useCreateExpense } from './useCreateExpense';
import { useDeleteExpense } from './useDeleteExpense';
import { useExpenses } from './useExpenses';
import { useUpdateExpense } from './useUpdateExpense';
import type {
  ExpenseFilters,
  ExpenseItem,
  ExpensePageResponse,
  ExpenseRequest,
} from '../types/expense.types';

const EXPENSE_PAGE_SIZE = 10;

const EMPTY_EXPENSE_PAGE: ExpensePageResponse<ExpenseItem> = {
  content: [],
  page: 0,
  size: EXPENSE_PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
};

/**
 * Hook điều phối toàn bộ state và mutation của màn hình chi tiêu.
 *
 * @param loadExpenseList - Bật/tắt query danh sách phiếu chi khi màn chỉ cần mutation/dialog
 */
export const useExpenseManagement = (loadExpenseList: boolean = true) => {
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const { data: branchList = [] } = useBranches();
  const { can, isOwner } = usePermission();
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const [categoryKeyword, setCategoryKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseItem | null>(null);

  const debouncedCategoryKeyword = useDebounce(categoryKeyword.trim(), 300);
  const canViewExpenses = can(PERMISSIONS.EXPENSE_VIEW) || can(PERMISSIONS.EXPENSE_MANAGE);
  const canManageExpenses = can(PERMISSIONS.EXPENSE_MANAGE);

  const filters = useMemo<ExpenseFilters>(() => {
    return {
      categoryName: debouncedCategoryKeyword || undefined,
      page: currentPage,
      size: EXPENSE_PAGE_SIZE,
    };
  }, [currentPage, debouncedCategoryKeyword]);

  const {
    data: expensePage = EMPTY_EXPENSE_PAGE,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useExpenses(filters, loadExpenseList && Boolean(currentBranchId) && canViewExpenses);

  const currentBranchName = useMemo(() => {
    if (!currentBranchId) {
      return null;
    }

    return branchList.find((branch) => branch.id === currentBranchId)?.name ?? 'Chi nhánh đang chọn';
  }, [branchList, currentBranchId]);

  const branchRequiredMessage = isOwner
    ? 'Hãy chọn một chi nhánh cụ thể ở thanh điều hướng trước khi xem hoặc tạo phiếu chi. Backend hiện đang scope module chi tiêu theo branch context hiện tại.'
    : 'Phiên làm việc hiện chưa có chi nhánh hợp lệ để truy cập module chi tiêu.';

  const emptyMessage = debouncedCategoryKeyword
    ? 'Không tìm thấy phiếu chi nào khớp danh mục đang lọc.'
    : 'Chưa có phiếu chi nào ở chi nhánh đang chọn.';

  const openCreateDialog = () => {
    if (!canManageExpenses || !currentBranchId) {
      return;
    }

    setEditingExpense(null);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (expense: ExpenseItem) => {
    if (!canManageExpenses) {
      return;
    }

    setEditingExpense(expense);
    setIsFormDialogOpen(true);
  };

  const openDeleteDialog = (expense: ExpenseItem) => {
    if (!canManageExpenses) {
      return;
    }

    setDeletingExpense(expense);
  };

  const closeDeleteDialog = () => {
    setDeletingExpense(null);
  };

  const closeFormDialog = (nextOpen: boolean) => {
    setIsFormDialogOpen(nextOpen);

    if (!nextOpen) {
      // Reset record đang sửa để lần mở sau không bị giữ dữ liệu cũ.
      setEditingExpense(null);
    }
  };

  const submitExpense = (payload: ExpenseRequest) => {
    if (editingExpense) {
      updateExpenseMutation.mutate(
        {
          id: editingExpense.id,
          payload,
        },
        {
          onSuccess: () => {
            setIsFormDialogOpen(false);
            setEditingExpense(null);
          },
        }
      );
      return;
    }

    createExpenseMutation.mutate(payload, {
      onSuccess: () => {
        setIsFormDialogOpen(false);
      },
    });
  };

  const confirmDeleteExpense = () => {
    if (!deletingExpense) {
      return;
    }

    deleteExpenseMutation.mutate(deletingExpense.id, {
      onSuccess: () => {
        setDeletingExpense(null);
      },
    });
  };

  const handleCategoryKeywordChange = (value: string) => {
    setCategoryKeyword(value);
    setCurrentPage(0);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return {
    currentBranchId,
    currentBranchName,
    branchRequiredMessage,
    categoryKeyword,
    setCategoryKeyword: handleCategoryKeywordChange,
    currentPage: expensePage.page,
    totalPages: expensePage.totalPages,
    totalElements: expensePage.totalElements,
    expenses: expensePage.content,
    canViewExpenses,
    canManageExpenses,
    emptyMessage,
    isLoading,
    isError,
    isFetching,
    refetch,
    isFormDialogOpen,
    editingExpense,
    deletingExpense,
    isSubmittingExpense: createExpenseMutation.isPending || updateExpenseMutation.isPending,
    isDeletingExpense: deleteExpenseMutation.isPending,
    openCreateDialog,
    openEditDialog,
    closeFormDialog,
    submitExpense,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDeleteExpense,
    setCurrentPage: goToPage,
  };
};
