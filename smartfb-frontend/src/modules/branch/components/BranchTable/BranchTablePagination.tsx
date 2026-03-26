import { type FC } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BranchTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination component cho BranchTable
 */
export const BranchTablePagination: FC<BranchTablePaginationProps> = ({
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

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">
        Hiển thị {startIndex}-{endIndex} trên {totalItems}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-md font-medium text-sm transition-colors ${
                currentPage === page
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
