import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { cn } from '@shared/utils/cn';

interface OrderManagementPaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  pageSizeOptions: readonly number[];
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

type PageToken =
  | {
      type: 'page';
      value: number;
    }
  | {
      type: 'ellipsis';
      position: 'start' | 'end';
    };

/**
 * Số nút trang tối đa để thanh phân trang không bị vỡ layout trên desktop.
 */
const MAX_VISIBLE_PAGE_BUTTONS = 7;

const getPageTokens = (currentPage: number, totalPages: number): PageToken[] => {
  if (totalPages <= MAX_VISIBLE_PAGE_BUTTONS) {
    return Array.from({ length: totalPages }, (_, offset) => ({
      type: 'page',
      value: offset + 1,
    }));
  }

  const tokens: PageToken[] = [{ type: 'page', value: 1 }];
  let startPage = Math.max(2, currentPage - 1);
  let endPage = Math.min(totalPages - 1, currentPage + 1);

  if (currentPage <= 4) {
    startPage = 2;
    endPage = 5;
  }

  if (currentPage >= totalPages - 3) {
    startPage = totalPages - 4;
    endPage = totalPages - 1;
  }

  if (startPage > 2) {
    tokens.push({ type: 'ellipsis', position: 'start' });
  }

  for (let page = startPage; page <= endPage; page += 1) {
    tokens.push({ type: 'page', value: page });
  }

  if (endPage < totalPages - 1) {
    tokens.push({ type: 'ellipsis', position: 'end' });
  }

  tokens.push({ type: 'page', value: totalPages });

  return tokens;
};

export const OrderManagementPagination = ({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  pageSizeOptions,
  isFetching = false,
  onPageChange,
  onPageSizeChange,
}: OrderManagementPaginationProps) => {
  const normalizedTotalPages = Math.max(totalPages, 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), normalizedTotalPages);
  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);
  const pageTokens = getPageTokens(safeCurrentPage, normalizedTotalPages);
  const isPreviousDisabled = safeCurrentPage <= 1 || isFetching;
  const isNextDisabled = safeCurrentPage >= normalizedTotalPages || isFetching;

  const handlePageSizeChange = (value: string) => {
    const nextPageSize = Number(value);

    if (!Number.isNaN(nextPageSize)) {
      onPageSizeChange(nextPageSize);
    }
  };

  return (
    <div className="rounded-[28px] border border-slate-100 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-start">
          <p className="text-sm font-medium text-slate-500">
            Hiển thị <span className="font-black text-slate-800">{startItem}</span>-
            <span className="font-black text-slate-800">{endItem}</span> trên{' '}
            <span className="font-black text-slate-800">
              {totalItems.toLocaleString('vi-VN')}
            </span>{' '}
            đơn hàng
          </p>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Dòng/trang</span>
            <Select
              value={String(pageSize)}
              onValueChange={handlePageSizeChange}
              disabled={isFetching}
            >
              <SelectTrigger className="h-10 w-[92px] rounded-xl border-slate-200 bg-slate-50 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={isPreviousDisabled}
            className="h-10 min-w-0 flex-1 rounded-xl border-slate-200"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Trước
          </Button>
          <span className="min-w-[88px] text-center text-sm font-black text-slate-700">
            {safeCurrentPage} / {normalizedTotalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={isNextDisabled}
            className="h-10 min-w-0 flex-1 rounded-xl border-slate-200"
          >
            Sau
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="hidden items-center gap-1 sm:flex">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={isPreviousDisabled}
            className="h-10 w-10 rounded-xl border-slate-200"
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pageTokens.map((token) => {
            if (token.type === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${token.position}`}
                  className="flex h-10 w-8 items-center justify-center text-sm font-bold text-slate-400"
                >
                  ...
                </span>
              );
            }

            const isActive = safeCurrentPage === token.value;

            return (
              <Button
                key={token.value}
                variant={isActive ? 'default' : 'outline'}
                size="icon"
                onClick={() => onPageChange(token.value)}
                disabled={isFetching}
                className={cn(
                  'h-10 w-10 rounded-xl border-slate-200 font-black',
                  isActive && 'bg-orange-500 text-white hover:bg-orange-500'
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Đến trang ${token.value}`}
              >
                {token.value}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={isNextDisabled}
            className="h-10 w-10 rounded-xl border-slate-200"
            aria-label="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
