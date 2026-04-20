import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { DateRangePicker, type DateRangePickerValue } from '@shared/components/common/DateRangePicker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { Button } from '@shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { cn } from '@shared/utils/cn';
import { formatDateTime } from '@shared/utils/formatDate';
import { useInventoryTransactions } from '../hooks/useInventoryTransactions';
import type { InventoryTransactionType } from '../types/inventory.types';

// Nhãn hiển thị cho từng loại giao dịch kho
const TRANSACTION_TYPE_LABELS: Record<InventoryTransactionType, string> = {
  IMPORT: 'Nhập kho',
  SALE_DEDUCT: 'Bán hàng',
  WASTE: 'Hao hụt',
  ADJUSTMENT: 'Điều chỉnh',
  PRODUCTION_IN: 'Nhập sản xuất',
  PRODUCTION_OUT: 'Xuất sản xuất',
};

// Màu badge theo loại giao dịch
const TRANSACTION_TYPE_COLORS: Record<InventoryTransactionType, string> = {
  IMPORT: 'bg-emerald-50 text-emerald-700',
  SALE_DEDUCT: 'bg-blue-50 text-blue-700',
  WASTE: 'bg-red-50 text-red-700',
  ADJUSTMENT: 'bg-amber-50 text-amber-700',
  PRODUCTION_IN: 'bg-purple-50 text-purple-700',
  PRODUCTION_OUT: 'bg-orange-50 text-orange-700',
};

const PAGE_SIZE = 20;

/**
 * Bảng lịch sử giao dịch kho: nhập, xuất, điều chỉnh, hao hụt.
 * Sử dụng server-side pagination và filter theo loại + khoảng ngày.
 */
export const InventoryTransactionHistory = () => {
  const [typeFilter, setTypeFilter] = useState<InventoryTransactionType | 'all'>('all');
  const [dateRange, setDateRange] = useState<DateRangePickerValue>({});
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch, isFetching } = useInventoryTransactions({
    type: typeFilter === 'all' ? null : typeFilter,
    from: dateRange.from ? new Date(dateRange.from).toISOString() : null,
    to: dateRange.to ? new Date(dateRange.to + 'T23:59:59').toISOString() : null,
    page,
    size: PAGE_SIZE,
  });

  const transactions = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  const handleTypeChange = (value: string) => {
    setTypeFilter(value as InventoryTransactionType | 'all');
    setPage(0);
  };

  const handleDateRangeChange = (value: DateRangePickerValue) => {
    setDateRange(value);
    setPage(0);
  };

  const formatQuantity = (qty: number, type: InventoryTransactionType) => {
    // Số dương = nhập vào, số âm = xuất ra
    const abs = Math.abs(qty);
    const formatted = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(abs);
    const isOut = qty < 0 || type === 'SALE_DEDUCT' || type === 'WASTE' || type === 'PRODUCTION_OUT';
    return (
      <span className={cn('font-medium', isOut ? 'text-red-600' : 'text-emerald-600')}>
        {isOut ? '−' : '+'}{formatted}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar lọc */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tất cả loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {(Object.keys(TRANSACTION_TYPE_LABELS) as InventoryTransactionType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {TRANSACTION_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          placeholder="Từ ngày - Đến ngày"
          className="w-full justify-start sm:w-[320px]"
        />

        {(typeFilter !== 'all' || dateRange.from || dateRange.to) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTypeFilter('all');
              setDateRange({});
              setPage(0);
            }}
          >
            Xóa bộ lọc
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="ml-auto"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </Button>
      </div>

      {/* Bảng */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="spinner spinner-md" />
        </div>
      ) : isError ? (
        <div className="rounded-card border border-red-200 bg-red-50 px-6 py-10 text-center">
          <p className="text-base font-semibold text-red-700">Không thể tải lịch sử giao dịch</p>
          <Button className="mt-4" onClick={() => void refetch()}>Thử lại</Button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-base font-semibold text-text-primary">Chưa có giao dịch nào</p>
          <p className="mt-2 text-sm text-text-secondary">Thử thay đổi bộ lọc để xem giao dịch khác.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-cream">
                <TableHead>Thời gian</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Nguyên liệu</TableHead>
                <TableHead>Số lượng</TableHead>
                <TableHead>Đơn giá</TableHead>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap text-sm text-text-secondary">
                    {formatDateTime(tx.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                        TRANSACTION_TYPE_COLORS[tx.type],
                      )}
                    >
                      {TRANSACTION_TYPE_LABELS[tx.type]}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-text-primary">
                    {tx.itemName?.trim() || 'Nguyên liệu không xác định'}
                  </TableCell>
                  <TableCell>{formatQuantity(tx.quantity, tx.type)}</TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {tx.costPerUnit != null
                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          tx.costPerUnit,
                        )
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {tx.staffName?.trim() || '—'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-text-secondary">
                    {tx.note?.trim() || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Phân trang */}
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-text-secondary md:flex-row md:items-center md:justify-between">
            <p>Tổng {totalElements.toLocaleString('vi-VN')} giao dịch</p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0 || isFetching}
                >
                  Trước
                </Button>
                <span>
                  Trang {page + 1} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1 || isFetching}
                >
                  Sau
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
