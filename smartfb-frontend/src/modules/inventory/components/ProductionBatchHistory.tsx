import { useState } from 'react';
import { Eye, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';
import { formatDateTime } from '@shared/utils/formatDate';
import { formatNumber } from '@shared/utils/formatCurrency';
import { ProductionBatchDetailDialog } from '@modules/inventory/components/ProductionBatchDetailDialog';
import { useProductionBatches } from '@modules/inventory/hooks/useProductionBatches';
import type { ProductionBatch, ProductionBatchStatus } from '@modules/inventory/types/inventory.types';

const PAGE_SIZE = 20;

// Nhãn trạng thái mẻ sản xuất theo nghiệp vụ kho.
const PRODUCTION_BATCH_STATUS_LABELS: Record<ProductionBatchStatus, string> = {
  CONFIRMED: 'Đã ghi nhận',
};

// Màu badge trạng thái mẻ sản xuất.
const PRODUCTION_BATCH_STATUS_COLORS: Record<ProductionBatchStatus, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700',
};

const formatQuantity = (quantity: number, unit: string) => {
  const formattedQuantity = formatNumber(quantity);
  return `${formattedQuantity} ${unit}`;
};

const formatDelta = (batch: ProductionBatch) => {
  const absDelta = Math.abs(batch.deltaOutput);
  const formattedDelta = formatQuantity(absDelta, batch.unit);

  if (batch.deltaOutput === 0) {
    return <span className="font-medium text-text-secondary">0 {batch.unit}</span>;
  }

  return (
    <span className={cn('font-medium', batch.deltaOutput > 0 ? 'text-emerald-600' : 'text-red-600')}>
      {batch.deltaOutput > 0 ? '+' : '-'}
      {formattedDelta}
    </span>
  );
};

/**
 * Bảng lịch sử mẻ sản xuất bán thành phẩm.
 * Dữ liệu lấy từ production_batches để xem đúng một mẻ sản xuất thay vì từng giao dịch kho.
 */
export const ProductionBatchHistory = () => {
  const [page, setPage] = useState(0);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useProductionBatches({
    page,
    size: PAGE_SIZE,
  });

  const batches = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Lịch sử sản xuất bán thành phẩm
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Theo dõi từng mẻ sản xuất, sản lượng thực tế và chênh lệch so với công thức.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="w-full gap-2 md:w-auto"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Làm mới
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="spinner spinner-md" />
          </div>
        ) : isError ? (
          <div className="rounded-card border border-red-200 bg-red-50 px-6 py-10 text-center">
            <p className="text-base font-semibold text-red-700">Không thể tải lịch sử sản xuất</p>
            <p className="mt-2 text-sm text-red-600">
              Kiểm tra quyền xem kho hoặc kết nối backend rồi thử lại.
            </p>
            <Button className="mt-4" onClick={() => void refetch()}>
              Thử lại
            </Button>
          </div>
        ) : batches.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-card px-6 py-12 text-center">
            <p className="text-base font-semibold text-text-primary">Chưa có mẻ sản xuất nào</p>
            <p className="mt-2 text-sm text-text-secondary">
              Khi ghi nhận sản xuất bán thành phẩm, lịch sử mẻ sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
            <div className="flex flex-col gap-2 border-b border-border px-4 py-3 text-sm text-text-secondary md:flex-row md:items-center md:justify-between">
              <p>
                Hiển thị {batches.length.toLocaleString('vi-VN')} / {totalElements.toLocaleString('vi-VN')}{' '}
                mẻ sản xuất
              </p>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-cream">
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Bán thành phẩm</TableHead>
                    <TableHead>Sản lượng chuẩn</TableHead>
                    <TableHead>Sản lượng thực tế</TableHead>
                    <TableHead>Chênh lệch</TableHead>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="w-16 text-right">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="whitespace-nowrap text-sm text-text-secondary">
                        {formatDateTime(batch.producedAt)}
                      </TableCell>
                      <TableCell className="min-w-[180px] font-medium text-text-primary">
                        {batch.subAssemblyItemName?.trim() || 'Bán thành phẩm không xác định'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-text-secondary">
                        {formatQuantity(batch.expectedOutput, batch.unit)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium text-text-primary">
                        {formatQuantity(batch.actualOutput, batch.unit)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDelta(batch)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-text-secondary">
                        {batch.staffName?.trim() || 'Nhân viên không xác định'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                            PRODUCTION_BATCH_STATUS_COLORS[batch.status],
                          )}
                        >
                          {PRODUCTION_BATCH_STATUS_LABELS[batch.status]}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm text-text-secondary">
                        {batch.note?.trim() || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Xem chi tiết mẻ sản xuất"
                          onClick={() => setSelectedBatchId(batch.id)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Xem chi tiết mẻ sản xuất</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-text-secondary md:flex-row md:items-center md:justify-between">
              <p>Tổng {totalElements.toLocaleString('vi-VN')} mẻ sản xuất</p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((currentPage) => currentPage - 1)}
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
                    onClick={() => setPage((currentPage) => currentPage + 1)}
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

      <ProductionBatchDetailDialog
        batchId={selectedBatchId}
        open={Boolean(selectedBatchId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBatchId(null);
          }
        }}
      />
    </>
  );
};
