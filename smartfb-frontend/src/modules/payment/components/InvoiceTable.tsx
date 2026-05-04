import { Eye } from 'lucide-react';
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
import { formatDateTime } from '@shared/utils/formatDate';
import type { InvoiceSearchItemResponse } from '../types/payment.types';

interface InvoiceTableProps {
  invoices: InvoiceSearchItemResponse[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  emptyMessage: string;
  onViewInvoice: (invoiceId: string) => void;
  onPageChange: (page: number) => void;
}

/**
 * Bảng danh sách hóa đơn thu đã phát hành từ module thanh toán.
 */
export const InvoiceTable = ({
  invoices,
  currentPage,
  totalPages,
  totalItems,
  emptyMessage,
  onViewInvoice,
  onPageChange,
}: InvoiceTableProps) => {
  if (invoices.length === 0) {
    return (
      <section className="rounded-card border border-dashed border-border bg-card px-6 py-10 text-center shadow-card">
        <h2 className="text-lg font-semibold text-text-primary">Chưa có dữ liệu hóa đơn thu</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-card border border-border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã hóa đơn</TableHead>
            <TableHead>Tổng tiền</TableHead>
            <TableHead>Thời điểm phát hành</TableHead>
            <TableHead className="w-[160px] text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-semibold text-text-primary">{invoice.invoiceNumber}</TableCell>
              <TableCell className="font-semibold text-text-primary">{formatVND(invoice.total)}</TableCell>
              <TableCell>{formatDateTime(invoice.issuedAt)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onViewInvoice(invoice.id)}>
                    <Eye className="h-4 w-4" />
                    Xem chi tiết
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-text-secondary md:flex-row md:items-center md:justify-between">
        <p>
          Hiển thị {invoices.length} / {totalItems} hóa đơn thu
        </p>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage <= 0}
          >
            Trước
          </Button>
          <span className="min-w-[96px] text-center text-text-primary">
            Trang {currentPage + 1} / {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(Math.max(totalPages - 1, 0), currentPage + 1))}
            disabled={totalPages === 0 || currentPage >= totalPages - 1}
          >
            Sau
          </Button>
        </div>
      </div>
    </section>
  );
};
