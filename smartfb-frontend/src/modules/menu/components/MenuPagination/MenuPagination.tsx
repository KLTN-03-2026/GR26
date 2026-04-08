import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';

interface MenuPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Pagination component với smart ellipsis
 * Pattern: 1 ... 4 5 [6] 7 8 ... 10
 */
export const MenuPagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: MenuPaginationProps) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers với ellipsis
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showPages = 5; // Số lượng page hiển thị tối đa

    if (totalPages <= showPages) {
      // Hiển thị tất cả pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Luôn hiển thị page đầu
      pages.push(1);

      if (currentPage <= 3) {
        // Gần đầu
        for (let i = 2; i <= 4; i++) pages.push(i);
        if (totalPages > 5) pages.push('ellipsis');
      } else if (currentPage >= totalPages - 2) {
        // Gần cuối
        if (totalPages > 5) pages.push('ellipsis');
        for (let i = totalPages - 3; i < totalPages; i++) pages.push(i);
      } else {
        // Ở giữa
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('ellipsis');
      }

      // Luôn hiển thị page cuối
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={cn('rounded-2xl border border-amber-100 bg-white px-4 py-3 shadow-sm', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Item count info */}
        <div className="text-sm text-gray-500">
          Hiển thị <span className="font-medium">{startItem}</span> -{' '}
          <span className="font-medium">{endItem}</span> trên{' '}
          <span className="font-medium">{totalItems}</span>
        </div>

        {/* Pagination mobile */}
        <div className="flex items-center justify-between gap-2 sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-9 min-w-0 flex-1"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Trước
          </Button>
          <div className="min-w-[88px] text-center text-sm font-medium text-gray-700">
            {currentPage} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-9 min-w-0 flex-1"
          >
            Sau
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {/* Pagination desktop/tablet */}
        <div className="hidden items-center gap-1 sm:flex">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pageNumbers.map((page, index) =>
            page === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-gray-400"
              >
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                className={cn(
                  'h-8 w-8 p-0',
                  currentPage === page
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : ''
                )}
              >
                {page}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
