import { useMemo, useState } from 'react';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { PERMISSIONS } from '@shared/constants/permissions';
import { useDebounce } from '@shared/hooks/useDebounce';
import { usePermission } from '@shared/hooks/usePermission';
import type { SearchInvoiceResponse } from '../types/payment.types';
import { useInvoices } from './useInvoices';

const INVOICE_PAGE_SIZE = 10;

const EMPTY_INVOICE_PAGE: SearchInvoiceResponse = {
  items: [],
  totalItems: 0,
  pageNumber: 0,
  pageSize: INVOICE_PAGE_SIZE,
  totalPages: 0,
};

/**
 * Hook điều phối state cho màn danh sách hóa đơn thu.
 * Invoice được tạo tự động từ module thanh toán nên màn này chỉ hỗ trợ tra cứu và xem chi tiết.
 */
export const useInvoiceManagement = () => {
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const { can } = usePermission();

  const [invoiceKeyword, setInvoiceKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const debouncedInvoiceKeyword = useDebounce(invoiceKeyword.trim(), 300);
  const canViewInvoices =
    can(PERMISSIONS.PAYMENT_VIEW) ||
    can(PERMISSIONS.PAYMENT_CREATE) ||
    can(PERMISSIONS.PAYMENT_PROCESS);

  const filters = useMemo(() => {
    return {
      invoiceNumber: debouncedInvoiceKeyword || undefined,
      page: currentPage,
      size: INVOICE_PAGE_SIZE,
    };
  }, [currentPage, debouncedInvoiceKeyword]);

  const {
    data: invoicePage = EMPTY_INVOICE_PAGE,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useInvoices(filters, Boolean(currentBranchId) && canViewInvoices);

  const emptyMessage = debouncedInvoiceKeyword
    ? 'Không tìm thấy hóa đơn thu nào khớp mã đang tìm.'
    : 'Chưa có hóa đơn thu nào trong 90 ngày gần nhất ở chi nhánh đang chọn.';

  const handleInvoiceKeywordChange = (value: string) => {
    setInvoiceKeyword(value);
    setCurrentPage(0);
  };

  const openInvoiceDetail = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
  };

  const closeInvoiceDetail = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedInvoiceId(null);
    }
  };

  return {
    invoiceKeyword,
    setInvoiceKeyword: handleInvoiceKeywordChange,
    currentPage: invoicePage.pageNumber,
    totalPages: invoicePage.totalPages,
    totalItems: invoicePage.totalItems,
    invoices: invoicePage.items,
    canViewInvoices,
    emptyMessage,
    isLoading,
    isError,
    isFetching,
    refetch,
    selectedInvoiceId,
    isInvoiceDetailOpen: Boolean(selectedInvoiceId),
    openInvoiceDetail,
    closeInvoiceDetail,
    setCurrentPage,
  };
};
