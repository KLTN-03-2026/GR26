import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { ORDER_TAX_RATE } from '@modules/order/components/order-page/orderPage.utils';
import { PaymentEmptyState } from '@modules/order/components/payment-page/PaymentEmptyState';
import { PaymentOrderSummary } from '@modules/order/components/payment-page/PaymentOrderSummary';
import {
  PaymentSidebar,
  type PaymentMethod,
} from '@modules/order/components/payment-page/PaymentSidebar';
import { PaymentSuccessState } from '@modules/order/components/payment-page/PaymentSuccessState';
import { useOrderPricing } from '@modules/order/hooks/useOrderPricing';
import { orderService } from '@modules/order/services/orderService';
import { useOrderStore } from '@modules/order/stores/orderStore';
import type { OrderTableContext } from '@modules/order/types/order.types';
import { useProcessCashPayment } from '@modules/payment/hooks/useProcessCashPayment';
import { queryKeys } from '@shared/constants/queryKeys';
import { ROLES } from '@shared/constants/roles';
import { ROUTES } from '@shared/constants/routes';

interface PaymentResultState {
  status: 'success' | 'error';
  title: string;
  description: string;
  shouldClearDraft: boolean;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const currentRole = useAuthStore((state) => state.user?.role);
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const {
    cart,
    tableContext,
    draftOrder,
    clearDraftAndContext,
    setDraftOrder,
  } = useOrderStore();

  const routeOrderId = searchParams.get('orderId')?.trim() ?? '';
  const routeTableId = searchParams.get('tableId')?.trim() ?? '';
  const routeTableName = searchParams.get('tableName')?.trim() ?? '';
  const routeZoneId = searchParams.get('zoneId')?.trim() ?? '';
  const routeBranchName = searchParams.get('branchName')?.trim() ?? '';

  const fallbackTableContext = useMemo<OrderTableContext>(() => {
    return {
      tableId: routeTableId || null,
      tableName: routeTableName,
      zoneId: routeZoneId || undefined,
      zoneName: '',
      branchId: currentBranchId,
      branchName: routeBranchName || 'Chi nhánh hiện tại',
    };
  }, [currentBranchId, routeBranchName, routeTableId, routeTableName, routeZoneId]);

  const displayCart = cart;
  const displayTableContext = tableContext ?? fallbackTableContext;
  const displayOrderId = draftOrder.orderId ?? routeOrderId;
  const displayOrderNumber = draftOrder.orderNumber ?? null;
  const displayCreatedAt = draftOrder.createdAt ?? new Date().toISOString();

  const { subtotal, vatAmount, totalAmount } = useOrderPricing({
    cart: displayCart,
    taxRate: ORDER_TAX_RATE,
  });

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [amountReceivedDraft, setAmountReceivedDraft] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResultState | null>(null);
  const processCashPaymentMutation = useProcessCashPayment();
  const amountReceived = amountReceivedDraft ?? (totalAmount > 0 ? String(totalAmount) : '');
  const amountReceivedValue = Number(amountReceived) || 0;
  const changeAmount = Math.max(0, amountReceivedValue - totalAmount);
  const isProcessing = processCashPaymentMutation.isPending;
  const tableManagementRoute =
    currentRole === ROLES.OWNER ? ROUTES.OWNER.TABLES : ROUTES.STAFF.TABLES;

  const invalidateOrderAndTableQueries = (orderId?: string | null, tableId?: string | null) => {
    if (orderId?.trim()) {
      queryClient.removeQueries({ queryKey: queryKeys.orders.detail(orderId.trim()) });
    }

    if (tableId?.trim()) {
      queryClient.setQueryData(queryKeys.orders.activeByTable(tableId.trim()), null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.tables.detail(tableId.trim()) });
    }

