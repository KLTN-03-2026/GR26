import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useProcessCashPayment } from '@modules/payment/hooks/useProcessCashPayment';
import { useNavigate } from 'react-router-dom';
import { PaymentEmptyState } from '@modules/order/components/payment-page/PaymentEmptyState';
import { PaymentOrderSummary } from '@modules/order/components/payment-page/PaymentOrderSummary';
import {
  PaymentSidebar,
  type PaymentMethod,
} from '@modules/order/components/payment-page/PaymentSidebar';
import { ORDER_TAX_RATE } from '@modules/order/components/order-page/orderPage.utils';
import { PaymentSuccessState } from '@modules/order/components/payment-page/PaymentSuccessState';
import { useOrderPricing } from '@modules/order/hooks/useOrderPricing';
import { useOrderStore } from '@modules/order/stores/orderStore';
import { ROLES } from '@shared/constants/roles';
import { ROUTES } from '@shared/constants/routes';
import { queryKeys } from '@shared/constants/queryKeys';

export default function PaymentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentRole = useAuthStore((state) => state.user?.role);
  const { cart, tableContext, draftOrder, clearDraftAndContext } = useOrderStore();
  const hasCreatedOrder = Boolean(draftOrder.orderId);

  const { subtotal, vatAmount, totalAmount } = useOrderPricing({
    cart,
    taxRate: ORDER_TAX_RATE,
  });

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState(() =>
    totalAmount > 0 ? String(totalAmount) : ''
  );
  const [isMockProcessing, setIsMockProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const processCashPaymentMutation = useProcessCashPayment();
  const amountReceivedValue = Number(amountReceived) || 0;
  const changeAmount = Math.max(0, amountReceivedValue - totalAmount);
  const autoReturnDelayMs = 2500;
  const isProcessing = processCashPaymentMutation.isPending || isMockProcessing;
  const tableManagementRoute =
    currentRole === ROLES.OWNER ? ROUTES.OWNER.TABLES : ROUTES.STAFF.TABLES;

  /**
   * Sau khi thanh toán thành công cần xóa toàn bộ context active của bàn hiện tại
   * và đánh dấu stale các query liên quan để màn bàn lấy lại trạng thái mới từ backend.
   */
  const finalizeSuccessfulPayment = () => {
    const paidOrderId = draftOrder.orderId;
    const paidTableId = tableContext?.tableId ?? null;

    clearDraftAndContext();

    void queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });

    if (paidTableId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tables.detail(paidTableId) });
    }

    if (paidOrderId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(paidOrderId) });
    }
  };

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    // Giữ màn hình thành công trong thời gian ngắn rồi quay lại khu vực bàn.
    const autoReturnTimer = window.setTimeout(() => {
      navigate(tableManagementRoute, { replace: true });
    }, autoReturnDelayMs);

    return () => {
      window.clearTimeout(autoReturnTimer);
    };
  }, [autoReturnDelayMs, isSuccess, navigate, tableManagementRoute]);

  const canConfirmPayment =
    hasCreatedOrder &&
    cart.length > 0 &&
    !isProcessing &&
    (selectedMethod !== 'cash' || amountReceivedValue >= totalAmount);

  const handleConfirmPayment = () => {
    if (!canConfirmPayment || !draftOrder.orderId) {
      return;
    }

    if (selectedMethod !== 'cash') {
      // Chỉ gắn API thật cho tiền mặt ở task này.
      setIsMockProcessing(true);
      window.setTimeout(() => {
        setIsMockProcessing(false);
        setIsSuccess(true);
        finalizeSuccessfulPayment();
      }, 1200);
      return;
    }

    void processCashPaymentMutation.mutateAsync({
      orderId: draftOrder.orderId,
      amount: amountReceivedValue,
    }).then((response) => {
      if (!response.success) {
        toast.error(response.error?.message ?? 'Không thể xử lý thanh toán tiền mặt');
        return;
      }

      toast.success('Thanh toán tiền mặt thành công');
      setIsSuccess(true);
      finalizeSuccessfulPayment();
    }).catch(() => {
      // Axios interceptor đã xử lý toast lỗi chung.
    });
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);

    if (method === 'cash') {
      // Với tiền mặt, mặc định điền đủ số tiền cần thanh toán để thu ngân chỉ sửa khi thật sự cần.
      setAmountReceived(totalAmount > 0 ? String(totalAmount) : '');
    }
  };

  if (isSuccess) {
    return (
      <PaymentSuccessState
        onPrint={() => window.print()}
        onCreateNewOrder={() => navigate(tableManagementRoute, { replace: true })}
      />
    );
  }

  if (cart.length === 0 || !hasCreatedOrder) {
    return <PaymentEmptyState onBackToOrder={() => navigate(ROUTES.POS_ORDER)} />;
  }

  return (
    <div className="grid min-h-[calc(100vh-10rem)] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <PaymentOrderSummary
        cart={cart}
        tableContext={tableContext}
        orderNumber={draftOrder.orderNumber}
        createdAt={draftOrder.createdAt}
        onBack={() => navigate(-1)}
      />

      <PaymentSidebar
        selectedMethod={selectedMethod}
        amountReceived={amountReceived}
        orderNumber={draftOrder.orderNumber}
        totalAmount={totalAmount}
        subtotal={subtotal}
        vatAmount={vatAmount}
        changeAmount={changeAmount}
        canConfirmPayment={canConfirmPayment}
        isProcessing={isProcessing}
        onSelectMethod={handleSelectMethod}
        onAmountReceivedChange={setAmountReceived}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
}
