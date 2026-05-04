import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@shared/components/ui/button';

interface TablePaginationProps {
  /** Trang hiện tại (0-indexed) */
  page: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

/**
 * Component phân trang dùng chung cho các bảng trong report dashboard.
 * Hiển thị: nút Trước / thông tin trang / nút Sau.
 */
export const TablePagination = ({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  isLoading = false,
}: TablePaginationProps) => {
  if (totalPages <= 1) return null;

  // Chỉ số bản ghi đầu và cuối của trang hiện tại (1-indexed để hiển thị)
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalElements);

  return (
    <div className="flex items-center justify-between border-t border-border px-5 py-3">
      <p className="text-xs text-text-secondary">
        {from}–{to} / {totalElements} bản ghi
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => { onPageChange(page - 1); }}
          disabled={page === 0 || isLoading}
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[72px] text-center text-xs font-medium text-text-primary">
          Trang {page + 1} / {totalPages}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => { onPageChange(page + 1); }}
          disabled={page >= totalPages - 1 || isLoading}
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
