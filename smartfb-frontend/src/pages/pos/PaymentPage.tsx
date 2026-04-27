import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { usePaymentConfig } from '@modules/branch/hooks/usePaymentConfig';
import { ORDER_TAX_RATE } from '@modules/order/components/order-page/orderPage.utils';
import { PaymentEmptyState } from '@modules/order/components/payment-page/PaymentEmptyState';
import { PaymentOrderSummary } from '@modules/order/components/payment-page/PaymentOrderSummary';
import {
  PaymentSidebar,
  type PaymentMethod,
  type QRState,
  type QRSubMethod,
} from '@modules/order/components/payment-page/PaymentSidebar';
import { PaymentSuccessState } from '@modules/order/components/payment-page/PaymentSuccessState';
import { useOrderPricing } from '@modules/order/hooks/useOrderPricing';
import { orderService } from '@modules/order/services/orderService';
import { useOrderStore } from '@modules/order/stores/orderStore';
import type { OrderTableContext } from '@modules/order/types/order.types';
import { useManualConfirmQRPayment } from '@modules/payment/hooks/useManualConfirmQRPayment';
import { useProcessCashPayment } from '@modules/payment/hooks/useProcessCashPayment';
import { useProcessQRPayment } from '@modules/payment/hooks/useProcessQRPayment';
import { paymentService } from '@modules/payment/services/paymentService';
import { queryKeys } from '@shared/constants/queryKeys';
import { PERMISSIONS } from '@shared/constants/permissions';
import { ROLES } from '@shared/constants/roles';
import { ROUTES } from '@shared/constants/routes';
import { usePermission } from '@shared/hooks/usePermission';
import { getApiErrorMessage } from '@shared/utils/getApiErrorMessage';
interface PaymentResultState {
  status: 'success' | 'error';
  title: string;
  description: string;
  shouldClearDraft: boolean;
}

/**
 * Dữ liệu QR đã được tạo từ BE.
 * qrCodeUrl  = checkoutUrl PayOS (link trang web) — dùng làm fallback
 * qrCodeData = raw VietQR/EMVCo string từ PayOS SDK — app ngân hàng đọc trực tiếp
 */
interface QRData {
  paymentId: string;
  method: QRSubMethod;
  qrCodeUrl: string;
  qrCodeData: string;
  expiresInSeconds: number;
  generatedAt: number; // Date.now() lúc tạo
}

/** Interval tính giây để poll trạng thái payment QR */
const QR_POLL_INTERVAL_MS = 3000;

/** Số lần lỗi polling liên tiếp trước khi hiển thị cảnh báo cho thu ngân. */
const QR_POLL_ERROR_WARNING_THRESHOLD = 2;

/** Thông báo nghiệp vụ khi chi nhánh chưa nhập bộ key PayOS. */
const PAYOS_NOT_CONFIGURED_MESSAGE =
  'Chi nhánh hiện tại chưa cấu hình PayOS. Vui lòng vào Chi nhánh > Cổng thanh toán PayOS để cấu hình trước khi tạo QR PayOS.';

const QR_POLLING_FALLBACK_MESSAGE =
  'Chưa kiểm tra được trạng thái thanh toán. Nếu khách đã chuyển khoản, hãy kiểm tra PayOS/ngân hàng trước khi xác nhận thủ công.';

