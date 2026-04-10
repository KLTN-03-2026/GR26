import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentEmptyState } from '@modules/order/components/payment-page/PaymentEmptyState';
import { PaymentOrderSummary } from '@modules/order/components/payment-page/PaymentOrderSummary';
import {
  PaymentSidebar,
  type PaymentMethod,
} from '@modules/order/components/payment-page/PaymentSidebar';
import { PaymentSuccessState } from '@modules/order/components/payment-page/PaymentSuccessState';
import { useOrderPricing } from '@modules/order/hooks/useOrderPricing';
import { useOrderStore } from '@modules/order/stores/orderStore';
import { ROUTES } from '@shared/constants/routes';

export default function PaymentPage() {
  const navigate = useNavigate();
  const { cart, tableContext, draftOrder, clearDraft } = useOrderStore();
  const hasCreatedOrder = Boolean(draftOrder.orderId);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { subtotal, vatAmount, totalAmount } = useOrderPricing({ cart });
  const amountReceivedValue = Number(amountReceived) || 0;
  const changeAmount = Math.max(0, amountReceivedValue - totalAmount);

  const canConfirmPayment =
    hasCreatedOrder &&
    cart.length > 0 &&
    !isProcessing &&
    (selectedMethod !== 'cash' || amountReceivedValue >= totalAmount);

  const handleConfirmPayment = () => {
    if (!canConfirmPayment) {
      return;
    }

    setIsProcessing(true);

    window.setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      clearDraft();
    }, 1200);
  };

  if (isSuccess) {
    return (
      <PaymentSuccessState
        onPrint={() => window.print()}
        onCreateNewOrder={() => navigate(ROUTES.POS_ORDER)}
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
        onSelectMethod={setSelectedMethod}
        onAmountReceivedChange={setAmountReceived}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
}
