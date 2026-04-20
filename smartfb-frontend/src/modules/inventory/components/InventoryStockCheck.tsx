import { CheckCircle, ClipboardList } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { cn } from '@shared/utils/cn';
import { useInventoryStockCheck } from '../hooks/useInventoryStockCheck';
import type { StockCheckEntry } from '../types/inventory.types';

const formatQuantity = (value: number, unit: string | null) => {
  const formatted = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
};

/**
 * Màn hình kiểm kho: hiển thị số lượng hệ thống, cho phép nhập số lượng thực tế và lưu từng dòng.
 * Khi lưu, gọi API điều chỉnh tồn kho với lý do "Kiểm kho".
 */
export const InventoryStockCheck = () => {
  const { checkEntries, dirtyCount, isLoading, isError, onQuantityChange, onSaveEntry, onRefetch } =
    useInventoryStockCheck();

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="spinner spinner-md" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-card border border-red-200 bg-red-50 px-6 py-10 text-center">
        <p className="text-base font-semibold text-red-700">Không thể tải dữ liệu tồn kho</p>
        <Button className="mt-4" onClick={onRefetch}>Thử lại</Button>
      </div>
    );
  }

  if (checkEntries.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-card px-6 py-12 text-center">
        <ClipboardList className="mx-auto mb-3 h-10 w-10 text-text-secondary" />
        <p className="text-base font-semibold text-text-primary">Chưa có nguyên liệu nào trong kho</p>
        <p className="mt-2 text-sm text-text-secondary">Hãy nhập kho nguyên liệu trước khi kiểm kho.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header hướng dẫn */}
      <div className="rounded-card border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-sm font-semibold text-amber-800">Hướng dẫn kiểm kho</p>
        <p className="mt-1 text-sm text-amber-700">
          Nhập số lượng thực tế đếm được vào cột <strong>"Số lượng thực tế"</strong>, sau đó nhấn{' '}
          <strong>"Lưu"</strong> trên từng dòng để cập nhật tồn kho. Hệ thống sẽ ghi nhận giao dịch điều
          chỉnh tự động.
        </p>
        {dirtyCount > 0 && (
          <p className="mt-2 text-sm font-medium text-amber-800">
            Có {dirtyCount} dòng đang chờ lưu.
          </p>
        )}
      </div>

      {/* Bảng kiểm kho */}
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-cream">
              <TableHead>Nguyên liệu</TableHead>
              <TableHead>Đơn vị</TableHead>
              <TableHead>Tồn trong hệ thống</TableHead>
              <TableHead>Số lượng thực tế</TableHead>
              <TableHead>Chênh lệch</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checkEntries.map((entry) => (
              <StockCheckRow
                key={entry.balanceId}
                entry={entry}
                onQuantityChange={onQuantityChange}
                onSave={onSaveEntry}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

interface StockCheckRowProps {
  entry: StockCheckEntry;
  onQuantityChange: (balanceId: string, value: string) => void;
  onSave: (entry: StockCheckEntry) => Promise<void>;
}

const StockCheckRow = ({ entry, onQuantityChange, onSave }: StockCheckRowProps) => {
  const parsedActual = parseFloat(entry.actualQuantity);
  const isValidInput = !isNaN(parsedActual) && parsedActual >= 0;
  const delta = isValidInput ? parsedActual - entry.currentQuantity : null;

  return (
    <TableRow className={cn(entry.isDirty && 'bg-amber-50/40')}>
      <TableCell className="font-medium text-text-primary">
        {entry.itemName?.trim() || 'Nguyên liệu không xác định'}
      </TableCell>
      <TableCell className="text-sm text-text-secondary">{entry.unit ?? '—'}</TableCell>
      <TableCell className="text-sm">{formatQuantity(entry.currentQuantity, null)}</TableCell>
      <TableCell>
        <Input
          type="text"
          inputMode="decimal"
          value={entry.actualQuantity}
          onChange={(e) => {
            // Chỉ cho nhập số và tối đa 1 dấu chấm thập phân
            const sanitized = e.target.value
              .replace(/[^0-9.]/g, '')
              .replace(/(\..*)\./g, '$1');
            onQuantityChange(entry.balanceId, sanitized);
          }}
          placeholder={String(entry.currentQuantity)}
          className={cn(
            'w-32',
            entry.isDirty && !isValidInput && 'border-red-400 focus-visible:ring-red-400',
          )}
          disabled={entry.isSaving}
        />
      </TableCell>
      <TableCell>
        {delta != null ? (
          <span
            className={cn(
              'text-sm font-medium',
              delta > 0 && 'text-emerald-600',
              delta < 0 && 'text-red-600',
              delta === 0 && 'text-text-secondary',
            )}
          >
            {delta > 0 ? `+${delta.toFixed(3)}` : delta < 0 ? delta.toFixed(3) : 'Khớp'}
          </span>
        ) : (
          <span className="text-sm text-text-secondary">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {entry.isDirty && isValidInput ? (
          <Button
            type="button"
            size="sm"
            onClick={() => void onSave(entry)}
            disabled={entry.isSaving}
            className="gap-1.5"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {entry.isSaving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  );
};
