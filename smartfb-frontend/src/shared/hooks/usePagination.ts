import { useState } from 'react';

export interface PaginationState {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface UsePaginationReturn extends PaginationState {
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setTotal: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canNextPage: boolean;
  canPrevPage: boolean;
  reset: () => void;
}

/**
 * Hook to manage pagination state
 * 
 * @param initialPerPage - Initial items per page (default: 10)
 * @returns Pagination state and controls
 */
export function usePagination(initialPerPage: number = 10): UsePaginationReturn {
  const [page, setPage] = useState(1);
  const [per_page, setPerPage] = useState(initialPerPage);
  const [total, setTotal] = useState(0);
  const [last_page, setLastPage] = useState(1);

  const nextPage = () => {
    if (page < last_page) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const canNextPage = page < last_page;
  const canPrevPage = page > 1;

  const reset = () => {
    setPage(1);
    setTotal(0);
    setLastPage(1);
  };

  // Update last_page when total or per_page changes
  const calculatedLastPage = Math.ceil(total / per_page) || 1;
  if (calculatedLastPage !== last_page) {
    setLastPage(calculatedLastPage);
  }

  return {
    page,
    per_page,
    total,
    last_page,
    setPage,
    setPerPage,
    setTotal,
    nextPage,
    prevPage,
    canNextPage,
    canPrevPage,
    reset,
  };
}
