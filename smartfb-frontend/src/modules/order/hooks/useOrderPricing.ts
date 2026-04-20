import { useMemo } from 'react';
import type { OrderDraftItem } from '@modules/order/types/order.types';

const DEFAULT_TAX_RATE = 0.08;

interface UseOrderPricingParams {
  cart: OrderDraftItem[];
  taxRate?: number;
}

/**
 * Hook tính nhanh các giá trị tiền trên đơn hàng POS.
 *
 * @param params - Danh sách món hiện có trong cart và thuế suất cần áp dụng
 */
export const useOrderPricing = ({ cart, taxRate = DEFAULT_TAX_RATE }: UseOrderPricingParams) => {
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.lineTotal ?? 0), 0);
  }, [cart]);

  const vatAmount = useMemo(() => {
    return Math.round(subtotal * taxRate);
  }, [subtotal, taxRate]);

  const totalAmount = subtotal + vatAmount;

  const totalItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  return {
    subtotal,
    vatAmount,
    totalAmount,
    totalItemCount,
  };
};
