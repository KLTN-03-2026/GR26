import { ReceiptText, ShoppingBag, Wallet } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { formatVND } from '@shared/utils/formatCurrency';
import { formatDateTime } from '@shared/utils/formatDate';
import { useInvoiceDetail } from '../hooks/useInvoiceDetail';

/**
 * Map giá trị paymentMethod từ BE sang nhãn tiếng Việt hiển thị cho người dùng.
 */
const mapPaymentMethodLabel = (method: string): string => {
  switch (method?.toUpperCase()) {
    case 'CASH': return 'Tiền mặt';
    case 'VIETQR': return 'VietQR';
    case 'MOMO': return 'MoMo';
    default: return method ?? 'Không rõ';
  }
};

/**
 * Map source của order sang nhãn nghiệp vụ trong hóa đơn.
 */
const mapOrderSourceLabel = (source?: string | null): string => {
  switch (source?.toUpperCase()) {
    case 'IN_STORE': return 'Tại chỗ';
    case 'TAKEAWAY': return 'Mang về';
    case 'DELIVERY': return 'Giao hàng';
    default: return source ?? 'Chưa xác định';
  }
};

interface InvoiceDetailDialogProps {
  open: boolean;
  invoiceId: string | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog xem chi tiết hóa đơn thu chỉ từ API invoice detail.
 */
export const InvoiceDetailDialog = ({
  open,
  invoiceId,
  onOpenChange,
}: InvoiceDetailDialogProps) => {
  const { data, isLoading, isError, refetch } = useInvoiceDetail(invoiceId, open);
  const totalItemQuantity = data?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const hasItemAddons = data?.items.some((item) => item.addons && item.addons.length > 0) ?? false;
  const orderInfo = data?.order;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Chi tiết hóa đơn thu</DialogTitle>
     
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <div className="spinner spinner-md" />
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-card border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-lg font-semibold text-red-700">Không thể tải chi tiết hóa đơn</p>
            <p className="mt-2 text-sm text-red-600">
              Hệ thống chưa lấy được dữ liệu hóa đơn thu đang chọn. Vui lòng thử lại.
            </p>
            <Button className="mt-5" onClick={() => void refetch()}>
              Tải lại
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError && data ? (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <section className="rounded-card border border-border bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Thông tin hóa đơn</p>
                    {/* <p className="text-lg font-semibold text-text-primary">{data.invoiceNumber}</p> */}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3 text-text-secondary">
                    <span>Mã hóa đơn</span>
                    <span className="font-semibold text-text-primary">{data.invoiceNumber}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-text-secondary">
                    <span>Phương thức</span>
                    <span className="font-semibold text-text-primary">{mapPaymentMethodLabel(data.paymentMethod)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-text-secondary">
                    <span>Thời điểm phát hành</span>
                    <span className="font-semibold text-text-primary">{formatDateTime(data.issuedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-text-secondary">
                    <span>Số món</span>
                    <span className="font-semibold text-text-primary">{totalItemQuantity}</span>
                  </div>
                </div>
              </section>

              <section className="rounded-card border border-border bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Thông tin đơn hàng</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {orderInfo?.orderNumber ?? 'Chưa xác định'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3 text-text-secondary">
                    <span>Người order</span>
                    <span className="font-semibold text-text-primary">{orderInfo?.staffName ?? 'Chưa xác định'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-text-secondary">
                    <span>Hình thức</span>
                    <span className="font-semibold text-text-primary">{mapOrderSourceLabel(orderInfo?.source)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-text-secondary">
                    <span>Số bàn</span>
                    <span className="font-semibold text-text-primary">{orderInfo?.tableName ?? 'Không gắn bàn'}</span>
                  </div>
                </div>
              </section>

              <section className="rounded-card border border-border bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Tổng quan giá trị</p>
                    <p className="text-lg font-semibold text-text-primary">{formatVND(data.total)}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3 text-text-secondary">
                    <span>Tạm tính</span>
                    <span className="font-semibold text-text-primary">{formatVND(data.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-text-secondary">
                    <span>Giảm giá</span>
                    <span className="font-semibold text-text-primary">{formatVND(data.discount)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-text-secondary">
                    <span>Thuế</span>
                    <span className="font-semibold text-text-primary">{formatVND(data.taxAmount)}</span>
                  </div>
                </div>
              </section>
            </div>

            <section className="overflow-hidden rounded-card border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Món</TableHead>
                    {hasItemAddons ? <TableHead>Topping</TableHead> : null}
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Đơn giá</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => (
                    <TableRow key={`${item.itemName}-${item.unitPrice}-${item.quantity}`}>
                      <TableCell className="font-semibold text-text-primary">{item.itemName}</TableCell>
                      {hasItemAddons ? (
                        <TableCell>
                          {item.addons && item.addons.length > 0 ? (
                            <div className="space-y-1 text-sm text-text-secondary">
                              {item.addons.map((addon) => (
                                <p key={`${addon.addonId}-${addon.quantity}`}>
                                  {addon.addonName} x{addon.quantity}
                                  <span className="ml-1 text-xs">
                                    (+{formatVND(addon.extraPrice)})
                                  </span>
                                </p>
                              ))}
                            </div>
                          ) : (
                            <span className="text-text-secondary">—</span>
                          )}
                        </TableCell>
                      ) : null}
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatVND(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-semibold text-text-primary">
                        {formatVND(item.totalPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>

            <section className="ml-auto w-full max-w-md rounded-card border border-border bg-slate-50 p-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3 text-text-secondary">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-text-primary">{formatVND(data.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-text-secondary">
                  <span>Giảm giá</span>
                  <span className="font-semibold text-text-primary">{formatVND(data.discount)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-text-secondary">
                  <span>Thuế</span>
                  <span className="font-semibold text-text-primary">{formatVND(data.taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 pt-2 text-base font-semibold text-text-primary">
                  <span>Tổng thanh toán</span>
                  <span className="text-orange-500">{formatVND(data.total)}</span>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
