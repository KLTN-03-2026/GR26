import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CircleAlert,
  CreditCard,
  Loader2,
  ReceiptText,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { OrderStatusBadge } from '@modules/order/components/order-management/OrderStatusBadge';
import {
  buildOrderPageSearchParams,
  resolveOrderNavigationTarget,
} from '@modules/order/components/order-management/orderManagement.utils';
import { useOrderDetail } from '@modules/order/hooks/useOrderDetail';
import { orderService } from '@modules/order/services/orderService';
import type { OrderSource, OrderStatus } from '@modules/order/types/order.types';
import { Button } from '@shared/components/ui/button';
import { PERMISSIONS } from '@shared/constants/permissions';
import { ROUTES } from '@shared/constants/routes';
import { usePermission } from '@shared/hooks/usePermission';
import { cn } from '@shared/utils/cn';
import { formatVND } from '@shared/utils/formatCurrency';
import { formatDateTime } from '@shared/utils/formatDate';

/**
 * Nhãn nghiệp vụ cho nguồn tạo đơn để staff đọc nhanh hơn trên màn xem lại đơn.
 */
const ORDER_SOURCE_LABEL: Record<OrderSource, string> = {
  IN_STORE: 'Tại chỗ',
  TAKEAWAY: 'Mang đi',
  DELIVERY: 'Giao hàng',
  POS: 'Tại quầy (POS)',
  WEB: 'Đặt qua Web',
  MOBILE: 'Đặt qua App',
};

/**
 * Fallback trạng thái khi order chưa có payment detail hoặc invoice.
 */
