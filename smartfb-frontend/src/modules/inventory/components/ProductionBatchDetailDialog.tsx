import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';
import { formatDateTime } from '@shared/utils/formatDate';
import { formatNumber } from '@shared/utils/formatCurrency';
import { useProductionBatchDetail } from '@modules/inventory/hooks/useProductionBatchDetail';
import type { ProductionBatch, ProductionBatchStatus } from '@modules/inventory/types/inventory.types';

interface ProductionBatchDetailDialogProps {
  open: boolean;
  batchId: string | null;
  onOpenChange: (open: boolean) => void;
}

interface DetailItemProps {
  label: string;
  value: string;
  valueClassName?: string;
}

// Nhãn trạng thái mẻ sản xuất trong dialog chi tiết.
const PRODUCTION_BATCH_STATUS_LABELS: Record<ProductionBatchStatus, string> = {
  CONFIRMED: 'Đã ghi nhận',
};

// Màu trạng thái mẻ sản xuất trong dialog chi tiết.
const PRODUCTION_BATCH_STATUS_COLORS: Record<ProductionBatchStatus, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700',
};

const formatQuantity = (quantity: number, unit: string) => {
  return `${formatNumber(quantity)} ${unit}`;
};

const getDeltaClassName = (delta: number) => {
  if (delta > 0) return 'text-emerald-600';
  if (delta < 0) return 'text-red-600';
  return 'text-text-secondary';
};

const formatDelta = (batch: ProductionBatch) => {
  if (batch.deltaOutput === 0) {
    return `0 ${batch.unit}`;
  }

  const prefix = batch.deltaOutput > 0 ? '+' : '-';
  return `${prefix}${formatQuantity(Math.abs(batch.deltaOutput), batch.unit)}`;
};

const DetailItem = ({ label, value, valueClassName }: DetailItemProps) => (
  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
    <p className="text-xs font-medium uppercase text-text-secondary">{label}</p>
    <p className={cn('mt-1 break-words text-sm font-medium text-text-primary', valueClassName)}>
      {value}
    </p>
  </div>
);

/**
 * Dialog hiển thị chi tiết một mẻ sản xuất bán thành phẩm.
 */
export const ProductionBatchDetailDialog = ({
  open,
  batchId,
  onOpenChange,
}: ProductionBatchDetailDialogProps) => {
  const { data: batch, isLoading, isError, refetch, isFetching } = useProductionBatchDetail(batchId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết mẻ sản xuất</DialogTitle>
          <DialogDescription>
            Xem sản lượng, nhân viên ghi nhận và thông tin đối chiếu của mẻ sản xuất bán thành phẩm.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="spinner spinner-md" />
          </div>
        ) : isError ? (
          <div className="rounded-card border border-red-200 bg-red-50 px-6 py-8 text-center">
            <p className="text-base font-semibold text-red-700">Không thể tải chi tiết mẻ sản xuất</p>
            <p className="mt-2 text-sm text-red-600">
              Kiểm tra quyền xem kho hoặc thử tải lại dữ liệu chi tiết.
            </p>
            <Button className="mt-4" onClick={() => void refetch()} disabled={isFetching}>
              Thử lại
            </Button>
          </div>
        ) : batch ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-text-secondary">Bán thành phẩm</p>
                <h3 className="mt-1 text-lg font-semibold text-text-primary">
                  {batch.subAssemblyItemName?.trim() || 'Bán thành phẩm không xác định'}
                </h3>
                <p className="mt-1 text-sm text-text-secondary">Mã mẻ: {batch.id}</p>
              </div>
              <span
                className={cn(
                  'inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium',
                  PRODUCTION_BATCH_STATUS_COLORS[batch.status],
                )}
              >
                {PRODUCTION_BATCH_STATUS_LABELS[batch.status]}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <DetailItem
                label="Sản lượng chuẩn"
                value={formatQuantity(batch.expectedOutput, batch.unit)}
              />
              <DetailItem
                label="Sản lượng thực tế"
                value={formatQuantity(batch.actualOutput, batch.unit)}
              />
              <DetailItem
                label="Chênh lệch"
                value={formatDelta(batch)}
                valueClassName={getDeltaClassName(batch.deltaOutput)}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem
                label="Nhân viên ghi nhận"
                value={batch.staffName?.trim() || 'Nhân viên không xác định'}
              />
              <DetailItem label="Thời điểm sản xuất" value={formatDateTime(batch.producedAt)} />
              <DetailItem label="Thời điểm tạo record" value={formatDateTime(batch.createdAt)} />
              <DetailItem label="ID bán thành phẩm" value={batch.subAssemblyItemId} />
            </div>

            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <p className="text-xs font-medium uppercase text-text-secondary">Ghi chú</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">
                {batch.note?.trim() || 'Không có ghi chú'}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-border bg-card px-6 py-8 text-center">
            <p className="text-base font-semibold text-text-primary">Chưa chọn mẻ sản xuất</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