export default function PaymentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { can } = usePermission();
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

  const fallbackTableContext = useMemo<OrderTableContext>(() => ({
    tableId: routeTableId || null,
    tableName: routeTableName,
    zoneId: routeZoneId || undefined,
    zoneName: '',
    branchId: currentBranchId,
    branchName: routeBranchName || 'Chi nhánh hiện tại',
  }), [currentBranchId, routeBranchName, routeTableId, routeTableName, routeZoneId]);

  const displayCart = cart;
  const displayTableContext = tableContext ?? fallbackTableContext;
  const displayOrderId = draftOrder.orderId ?? routeOrderId;
  const displayOrderNumber = draftOrder.orderNumber ?? null;
  const displayCreatedAt = draftOrder.createdAt ?? new Date().toISOString();
  const paymentConfigBranchId = displayTableContext.branchId ?? currentBranchId ?? '';
  const canReadPaymentConfig = can(PERMISSIONS.BRANCH_EDIT);
  const { data: paymentConfig, isLoading: isPaymentConfigLoading } =
    usePaymentConfig(paymentConfigBranchId, canReadPaymentConfig);

  const { subtotal, vatAmount, totalAmount } = useOrderPricing({
    cart: displayCart,
    taxRate: ORDER_TAX_RATE,
  });

  // --- Payment method state ---
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [amountReceivedDraft, setAmountReceivedDraft] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResultState | null>(null);

  // --- QR state ---
  const [qrSubMethod, setQRSubMethod] = useState<QRSubMethod>('VIETQR');
  const [qrState, setQRState] = useState<QRState>('idle');
  const [qrData, setQRData] = useState<QRData | null>(null);
  const [qrTimeLeft, setQRTimeLeft] = useState(0);
  const [qrPollingMessage, setQRPollingMessage] = useState<string | null>(null);
  const isPayOSEnabled = canReadPaymentConfig ? Boolean(paymentConfig?.isConfigured) : true;
  const payOSDisabledMessage = isPaymentConfigLoading
    ? 'Đang kiểm tra cấu hình PayOS của chi nhánh hiện tại...'
    : PAYOS_NOT_CONFIGURED_MESSAGE;

  // Dùng ref để tránh stale closure trong setInterval
  const qrDataRef = useRef<QRData | null>(null);
  const qrPollingErrorCountRef = useRef(0);
  qrDataRef.current = qrData;

  const processCashPaymentMutation = useProcessCashPayment();
  const processQRPaymentMutation = useProcessQRPayment();
  const manualConfirmMutation = useManualConfirmQRPayment();

  const amountReceived = amountReceivedDraft ?? (totalAmount > 0 ? String(totalAmount) : '');
  const amountReceivedValue = Number(amountReceived) || 0;
  const changeAmount = Math.max(0, amountReceivedValue - totalAmount);

  const isProcessing =
    processCashPaymentMutation.isPending ||
    processQRPaymentMutation.isPending;

  const tableManagementRoute =
    currentRole === ROLES.OWNER ? ROUTES.OWNER.TABLES : ROUTES.STAFF.TABLES;

  // --- Countdown timer khi QR active ---
  useEffect(() => {
    if (qrState !== 'active' || !qrData) return;

    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - qrData.generatedAt) / 1000);
      const remaining = qrData.expiresInSeconds - elapsed;

      if (remaining <= 0) {
        setQRTimeLeft(0);
        setQRState('expired');
        clearInterval(interval);
      } else {
        setQRTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [qrState, qrData]);

  useEffect(() => {
    if (qrSubMethod !== 'PAYOS' || isPayOSEnabled || isPaymentConfigLoading) return;

    // Khi chi nhánh chưa cấu hình PayOS, tự chuyển về VietQR để tránh gọi gateway lỗi.
    setQRSubMethod('VIETQR');
  }, [isPayOSEnabled, isPaymentConfigLoading, qrSubMethod]);

  // --- Polling trạng thái payment khi QR active ---
  useEffect(() => {
    if (qrState !== 'active' || !qrData) return;

    qrPollingErrorCountRef.current = 0;
    setQRPollingMessage(null);

    const interval = window.setInterval(async () => {
      // Lấy ref mới nhất để kiểm tra QR còn active không
      if (!qrDataRef.current || qrState !== 'active') return;

      try {
        const currentQRData = qrDataRef.current;
        if (!currentQRData) return;

        const response =
          currentQRData.method === 'PAYOS'
            ? await paymentService.syncPaymentStatus(currentQRData.paymentId)
            : await paymentService.getPayment(currentQRData.paymentId);
        qrPollingErrorCountRef.current = 0;
        setQRPollingMessage(null);

        if (response.data?.status === 'COMPLETED') {
          clearInterval(interval);
          handlePaymentSuccess();
        } else if (response.data?.status === 'FAILED') {
          clearInterval(interval);
          void resetOrderAfterPaymentFailure(displayOrderId, displayTableContext.tableId);
          showPaymentResult({
            status: 'error',
            title: 'Thanh toán QR thất bại',
            description: 'Gateway báo thanh toán thất bại. Vui lòng thử lại hoặc đổi phương thức.',
            shouldClearDraft: false,
          });
        }
      } catch (error) {
        // Polling lỗi không dừng luồng QR, nhưng cần báo rõ để thu ngân biết hệ thống đang mất tín hiệu.
        qrPollingErrorCountRef.current += 1;

        if (qrPollingErrorCountRef.current >= QR_POLL_ERROR_WARNING_THRESHOLD) {
          setQRPollingMessage(getApiErrorMessage(error, QR_POLLING_FALLBACK_MESSAGE));
        }
      }
    }, QR_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrState, qrData?.paymentId]);

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
    if (shouldClearDraft) clearDraftAndContext();
    navigate(tableManagementRoute, { replace: true });
  };

  const showPaymentResult = (result: PaymentResultState) => {
    setPaymentResult(result);
    window.setTimeout(() => {
      navigateToTableManagement(result.shouldClearDraft);
    }, 2000);
  };

  const handlePaymentSuccess = () => {
    invalidateOrderAndTableQueries(displayOrderId, displayTableContext.tableId);
    showPaymentResult({
      status: 'success',
      title: 'Thanh toán thành công',
      description: 'Đơn hàng đã được thanh toán và hoàn tất trên hệ thống.',
      shouldClearDraft: true,
    });
  };

  const resetOrderAfterPaymentFailure = async (orderId: string, tableId?: string | null) => {
    try {
      await orderService.cancelOrder(orderId, {
        reason: 'PAYMENT_FAILED_AFTER_ORDER_CREATED',
      });
    } catch {
      // Không chặn màn kết quả thất bại
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

  /**
   * Xử lý khi bấm nút chính:
   * - cash: thanh toán ngay
   * - qr idle/expired: tạo QR
   */
  const handleConfirmPayment = () => {
    if (!displayOrderId) {
      showPaymentResult({
        status: 'error',
        title: 'Chưa có đơn hàng để thanh toán',
        description: 'Vui lòng quay lại màn order và bấm đi thanh toán để hệ thống tạo đơn trước.',
        shouldClearDraft: false,
      });
      return;
    }

    if (selectedMethod === 'cash') {
      void handleCashPayment();
      return;
    }

    if (selectedMethod === 'qr' && (qrState === 'idle' || qrState === 'expired')) {
      void handleGenerateQR();
      return;
    }

    // Thẻ ngân hàng chưa tích hợp
    const showUnsupported = async () => {
      await resetOrderAfterPaymentFailure(displayOrderId, displayTableContext.tableId);
      showPaymentResult({
        status: 'error',
        title: 'Thanh toán thất bại',
        description: 'Phương thức thẻ chưa kết nối API thật. Vui lòng chọn tiền mặt hoặc QR.',
        shouldClearDraft: false,
      });
    };
    void showUnsupported();
  };

  const handleCashPayment = async () => {
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

      handlePaymentSuccess();
    } catch {
      await resetOrderAfterPaymentFailure(displayOrderId, displayTableContext.tableId);
      showPaymentResult({
        status: 'error',
        title: 'Thanh toán thất bại',
        description: 'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng kiểm tra lại hệ thống.',
        shouldClearDraft: false,
      });
    }
  };

  const handleGenerateQR = async () => {
    if (qrSubMethod === 'PAYOS' && !isPayOSEnabled) {
      showPaymentResult({
        status: 'error',
        title: 'PayOS chưa được cấu hình',
        description: payOSDisabledMessage,
        shouldClearDraft: false,
      });
      return;
    }

    setQRState('generating');
    setQRData(null);
    setQRPollingMessage(null);
    qrPollingErrorCountRef.current = 0;

    try {
      const response = await processQRPaymentMutation.mutateAsync({
        orderId: displayOrderId,
        amount: totalAmount,
        qrMethod: qrSubMethod,
      });

      if (!response.success || !response.data) {
        setQRState('idle');
        showPaymentResult({
          status: 'error',
          title: 'Không thể tạo mã QR',
          description: response.error?.message ?? 'Hệ thống chưa tạo được mã QR. Vui lòng thử lại.',
          shouldClearDraft: false,
        });
        return;
      }

      const data: QRData = {
        paymentId: response.data.paymentId,
        method: qrSubMethod,
        qrCodeUrl: response.data.qrCodeUrl,
        // qrCodeData là raw VietQR string từ PayOS SDK — app ngân hàng quét trực tiếp
        qrCodeData: response.data.qrCodeData,
        expiresInSeconds: response.data.expiresInSeconds,
        generatedAt: Date.now(),
      };

      setQRData(data);
      setQRTimeLeft(data.expiresInSeconds);
      setQRState('active');
    } catch (error) {
      setQRState('idle');
      const qrErrorMessage = getApiErrorMessage(
        error,
        qrSubMethod === 'PAYOS'
          ? PAYOS_NOT_CONFIGURED_MESSAGE
          : 'Có lỗi xảy ra khi tạo mã QR. Vui lòng thử lại.'
      );
      showPaymentResult({
        status: 'error',
        title: 'Không thể tạo mã QR',
        description:
          qrSubMethod === 'PAYOS' && qrErrorMessage === 'Hệ thống gặp sự cố, vui lòng thử lại sau'
            ? PAYOS_NOT_CONFIGURED_MESSAGE
            : qrErrorMessage,
        shouldClearDraft: false,
      });
    }
  };

  /**
   * Thu ngân xác nhận thủ công khi webhook không đến.
   */
  const handleManualConfirmQR = () => {
    if (!qrData) return;

    manualConfirmMutation.mutate(qrData.paymentId, {
      onSuccess: () => {
        handlePaymentSuccess();
      },
      onError: () => {
        showPaymentResult({
          status: 'error',
          title: 'Xác nhận thủ công thất bại',
          description: 'Không thể xác nhận thanh toán. Kiểm tra lại trên hệ thống ngân hàng.',
          shouldClearDraft: false,
        });
      },
    });
  };

  /**
   * Reset QR state về idle để tạo lại khi hết hạn.
   */
  const handleRegenerateQR = () => {
    setQRState('idle');
    setQRData(null);
    setQRTimeLeft(0);
    setQRPollingMessage(null);
    qrPollingErrorCountRef.current = 0;
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    // Reset QR state khi đổi phương thức
    if (method !== 'qr') {
      setQRState('idle');
      setQRData(null);
      setQRTimeLeft(0);
      setQRPollingMessage(null);
      qrPollingErrorCountRef.current = 0;
    }
    if (method === 'cash') {
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
        qrSubMethod={qrSubMethod}
        qrState={qrState}
        qrCodeUrl={qrData?.qrCodeUrl ?? null}
        qrCodeData={qrData?.qrCodeData ?? null}
        qrTimeLeft={qrTimeLeft}
        qrPollingMessage={qrPollingMessage}
        isPayOSEnabled={isPayOSEnabled}
        payOSDisabledMessage={payOSDisabledMessage}
        isManualConfirming={manualConfirmMutation.isPending}
        onSelectQRSubMethod={setQRSubMethod}
        onManualConfirmQR={handleManualConfirmQR}
        onRegenerateQR={handleRegenerateQR}
      />
    </div>
  );
}