    void queryClient.invalidateQueries({ queryKey: queryKeys.tables.lists });
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists });
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders.active, exact: true });
  };

  const navigateToTableManagement = (shouldClearDraft: boolean) => {
    if (shouldClearDraft) {
      clearDraftAndContext();
    }

    navigate(tableManagementRoute, { replace: true });
  };

  const showPaymentResult = (result: PaymentResultState) => {
    setPaymentResult(result);

    window.setTimeout(() => {
      navigateToTableManagement(result.shouldClearDraft);
    }, 2000);
  };

  const resetOrderAfterPaymentFailure = async (orderId: string, tableId?: string | null) => {
    try {
      /**
       * Nếu thanh toán thất bại, hủy order đã tạo ở bước đi thanh toán để bàn không bị giữ OCCUPIED.
       */
      await orderService.cancelOrder(orderId, {
        reason: 'PAYMENT_FAILED_AFTER_ORDER_CREATED',
      });
    } catch {
      // Không chặn màn kết quả thất bại; invalidate bên dưới sẽ giúp màn bàn đọc lại trạng thái thật.
    } finally {
      setDraftOrder({
        orderId: null,
        orderNumber: null,
        status: 'PENDING',
        createdAt: draftOrder.createdAt ?? displayCreatedAt,
      });
      invalidateOrderAndTableQueries(orderId, tableId ?? displayTableContext.tableId);
    }
  };

  const canConfirmPayment =
    Boolean(displayOrderId) &&
    displayCart.length > 0 &&
    !isProcessing &&
    (selectedMethod !== 'cash' || amountReceivedValue >= totalAmount);

  const handleConfirmPayment = () => {
    if (!canConfirmPayment) {
      return;
    }

    if (!displayOrderId) {
      showPaymentResult({
        status: 'error',
        title: 'Chưa có đơn hàng để thanh toán',
        description:
          'Vui lòng quay lại màn order và bấm đi thanh toán để hệ thống tạo đơn trước.',
        shouldClearDraft: false,
      });
      return;
    }

    if (selectedMethod !== 'cash') {
      const showUnsupportedMethodResult = async () => {
        await resetOrderAfterPaymentFailure(displayOrderId, displayTableContext.tableId);
        showPaymentResult({
          status: 'error',
          title: 'Thanh toán thất bại',
          description:
            'Phương thức thẻ hoặc QR chưa kết nối API thật. Vui lòng chọn tiền mặt để hoàn tất giao dịch.',
          shouldClearDraft: false,
        });
      };

      void showUnsupportedMethodResult();
      return;
    }

    const processPayment = async () => {
      try {
        const response = await processCashPaymentMutation.mutateAsync({
          orderId: displayOrderId,
          amount: amountReceivedValue,
        });

        if (!response.success) {
          await resetOrderAfterPaymentFailure(displayOrderId, displayTableContext.tableId);
          showPaymentResult({
            status: 'error',
            title: 'Thanh toán thất bại',
            description: response.error?.message ?? 'Không thể xử lý thanh toán tiền mặt.',
            shouldClearDraft: false,
          });
          return;
        }

        invalidateOrderAndTableQueries(displayOrderId, displayTableContext.tableId);
        showPaymentResult({
          status: 'success',
          title: 'Thanh toán thành công',
          description: 'Đơn hàng đã được thanh toán và hoàn tất trên hệ thống.',
          shouldClearDraft: true,
        });
      } catch {
        await resetOrderAfterPaymentFailure(displayOrderId, displayTableContext.tableId);
        showPaymentResult({
          status: 'error',
          title: 'Thanh toán thất bại',
          description:
            'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng kiểm tra lại hệ thống.',
          shouldClearDraft: false,
        });
      }
    };

    void processPayment();
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);

    if (method === 'cash') {
      // Với tiền mặt, mặc định điền đủ số tiền cần thanh toán để thu ngân chỉ sửa khi thật sự cần.
      setAmountReceivedDraft(null);
    }
  };

  if (paymentResult) {
    return (
      <PaymentSuccessState
        status={paymentResult.status}
        title={paymentResult.title}
        description={paymentResult.description}
        onPrint={paymentResult.status === 'success' ? () => window.print() : undefined}
        onCreateNewOrder={() => navigateToTableManagement(paymentResult.shouldClearDraft)}
      />
    );
  }

  if (displayCart.length === 0 || !displayOrderId) {
    return (
      <PaymentEmptyState
        onBackToOrder={() =>
          navigate(
            searchParams.toString()
              ? `${ROUTES.POS_ORDER}?${searchParams.toString()}`
              : ROUTES.POS_ORDER
          )
        }
      />
    );
  }

  return (
    <div className="grid min-h-[calc(100vh-10rem)] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <PaymentOrderSummary
        cart={displayCart}
        tableContext={displayTableContext}
        orderNumber={displayOrderNumber}
        createdAt={displayCreatedAt}
        onBack={() => navigate(-1)}
      />

      <PaymentSidebar
        selectedMethod={selectedMethod}
        amountReceived={amountReceived}
        orderNumber={displayOrderNumber}
        totalAmount={totalAmount}
        subtotal={subtotal}
        vatAmount={vatAmount}
        changeAmount={changeAmount}
        canConfirmPayment={canConfirmPayment}
        isProcessing={isProcessing}
        onSelectMethod={handleSelectMethod}
        onAmountReceivedChange={(value) => setAmountReceivedDraft(value)}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
}
