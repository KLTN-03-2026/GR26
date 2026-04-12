import { useQuery } from '@tanstack/react-query';
import { paymentService } from '@modules/payment/services/paymentService';
import type {
  InvoiceResponse,
  InvoiceSearchItemResponse,
  OrderInvoiceResponse,
  PaymentResponse,
} from '@modules/payment/types/payment.types';
import { queryKeys } from '@shared/constants/queryKeys';

interface UseOrderInvoiceOptions {
  enabled?: boolean;
}

const INVOICE_SEARCH_PAGE_SIZE = 100;

/**
 * Lấy data từ contract `ApiResponse` và ném lỗi nếu backend trả `success = false`.
 *
 * @param response - Kết quả gọi API payment/invoice
 * @param fallbackMessage - Message dùng khi backend không trả lỗi cụ thể
 */
const unwrapResponseData = <T>(
  response: {
    success: boolean;
    data: T;
    error?: {
      message: string;
    } | null;
  },
  fallbackMessage: string
): T => {
  if (!response.success) {
    throw new Error(response.error?.message ?? fallbackMessage);
  }

  return response.data;
};

/**
 * Dò invoice theo `orderId` vì backend hiện chưa có endpoint direct lookup cho order detail.
 *
 * @param orderId - id của order đang được mở ở màn chi tiết
 */
const findInvoiceByOrderId = async (orderId: string): Promise<InvoiceSearchItemResponse | null> => {
  const firstPageResponse = await paymentService.searchInvoices({
    page: 0,
    size: INVOICE_SEARCH_PAGE_SIZE,
  });

  const firstPage = unwrapResponseData(
    firstPageResponse,
    'Không thể tìm kiếm hóa đơn cho đơn hàng này'
  );
  const matchedInvoice = firstPage.items.find((item) => item.orderId === orderId);

  if (matchedInvoice) {
    return matchedInvoice;
  }

  if (firstPage.totalPages <= 1) {
    return null;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, pageIndex) =>
      paymentService.searchInvoices({
        page: pageIndex + 1,
        size: INVOICE_SEARCH_PAGE_SIZE,
      })
    )
  );

  return remainingPages
    .flatMap((pageResponse) =>
      unwrapResponseData(pageResponse, 'Không thể tìm kiếm hóa đơn cho đơn hàng này').items
    )
    .find((item) => item.orderId === orderId) ?? null;
};

/**
 * Hook lấy invoice và payment tương ứng để mở lại block thanh toán trên order detail.
 *
 * @param orderId - id đơn hàng cần truy ngược sang hóa đơn
 * @param options - cờ bật/tắt query theo trạng thái order hiện tại
 */
export const useOrderInvoice = (orderId?: string | null, options?: UseOrderInvoiceOptions) => {
  return useQuery<OrderInvoiceResponse | null>({
    queryKey: queryKeys.payments.orderInvoice(orderId ?? 'unknown'),
    queryFn: async () => {
      const normalizedOrderId = orderId ?? '';
      const invoiceSearchItem = await findInvoiceByOrderId(normalizedOrderId);

      if (!invoiceSearchItem) {
        return null;
      }

      const invoiceResponse = await paymentService.getInvoice(invoiceSearchItem.id);
      const invoice = unwrapResponseData<InvoiceResponse>(
        invoiceResponse,
        'Không thể tải chi tiết hóa đơn'
      );

      let payment: PaymentResponse | null = null;

      if (invoice.paymentId) {
        try {
          const paymentResponse = await paymentService.getPayment(invoice.paymentId);
          payment = unwrapResponseData<PaymentResponse>(
            paymentResponse,
            'Không thể tải thông tin thanh toán'
          );
        } catch {
          // Ưu tiên hiển thị được invoice ngay cả khi payment detail chưa ổn định.
          payment = null;
        }
      }

      return {
        invoice,
        payment,
      };
    },
    enabled: Boolean(orderId) && (options?.enabled ?? true),
    staleTime: 0,
  });
};
