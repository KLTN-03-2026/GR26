import { AdminDataTableShell } from '@modules/admin/components/AdminDataTableShell';
import { Button } from '@shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { formatVND } from '@shared/utils/formatCurrency';
import { formatDate } from '@shared/utils/formatDate';
import { CheckCircle2, Eye, XCircle } from 'lucide-react';
import type { AdminInvoice } from '../types/adminBilling.types';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface AdminInvoiceTableProps {
  invoices: AdminInvoice[];
  onViewDetail: (invoice: AdminInvoice) => void;
  onMarkPaid: (invoice: AdminInvoice) => void;
  onCancelInvoice: (invoice: AdminInvoice) => void;
}

/**
 * Bảng hóa đơn subscription trong khu vực admin.
 */
export const AdminInvoiceTable = ({
  invoices,
  onViewDetail,
  onMarkPaid,
  onCancelInvoice,
}: AdminInvoiceTableProps) => {
  return (
    <AdminDataTableShell>
      <Table className="min-w-[1040px]">
        <TableHeader className="bg-admin-gray-50">
          <TableRow className="hover:bg-admin-gray-50">
            <TableHead className="text-admin-gray-500">Hóa đơn</TableHead>
            <TableHead className="text-admin-gray-500">Tenant</TableHead>
            <TableHead className="text-admin-gray-500">Gói</TableHead>
            <TableHead className="text-admin-gray-500">Số tiền</TableHead>
            <TableHead className="text-admin-gray-500">Chu kỳ</TableHead>
            <TableHead className="text-admin-gray-500">Trạng thái</TableHead>
            <TableHead className="text-right text-admin-gray-500">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className="hover:bg-admin-gray-50">
              <TableCell>
                <p className="font-semibold text-admin-gray-900">{invoice.invoiceNumber}</p>
                <p className="mt-1 text-sm text-admin-gray-500">
                  Tạo ngày {formatDate(invoice.createdAt)}
                </p>
              </TableCell>
              <TableCell className="text-sm text-admin-gray-700">{invoice.tenantName}</TableCell>
              <TableCell className="text-sm text-admin-gray-700">{invoice.planName}</TableCell>
              <TableCell className="font-semibold text-admin-gray-900">
                {formatVND(invoice.amount)}
              </TableCell>
              <TableCell className="text-sm text-admin-gray-700">
                {formatDate(invoice.billingPeriodStart)} - {formatDate(invoice.billingPeriodEnd)}
              </TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-admin-gray-200 text-admin-gray-700 hover:bg-admin-gray-50"
                    onClick={() => onViewDetail(invoice)}
                  >
                    <Eye className="h-4 w-4" />
                    Xem
                  </Button>
                  {invoice.status === 'UNPAID' ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-admin-success text-admin-success hover:bg-admin-success-light"
                        onClick={() => onMarkPaid(invoice)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Đã trả
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-admin-error text-admin-error hover:bg-admin-error-light"
                        onClick={() => onCancelInvoice(invoice)}
                      >
                        <XCircle className="h-4 w-4" />
                        Hủy
                      </Button>
                    </>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AdminDataTableShell>
  );
};
