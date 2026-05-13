import type { SupplierOrder } from '../../types/supplier.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { formatVND } from '@shared/utils/formatCurrency';
import { formatDate } from '@shared/utils/formatDate';

interface PurchaseOrdersTabProps {
  orders: SupplierOrder[];
  canSendOrder?: boolean;
  canReceiveOrder?: boolean;
  isActionPending?: boolean;
  onViewOrder?: (order: SupplierOrder) => void;
  onSendOrder?: (order: SupplierOrder) => void;
  onReceiveOrder?: (order: SupplierOrder) => void;
}

const getStatusLabel = (status: SupplierOrder['status']): string => {
  if (status === 'draft') {
    return 'Nháp';
  }

  if (status === 'sent') {
    return 'Đã đặt hàng';
  }

  if (status === 'received') {
    return 'Đã nhận hàng';
  }

  if (status === 'cancelled') {
    return 'Đã hủy';
  }

  return 'Đang xử lý';
};

const getStatusClassName = (status: SupplierOrder['status']): string => {
  if (status === 'draft') {
    return 'bg-slate-100 text-slate-700';
  }

  if (status === 'sent') {
    return 'bg-blue-100 text-blue-700';
  }

  if (status === 'received') {
    return 'bg-green-100 text-green-700';
  }

  if (status === 'cancelled') {
    return 'bg-red-100 text-red-700';
  }

  return 'bg-amber-100 text-amber-700';
};

/**
 * Tab hiển thị đơn mua hàng của nhà cung cấp từ API purchase-orders.
 */
export const PurchaseOrdersTab = ({
  orders,
  canSendOrder = false,
  canReceiveOrder = false,
  isActionPending = false,
  onViewOrder,
  onSendOrder,
  onReceiveOrder,
}: PurchaseOrdersTabProps) => {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-semibold text-gray-700">Mã đơn</TableHead>
            <TableHead className="font-semibold text-gray-700">Ngày tạo</TableHead>
            <TableHead className="text-right font-semibold text-gray-700">Tổng tiền</TableHead>
            <TableHead className="text-center font-semibold text-gray-700">Trạng thái</TableHead>
            <TableHead className="text-right font-semibold text-gray-700">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                Chưa có đơn mua hàng cho nhà cung cấp này
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-semibold text-gray-900">{order.orderNumber}</TableCell>
                <TableCell className="text-gray-600">{formatDate(order.entryDate)}</TableCell>
                <TableCell className="text-right font-semibold text-orange-600">
                  {formatVND(order.totalAmount)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={getStatusClassName(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {onViewOrder ? (
                      <Button size="sm" variant="outline" onClick={() => onViewOrder(order)}>
                        Xem
                      </Button>
                    ) : null}
                    {order.status === 'draft' && canSendOrder && onSendOrder ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isActionPending}
                        onClick={() => onSendOrder(order)}
                      >
                        Đã đặt hàng
                      </Button>
                    ) : null}
                    {order.status === 'sent' && canReceiveOrder && onReceiveOrder ? (
                      <Button
                        size="sm"
                        disabled={isActionPending}
                        onClick={() => onReceiveOrder(order)}
                      >
                        Xác nhận nhận hàng
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
