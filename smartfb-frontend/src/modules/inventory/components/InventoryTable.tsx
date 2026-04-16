import { AlertTriangle, PencilLine, ShieldAlert } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { Button } from '@shared/components/ui/button';
import { formatDateTime } from '@shared/utils/formatDate';
import { cn } from '@shared/utils/cn';
import type { InventoryBalance } from '../types/inventory.types';

interface InventoryTableProps {
  balances: InventoryBalance[];
  itemLabel: string;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  canAdjust: boolean;
  canWaste: boolean;
  isActionPending: boolean;
  onPageChange: (page: number) => void;
  onAdjustItem: (itemId: string, branchId: string) => void;
  onWasteItem: (itemId: string, branchId: string) => void;
  resolveBranchName: (branchId: string) => string;
}

const capitalizeLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const formatQuantity = (value: number, unit: string | null) => {
  const formattedValue = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 4,
  }).format(value);

  return unit ? `${formattedValue} ${unit}` : formattedValue;
};

const renderStockBadge = (balance: InventoryBalance) => {
  if (balance.isLowStock) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        Cần nhập thêm
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      Ổn định
    </span>
  );
};

/**
 * Bảng hiển thị danh sách tồn kho nguyên liệu.
 */
export const InventoryTable = ({
  balances,
  itemLabel,
  totalItems,
  currentPage,
  totalPages,
  pageSize,
  canAdjust,
  canWaste,
  isActionPending,
  onPageChange,
  onAdjustItem,
  onWasteItem,
  resolveBranchName,
}: InventoryTableProps) => {
  const itemLabelTitle = capitalizeLabel(itemLabel);

  if (balances.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-lg font-semibold text-text-primary">
          Chưa có dữ liệu tồn kho {itemLabel} phù hợp
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          Thử đổi bộ lọc để xem nhanh toàn chuỗi hoặc chọn một dòng tồn kho cụ thể để thao tác theo chi nhánh.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-cream">
            <TableHead>{itemLabelTitle}</TableHead>
            <TableHead>Chi nhánh</TableHead>
            <TableHead>Tồn hiện tại</TableHead>
            <TableHead>Mức tối thiểu</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Cập nhật cuối</TableHead>
            <TableHead className={cn(!(canAdjust || canWaste) && 'hidden', 'text-right')}>
              Thao tác
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {balances.map((balance) => (
            <TableRow key={balance.id}>
              <TableCell>
                <p className="font-semibold text-text-primary">
                  {balance.itemName?.trim() || `Chưa có tên ${itemLabel}`}
                </p>
              </TableCell>
              <TableCell>{resolveBranchName(balance.branchId)}</TableCell>
              <TableCell className={cn(balance.isLowStock && 'font-semibold text-red-600')}>
                {formatQuantity(balance.quantity, balance.unit)}
              </TableCell>
              <TableCell>{formatQuantity(balance.minLevel, balance.unit)}</TableCell>
              <TableCell>{renderStockBadge(balance)}</TableCell>
              <TableCell>{formatDateTime(balance.updatedAt)}</TableCell>
              <TableCell className={cn(!(canAdjust || canWaste) && 'hidden')}>
                <div className="flex justify-end gap-2">
                  {canWaste && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onWasteItem(balance.itemId, balance.branchId)}
                      disabled={isActionPending}
                      aria-label={`Ghi hao hụt cho ${balance.itemName?.trim() || itemLabel}`}
                      title="Ghi hao hụt"
                    >
                      <ShieldAlert className="h-4 w-4" />
                    </Button>
                  )}
                  {canAdjust && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onAdjustItem(balance.itemId, balance.branchId)}
                      disabled={isActionPending}
                      aria-label={`Điều chỉnh kho cho ${balance.itemName?.trim() || itemLabel}`}
                      title="Điều chỉnh kho"
                    >
                      <PencilLine className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-text-secondary md:flex-row md:items-center md:justify-between">
          <p>
            Hiển thị {(currentPage - 1) * pageSize + 1} đến{' '}
            {Math.min((currentPage - 1) * pageSize + balances.length, totalItems)} trên {totalItems} dòng tồn kho
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <span>
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
