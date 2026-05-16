import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { paymentService } from '../services/paymentService';
import type {
  InvoiceItemAddonResponse,
  InvoiceItemResponse,
  InvoiceOrderItemSnapshot,
  InvoiceOrderSummary,
  InvoiceOrderSnapshot,
  InvoiceResponse,
} from '../types/payment.types';

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const normalizeAddonList = (payload: unknown): InvoiceItemAddonResponse[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.reduce<InvoiceItemAddonResponse[]>((accumulator, item) => {
    if (!isObjectRecord(item)) {
      return accumulator;
    }

    const addonId = typeof item.addonId === 'string' ? item.addonId : '';
    const addonName = typeof item.addonName === 'string' ? item.addonName : '';
    const extraPrice =
      typeof item.extraPrice === 'number'
        ? item.extraPrice
        : Number(item.extraPrice ?? 0) || 0;
    const quantity =
      typeof item.quantity === 'number'
        ? item.quantity
        : Number(item.quantity ?? 0) || 0;

    if (!addonId || !addonName || quantity <= 0) {
      return accumulator;
    }

    accumulator.push({ addonId, addonName, extraPrice, quantity });
    return accumulator;
  }, []);
};

const parseAddonPayload = (
  payload?: string | InvoiceItemAddonResponse[] | null
): InvoiceItemAddonResponse[] => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return normalizeAddonList(payload);
  }

  try {
    return normalizeAddonList(JSON.parse(payload));
  } catch {
    return [];
  }
};

const isSameInvoiceLine = (
  invoiceItem: InvoiceItemResponse,
  orderItem: InvoiceOrderItemSnapshot
): boolean => {
  return (
    invoiceItem.itemName === orderItem.itemName &&
    invoiceItem.quantity === orderItem.quantity &&
    Number(invoiceItem.unitPrice) === Number(orderItem.unitPrice) &&
    Number(invoiceItem.totalPrice) === Number(orderItem.totalPrice)
  );
};

const findOrderItemIndex = (
  invoiceItem: InvoiceItemResponse,
  orderItems: InvoiceOrderItemSnapshot[],
  usedIndexes: Set<number>,
  fallbackIndex: number
): number => {
  const exactIndex = orderItems.findIndex((orderItem, index) => {
    return !usedIndexes.has(index) && isSameInvoiceLine(invoiceItem, orderItem);
  });

  if (exactIndex >= 0) {
    return exactIndex;
  }

  return !usedIndexes.has(fallbackIndex) && orderItems[fallbackIndex] ? fallbackIndex : -1;
};

const enrichInvoiceWithOrderAddons = (
  invoice: InvoiceResponse,
  order: InvoiceOrderSnapshot
): InvoiceResponse => {
  const usedOrderIndexes = new Set<number>();
  const orderSummary: InvoiceOrderSummary = {
    id: order.id,
    orderNumber: order.orderNumber,
    tableId: order.tableId,
    tableName: order.tableName,
    userId: order.userId,
    staffName: order.staffName,
    source: order.source,
  };

  return {
    ...invoice,
    order: orderSummary,
    // Invoice backend chưa trả topping, nên FE dùng order detail cùng `orderId` để enrich hiển thị.
    items: invoice.items.map((invoiceItem, invoiceIndex) => {
      const orderItemIndex = findOrderItemIndex(
        invoiceItem,
        order.items,
        usedOrderIndexes,
        invoiceIndex
      );

      if (orderItemIndex < 0) {
        return invoiceItem;
      }

      usedOrderIndexes.add(orderItemIndex);
      const addons = parseAddonPayload(order.items[orderItemIndex].addons);

      return addons.length > 0 ? { ...invoiceItem, addons } : invoiceItem;
    }),
  };
};

/**
 * Hook lấy chi tiết hóa đơn thu theo đúng endpoint invoice detail của backend.
 *
 * @param invoiceId - ID hóa đơn cần xem
 * @param enabled - Chỉ bật query khi dialog đang mở và có id hợp lệ
 */
export const useInvoiceDetail = (invoiceId: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.payments.invoiceDetail(invoiceId ?? 'unknown'),
    queryFn: async (): Promise<InvoiceResponse> => {
      if (!invoiceId) {
        throw new Error('Thiếu invoiceId để tải chi tiết hóa đơn');
      }

      const invoice = await paymentService.getInvoice(invoiceId).then((response) => response.data);
      const orderResult = await paymentService
        .getInvoiceOrderSnapshot(invoice.orderId)
        .then((response) => response.data)
        .catch(() => null);

      return orderResult ? enrichInvoiceWithOrderAddons(invoice, orderResult) : invoice;
    },
    enabled: enabled && Boolean(invoiceId),
    staleTime: 60 * 1000,
    retry: 1,
  });
};
