import { type FC } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StaffTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
}

/**
 * Tạo array các page numbers với ellipsis
 * Pattern: 1 ... 4 5 [6] 7 8 ... 10
 */
const getPageNumbers = (currentPage: number, totalPages: number): (number | string)[] => {
  const pages: (number | string)[] = [];
  const maxVisible = 7;

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  pages.push(1);

  if (currentPage > 3) {
    pages.push('...');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push('...');
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
};

/**
 * Pagination component cho StaffTable với smart ellipsis
 */
export const StaffTablePagination: FC<StaffTablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems = 0,
  onPageChange,
}) => {
  const endIndex = Math.min(10 * currentPage, totalItems);
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * 10 + 1;

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">
        Hiển thị {startIndex}-{endIndex} trên {totalItems}
      </p>

      <div className="flex gap-1">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="btn-ghost px-3 py-2 rounded-lg enabled:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageNumbers.map((page, idx) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 py-2 text-gray-400">
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'btn-ghost hover:bg-gray-100 text-gray-700'
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="btn-ghost px-3 py-2 rounded-lg enabled:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
