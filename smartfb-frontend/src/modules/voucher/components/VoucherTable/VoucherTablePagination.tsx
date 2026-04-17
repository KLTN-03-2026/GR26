/**
 * @author Đào Thu Thiên
 * @description Pagination component cho VoucherTable với smart ellipsis
 * @created 2026-04-16
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface VoucherTablePaginationProps {
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
    const maxVisible = 7; // Số trang hiển thị tối đa

    if (totalPages <= maxVisible) {
        // Nếu tổng số trang <= 7, hiện hết
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Luôn hiện trang đầu
    pages.push(1);

    if (currentPage > 3) {
        pages.push('...');
    }

    // Hiện các trang xung quanh trang hiện tại
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (currentPage < totalPages - 2) {
        pages.push('...');
    }

    // Luôn hiện trang cuối
    if (totalPages > 1) {
        pages.push(totalPages);
    }

    return pages;
};

/**
 * Pagination component cho VoucherTable với smart ellipsis
 */
export const VoucherTablePagination = ({
    currentPage,
    totalPages,
    totalItems = 0,
    onPageChange,
}: VoucherTablePaginationProps) => {
    const pageSize = 10;
    const endIndex = Math.min(pageSize * currentPage, totalItems);
    const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;

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

            {totalPages > 0 && (
                <div className="flex items-center gap-1">
                    <button
                        onClick={handlePrevious}
                        disabled={currentPage === 1}
                        className="w-8 h-8 rounded-md flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {pageNumbers.map((page, index) => {
                        if (page === '...') {
                            return (
                                <span
                                    key={`ellipsis-${index}`}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400"
                                >
                                    ...
                                </span>
                            );
                        }

                        return (
                            <button
                                key={page}
                                onClick={() => onPageChange(page as number)}
                                className={`w-8 h-8 rounded-md font-medium text-sm transition-colors ${currentPage === page
                                        ? "bg-orange-500 text-white hover:bg-orange-600"
                                        : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                                    }`}
                            >
                                {page}
                            </button>
                        );
                    })}

                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 rounded-md flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};