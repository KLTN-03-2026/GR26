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
import { formatVND } from '@shared/utils/formatCurrency';
import { formatDate } from '@shared/utils/formatDate';

interface PurchaseOrdersTabProps {
  orders: SupplierOrder[];
}

const getStatusLabel = (status: SupplierOrder['status']): string => {
  if (status === 'completed') {
    return 'Đã nhận hàng';
  }

  if (status === 'cancelled') {
    return 'Đã hủy';
  }

  return 'Đang xử lý';
};

const getStatusClassName = (status: SupplierOrder['status']): string => {
  if (status === 'completed') {
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
export const PurchaseOrdersTab = ({ orders }: PurchaseOrdersTabProps) => {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-semibold text-gray-700">Mã đơn</TableHead>
            <TableHead className="font-semibold text-gray-700">Ngày tạo</TableHead>
            <TableHead className="text-right font-semibold text-gray-700">Tổng tiền</TableHead>
            <TableHead className="text-center font-semibold text-gray-700">Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center text-gray-500">
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
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