const ORDER_PAYMENT_STATUS_FALLBACK: Record<OrderStatus, { label: string; tone: string }> = {
  PENDING: {
    label: 'Chưa hoàn tất',
    tone: 'bg-slate-100 text-slate-600',
  },
  PROCESSING: {
    label: 'Đang xử lý',
    tone: 'bg-amber-50 text-amber-600',
  },
  COMPLETED: {
    label: 'Hoàn tất',
    tone: 'bg-emerald-50 text-emerald-600',
  },
  CANCELLED: {
    label: 'Đã hủy',
    tone: 'bg-rose-50 text-rose-600',
  },
};

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { can } = usePermission();
  const [isCancelling, setIsCancelling] = useState(false);
  const canCreateOrder = can(PERMISSIONS.ORDER_CREATE);
  const canCancelOrderPermission = can(PERMISSIONS.ORDER_CANCEL);

  const orderDetailQuery = useOrderDetail(orderId);
  const order = orderDetailQuery.data ?? null;

  useEffect(() => {
    if (!order || resolveOrderNavigationTarget(order.status) !== 'pos' || !canCreateOrder) {
      return;
    }

    // Nếu route detail bị mở nhầm cho đơn còn active thì chuyển về lại POS đúng flow xử lý.
    const search = buildOrderPageSearchParams({
      orderId: order.id,
      tableId: order.tableId ?? undefined,
      tableName: order.tableName ?? undefined,
    });

    navigate(`${ROUTES.POS_ORDER}?${search}`, { replace: true });
  }, [canCreateOrder, navigate, order]);

  if (!orderId) {
    return (
      <div className="flex min-h-[560px] items-center justify-center rounded-[32px] bg-white p-10 shadow-sm">
        <div className="max-w-md text-center">
          <CircleAlert className="mx-auto h-16 w-16 text-rose-300" />
          <h1 className="mt-6 text-3xl font-black text-slate-900">Không tìm thấy mã đơn hàng</h1>
          <p className="mt-3 text-slate-500">
            Hãy quay lại danh sách order và mở lại đơn cần xem chi tiết.
          </p>
          <Button
            type="button"
            onClick={() => navigate(ROUTES.POS_MANAGEMENT)}
            className="mt-6 rounded-full bg-orange-500 hover:bg-orange-600"
          >
            Quay lại danh sách order
          </Button>
        </div>
      </div>
    );
  }

  if (orderDetailQuery.isLoading) {
    return (
      <div className="flex min-h-[560px] items-center justify-center rounded-[32px] bg-white p-10 shadow-sm">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-orange-500" />
          <p className="mt-4 text-lg font-bold text-slate-900">Đang tải chi tiết đơn hàng...</p>
          <p className="mt-2 text-sm text-slate-500">Hệ thống đang đồng bộ lại dữ liệu order.</p>
        </div>
      </div>
    );
  }

  if (orderDetailQuery.isError) {
    return (
      <div className="flex min-h-[560px] items-center justify-center rounded-[32px] bg-white p-10 shadow-sm">
        <div className="max-w-md text-center">
          <CircleAlert className="mx-auto h-16 w-16 text-rose-300" />
          <h1 className="mt-6 text-3xl font-black text-slate-900">Không thể tải chi tiết đơn hàng</h1>
          <p className="mt-3 text-slate-500">
            Dữ liệu order hiện chưa sẵn sàng. Bạn có thể thử tải lại hoặc quay về danh sách.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button type="button" variant="outline" onClick={() => void orderDetailQuery.refetch()}>
              Tải lại
            </Button>
            <Button
              type="button"
              onClick={() => navigate(ROUTES.POS_MANAGEMENT)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Quay lại danh sách
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[560px] items-center justify-center rounded-[32px] bg-white p-10 shadow-sm">
        <div className="max-w-md text-center">
          <CircleAlert className="mx-auto h-16 w-16 text-slate-300" />
          <h1 className="mt-6 text-3xl font-black text-slate-900">Không tìm thấy dữ liệu order</h1>
          <p className="mt-3 text-slate-500">
            Đơn hàng này có thể đã bị xóa hoặc bạn đang mở sai liên kết chi tiết.
          </p>
          <Button
            type="button"
            onClick={() => navigate(ROUTES.POS_MANAGEMENT)}
            className="mt-6 rounded-full bg-orange-500 hover:bg-orange-600"
          >
            Quay lại danh sách order
          </Button>
        </div>
      </div>
    );
  }

  const canCancelOrder =
    canCancelOrderPermission && order.status !== 'COMPLETED' && order.status !== 'CANCELLED';
  const paymentStatus = ORDER_PAYMENT_STATUS_FALLBACK[order.status];
  const paymentMethodLabel = 'Tiền mặt';
  const summarySubtotal = order.subtotal ?? order.totalAmount;
  const summaryDiscount = order.discountAmount ?? 0;
  const summaryTaxAmount = order.taxAmount ?? 0;
  const summaryTotal = order.totalAmount;
  const paymentSectionDescription =
    'Trang này chỉ dùng dữ liệu order hiện có và tạm thời hiển thị phương thức thanh toán cố định.';

  const handleCancelOrder = async () => {
    if (!canCancelOrder) {
      toast.error(
        order.status === 'COMPLETED'
          ? 'Đơn đã hoàn tất nên không thể hủy thêm.'
          : 'Đơn này đã được hủy trước đó.'
      );
      return;
    }

    const reason = window.prompt('Lý do hủy đơn (có thể bỏ trống):', '');

    if (reason === null) {
      return;
    }

    setIsCancelling(true);

    try {
      const response = await orderService.cancelOrder(order.id, {
        reason: reason.trim() || undefined,
      });

      if (!response.success) {
        toast.error(response.error?.message ?? 'Không thể hủy đơn hàng');
        return;
      }

      toast.success('Đã hủy đơn hàng');
      await orderDetailQuery.refetch();
    } catch {
      // Axios interceptor đã xử lý toast lỗi chung.
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigate(ROUTES.POS_MANAGEMENT)}
              className="rounded-full border-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                Xem thông tin đơn hàng
              </h1>
             
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600">
              {order.orderNumber}
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* <div className="rounded-[24px] bg-slate-50 p-4">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Bàn / hình thức</p>
            <p className="mt-2 text-xl font-black text-slate-900">{order.tableName || 'Mang đi'}</p>
          </div> */}

          <div className="rounded-[24px] bg-slate-50 p-4">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Loại đơn</p>
            <p className="mt-2 text-xl font-black text-slate-900">
              {ORDER_SOURCE_LABEL[order.source] ?? order.source}
            </p>
          </div>

          {/* <div className="rounded-[24px] bg-slate-50 p-4">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Thời gian</p>
            <p className="mt-2 text-xl font-black text-slate-900">
              {order.createdAt ? formatDateTime(order.createdAt) : 'Chưa có dữ liệu'}
            </p>
          </div> */}

          <div className="rounded-[24px] bg-slate-50 p-4">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Thời gian</p>
            <p className="mt-2 text-xl font-black text-slate-900">
              {order.completedAt ? formatDateTime(order.completedAt) : 'Chưa ghi nhận'}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Chi tiết món đã đặt</h2>
              <p className="mt-1 text-sm text-slate-500">
                Danh sách món trong order tại thời điểm chốt đơn.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {order.items.length > 0 ? (
              order.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                          {item.quantity}
                        </span>
                        <p className="truncate text-lg font-black text-slate-900">{item.itemName}</p>
                      </div>

                      {Array.isArray(item.addons) && item.addons.length > 0 && (
                        <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm text-slate-500">
                          <p className="font-semibold text-slate-700">Addon</p>
                          <p className="mt-1">
                            {item.addons
                              .map((addon) => `${addon.addonName} x${addon.quantity}`)
                              .join(', ')}
                          </p>
                        </div>
                      )}

                      {item.notes && (
                        <p className="mt-3 rounded-2xl bg-orange-50 px-3 py-2 text-sm text-orange-600">
                          Ghi chú: {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-slate-500">{formatVND(item.unitPrice)} / món</p>
                      <p className="text-lg font-black text-slate-900">{formatVND(item.totalPrice)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                Order này hiện chưa có dòng món để hiển thị.
              </div>
            )}
          </div>

          {order.notes && (
            <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Ghi chú order</p>
              <p className="mt-3 text-sm text-slate-600">{order.notes}</p>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Phương thức thanh toán</h2>
                <p className="mt-1 text-sm text-slate-500">{paymentSectionDescription}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {/* <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">
                      Nguồn dữ liệu
                    </p> */}
                    <p className="mt-2 text-2xl font-black text-slate-900">{paymentMethodLabel}</p>
                  </div>

                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-bold',
                      paymentStatus.tone
                    )}
                  >
                    {paymentStatus.label}
                  </span>
                </div>
              </div>

              {/* <div className="space-y-3 rounded-[24px] border border-slate-100 bg-slate-50 p-4 text-sm">
                <div className="flex items-center justify-between gap-3 text-slate-600">
                  <span>Tiền khách thanh toán</span>
                  <span className="font-bold text-slate-900">{paymentCollectedDisplay}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-slate-600">
                  <span>Giá trị đơn hàng</span>
                  <span className="font-bold text-slate-900">{formatVND(summaryTotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-slate-600">
                  <span>Thời điểm thanh toán</span>
                  <span className="text-right font-bold text-slate-900">
                    {paymentTime ? formatDateTime(paymentTime) : 'Chưa ghi nhận'}
                  </span>
                </div>
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  {paymentSectionNotice}
                </div>
              </div> */}
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Tổng kết order</h2>
                <p className="mt-1 text-sm text-slate-500">Giá trị cuối cùng được chốt trên hệ thống.</p>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded-[24px] border border-slate-100 bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Tạm tính</span>
                <span className="font-bold text-slate-900">{formatVND(summarySubtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Giảm giá</span>
                <span className="font-bold text-slate-900">{formatVND(summaryDiscount)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Thuế</span>
                <span className="font-bold text-slate-900">{formatVND(summaryTaxAmount)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 text-xl font-black text-slate-900">
                <span>Tổng thanh toán</span>
                <span className="text-orange-500">{formatVND(summaryTotal)}</span>
              </div>
            </div>

            {canCancelOrderPermission ? (
              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canCancelOrder || isCancelling}
                  onClick={() => void handleCancelOrder()}
                  className="h-12 w-full rounded-full border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  {isCancelling
                    ? 'Đang hủy đơn hàng...'
                    : order.status === 'COMPLETED'
                      ? 'Không thể hủy đơn đã hoàn tất'
                      : order.status === 'CANCELLED'
                        ? 'Đơn hàng đã hủy'
                        : 'Hủy đơn hàng'}
                </Button>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
