import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { paymentService } from '../services/paymentService';
import type {
  InvoiceSearchItemResponse,
  OrderInvoiceResponse,
  SearchInvoiceResponse,
} from '../types/payment.types';

/**
 * Số hóa đơn mỗi trang khi dò invoice theo order.
 * Backend search invoice chưa có filter orderId nên FE quét phân trang trong phạm vi 90 ngày backend cho phép.
 */
const ORDER_INVOICE_PAGE_SIZE = 100;

const findInvoiceSearchItemByOrderId = (
  invoicePage: SearchInvoiceResponse,
  orderId: string
): InvoiceSearchItemResponse | null => {
  const normalizedOrderId = orderId.toLowerCase();

  return (
    invoicePage.items.find((item) => item.orderId.toLowerCase() === normalizedOrderId) ?? null
  );
};

const fetchOrderInvoice = async (orderId: string): Promise<OrderInvoiceResponse | null> => {
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const invoicePage = await paymentService
      .searchInvoices({ page, size: ORDER_INVOICE_PAGE_SIZE })
      .then((response) => response.data);
    const matchedInvoice = findInvoiceSearchItemByOrderId(invoicePage, orderId);

    if (matchedInvoice) {
      const invoice = await paymentService
        .getInvoice(matchedInvoice.id)
        .then((response) => response.data);

      return {
        invoice,
        payment: null,
      };
    }

    totalPages = invoicePage.totalPages;
    page += 1;
  }

  return null;
};

/**
 * Hook lấy hóa đơn liên quan tới một order để hiển thị dữ liệu thanh toán thật.
 *
 * @param orderId - ID đơn hàng cần tìm hóa đơn
 * @param enabled - Chỉ bật khi order đã đủ điều kiện có hóa đơn thanh toán
 */
export const useOrderInvoice = (orderId?: string | null, enabled: boolean = true) => {
  return useQuery<OrderInvoiceResponse | null>({
    queryKey: queryKeys.payments.orderInvoice(orderId ?? 'unknown'),
    queryFn: async () => {
      if (!orderId) {
        throw new Error('Thiếu orderId để tải hóa đơn thanh toán');
      }

      return fetchOrderInvoice(orderId);
    },
    enabled: enabled && Boolean(orderId),
    staleTime: 60 * 1000,
    retry: 1,
  });
};
