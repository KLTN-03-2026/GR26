import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Badge } from '@shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { usePurchaseOrderDetail } from '@modules/supplier/hooks/usePurchaseOrders';
import { formatVND } from '@shared/utils/formatCurrency';
import { formatDate } from '@shared/utils/formatDate';
import type { BackendPurchaseOrderDetail, BackendPurchaseOrderStatus } from '../../types/supplier.types';

interface PurchaseOrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
}

const getStatusLabel = (status: BackendPurchaseOrderStatus): string => {
  if (status === 'DRAFT') {
    return 'Nháp';
  }

  if (status === 'SENT') {
    return 'Đã đặt hàng';
  }

  if (status === 'RECEIVED') {
    return 'Đã nhận hàng';
  }

  return 'Đã hủy';
};

const getStatusClassName = (status: BackendPurchaseOrderStatus): string => {
  if (status === 'DRAFT') {
    return 'bg-slate-100 text-slate-700';
  }

  if (status === 'SENT') {
    return 'bg-blue-100 text-blue-700';
  }

  if (status === 'RECEIVED') {
    return 'bg-green-100 text-green-700';
  }

  return 'bg-red-100 text-red-700';
};

const toNumber = (value: number | string): number => Number(value);

const getOrderTotal = (order: BackendPurchaseOrderDetail): number => Number(order.totalAmount);

/**
 * Dialog xem chi tiết đơn mua hàng gồm thông tin chung và từng nguyên liệu đặt mua.
 */
export const PurchaseOrderDetailDialog = ({
  open,
  onOpenChange,
  orderId,
}: PurchaseOrderDetailDialogProps) => {
  const { data: order, isLoading, isError } = usePurchaseOrderDetail(open ? orderId : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[920px]">
        <DialogHeader>
          <DialogTitle>Chi tiết đơn mua hàng</DialogTitle>
          <DialogDescription>
            Xem nguyên liệu, số lượng và trạng thái xử lý của đơn mua hàng.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-sm text-gray-500">
            Đang tải chi tiết đơn mua hàng...
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            Không thể tải chi tiết đơn mua hàng. Vui lòng thử lại.
          </div>
        ) : null}

        {!isLoading && !isError && order ? (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm md:grid-cols-3">
              <div>
                <p className="text-gray-500">Mã đơn</p>
                <p className="mt-1 font-semibold text-gray-900">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Trạng thái</p>
                <Badge className={getStatusClassName(order.status)}>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500">Tổng giá trị</p>
                <p className="mt-1 font-semibold text-orange-600">
                  {formatVND(getOrderTotal(order))}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Ngày tạo</p>
                <p className="mt-1 font-medium text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-500">Ngày dự kiến nhận</p>
                <p className="mt-1 font-medium text-gray-900">
                  {order.expectedDate ? formatDate(order.expectedDate) : 'Chưa đặt'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Ngày nhận hàng</p>
                <p className="mt-1 font-medium text-gray-900">
                  {order.receivedAt ? formatDate(order.receivedAt) : 'Chưa nhận'}
                </p>
              </div>
              {order.note ? (
                <div className="md:col-span-3">
                  <p className="text-gray-500">Ghi chú</p>
                  <p className="mt-1 font-medium text-gray-900">{order.note}</p>
                </div>
              ) : null}
              {order.cancelReason ? (
                <div className="md:col-span-3">
                  <p className="text-gray-500">Lý do hủy</p>
                  <p className="mt-1 font-medium text-red-600">{order.cancelReason}</p>
                </div>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700">Nguyên liệu</TableHead>
                    <TableHead className="font-semibold text-gray-700">Đơn vị</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Số lượng</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Đơn giá</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-gray-900">{item.itemName}</TableCell>
                      <TableCell className="text-gray-600">{item.unit || 'N/A'}</TableCell>
                      <TableCell className="text-right text-gray-700">
                        {toNumber(item.quantity).toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-right text-gray-700">
                        {formatVND(toNumber(item.unitPrice))}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">
                        {formatVND(toNumber(item.totalPrice))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
