import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/stores/authStore';
import type { MenuItem } from '@modules/menu/types/menu.types';
import {
  ORDER_TAX_RATE,
  toDraftItemsFromOrder,
} from '@modules/order/components/order-page/orderPage.utils';
import { PaymentEmptyState } from '@modules/order/components/payment-page/PaymentEmptyState';
import { PaymentOrderSummary } from '@modules/order/components/payment-page/PaymentOrderSummary';
import {
  PaymentSidebar,
  type PaymentMethod,
} from '@modules/order/components/payment-page/PaymentSidebar';
import { useOrderDetail } from '@modules/order/hooks/useOrderDetail';
import { useOrderPricing } from '@modules/order/hooks/useOrderPricing';
import { useOrderStore } from '@modules/order/stores/orderStore';
import type { OrderResponse, OrderTableContext } from '@modules/order/types/order.types';
import { useProcessCashPayment } from '@modules/payment/hooks/useProcessCashPayment';
import { ROLES } from '@shared/constants/roles';
import { ROUTES } from '@shared/constants/routes';
import { queryKeys } from '@shared/constants/queryKeys';

const resolvePaymentTableContextFromOrder = (
  order: OrderResponse,
  fallbackContext: OrderTableContext
): OrderTableContext => {
  if (order.source === 'IN_STORE' && order.tableId) {
    return {
      ...fallbackContext,
      tableId: order.tableId,
      tableName: order.tableName?.trim() || fallbackContext.tableName,
    };
  }

  return {
    ...fallbackContext,
    tableId: null,
    tableName: '',
    zoneId: undefined,
    zoneName: '',
  };
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const currentRole = useAuthStore((state) => state.user?.role);
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const { cart, tableContext, draftOrder, clearDraftAndContext } = useOrderStore();

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

  const effectiveOrderId = routeOrderId || draftOrder.orderId || '';
  const emptyMenuItemMap = useMemo(() => new Map<string, MenuItem>(), []);
  const orderDetailQuery = useOrderDetail(effectiveOrderId, {
    enabled: Boolean(effectiveOrderId) && (cart.length === 0 || draftOrder.orderId !== effectiveOrderId),
  });

  const recoveredCart = useMemo(() => {
    if (!orderDetailQuery.data) {
      return [];
    }

    return toDraftItemsFromOrder(orderDetailQuery.data, emptyMenuItemMap);
  }, [emptyMenuItemMap, orderDetailQuery.data]);

  const displayCart = cart.length > 0 ? cart : recoveredCart;
  const displayOrderId =
    (draftOrder.orderId ?? orderDetailQuery.data?.id ?? routeOrderId) || null;
  const displayOrderNumber =
    draftOrder.orderNumber ?? orderDetailQuery.data?.orderNumber ?? null;
  const displayCreatedAt =
    draftOrder.createdAt ?? orderDetailQuery.data?.createdAt ?? null;
  const displayTableContext = tableContext
    ? tableContext
    : orderDetailQuery.data
      ? resolvePaymentTableContextFromOrder(orderDetailQuery.data, fallbackTableContext)
      : fallbackTableContext;
  const hasCreatedOrder = Boolean(displayOrderId);

  const { subtotal, vatAmount, totalAmount } = useOrderPricing({
    cart: displayCart,
    taxRate: ORDER_TAX_RATE,
  });

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [amountReceivedDraft, setAmountReceivedDraft] = useState<string | null>(null);
  const [isMockProcessing, setIsMockProcessing] = useState(false);
  const processCashPaymentMutation = useProcessCashPayment();
  const amountReceived = amountReceivedDraft ?? (totalAmount > 0 ? String(totalAmount) : '');
  const amountReceivedValue = Number(amountReceived) || 0;
  const changeAmount = Math.max(0, amountReceivedValue - totalAmount);
  const isProcessing = processCashPaymentMutation.isPending || isMockProcessing;
  const isRecoveringPaymentOrder =
    Boolean(effectiveOrderId) &&
    displayCart.length === 0 &&
    orderDetailQuery.isLoading;
  const tableManagementRoute =
    currentRole === ROLES.OWNER ? ROUTES.OWNER.TABLES : ROUTES.STAFF.TABLES;

  /**
   * Sau khi thanh toán thành công cần xóa toàn bộ context active của bàn hiện tại
   * rồi quay thẳng về màn quản lý bàn để người dùng không quay lại order cũ.
   */
  const finalizeSuccessfulPayment = () => {
    const paidOrderId = displayOrderId;
    const paidTableId = displayTableContext.tableId ?? null;

    clearDraftAndContext();

    if (paidOrderId) {
      queryClient.removeQueries({ queryKey: queryKeys.orders.detail(paidOrderId) });
    }

    if (paidTableId) {
      queryClient.removeQueries({
        queryKey: queryKeys.orders.activeByTable(paidTableId),
      });
    }

    void queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });

    if (paidTableId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tables.detail(paidTableId) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orders.activeByTable(paidTableId),
      });
    }

    navigate(tableManagementRoute, { replace: true });
  };

  const canConfirmPayment =
    hasCreatedOrder &&
    displayCart.length > 0 &&
    !isProcessing &&
    (selectedMethod !== 'cash' || amountReceivedValue >= totalAmount);

  const handleConfirmPayment = () => {
    if (!canConfirmPayment || !displayOrderId) {
      return;
    }

    if (selectedMethod !== 'cash') {
      // Chỉ gắn API thật cho tiền mặt ở task này.
      setIsMockProcessing(true);
      window.setTimeout(() => {
        setIsMockProcessing(false);
        toast.success('Thanh toán thành công');
        finalizeSuccessfulPayment();
      }, 1200);
      return;
    }

    void processCashPaymentMutation
      .mutateAsync({
        orderId: displayOrderId,
        amount: amountReceivedValue,
      })
      .then((response) => {
        if (!response.success) {
          toast.error(response.error?.message ?? 'Không thể xử lý thanh toán tiền mặt');
          return;
        }

        toast.success('Thanh toán tiền mặt thành công');
        finalizeSuccessfulPayment();
      })
      .catch(() => {
        // Axios interceptor đã xử lý toast lỗi chung.
      });
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);

    if (method === 'cash') {
      // Với tiền mặt, mặc định điền đủ số tiền cần thanh toán để thu ngân chỉ sửa khi thật sự cần.
      setAmountReceivedDraft(null);
    }
  };

  if (isRecoveringPaymentOrder) {
    return (
      <div className="flex min-h-[560px] items-center justify-center rounded-[32px] bg-white p-10 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="font-medium text-slate-500">Đang tải lại đơn hàng để thanh toán...</p>
        </div>
      </div>
    );
  }

  if (orderDetailQuery.isError && displayCart.length === 0) {
    return (
      <div className="flex min-h-[560px] items-center justify-center rounded-[32px] bg-white p-10 shadow-sm">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-black text-slate-900">Không thể tải đơn hàng</h1>
          <p className="mt-3 text-slate-500">
            Đơn thanh toán không thể đồng bộ lại từ hệ thống. Vui lòng thử lại hoặc quay về màn tạo đơn.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => void orderDetailQuery.refetch()}
              className="rounded-full bg-orange-500 px-5 py-2.5 font-semibold text-white hover:bg-orange-600"
            >
              Tải lại
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(
                  searchParams.toString()
                    ? `${ROUTES.POS_ORDER}?${searchParams.toString()}`
                    : ROUTES.POS_ORDER
                )
              }
              className="rounded-full border border-slate-200 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Quay lại tạo đơn
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (displayCart.length === 0 || !hasCreatedOrder) {
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
