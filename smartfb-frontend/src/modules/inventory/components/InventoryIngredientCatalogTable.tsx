import { CheckCircle2, CircleDashed, PencilLine, Trash2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import type { InventoryIngredientCatalogRow } from '@modules/inventory/types/inventory.types';

interface InventoryIngredientCatalogTableProps {
  canEditItem?: boolean;
  currentPage: number;
  items: InventoryIngredientCatalogRow[];
  onDeleteItem?: (item: InventoryIngredientCatalogRow) => void;
  onEditItem?: (item: InventoryIngredientCatalogRow) => void;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

const formatQuantity = (value: number, unit: string | null) => {
  const formattedValue = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 4,
  }).format(value);

  return unit ? `${formattedValue} ${unit}` : formattedValue;
};

const renderCatalogStatus = (item: InventoryIngredientCatalogRow) => {
  if (!item.hasStock) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        <CircleDashed className="h-3.5 w-3.5" />
        Chưa nhập kho
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Đã có tồn kho
    </span>
  );
};

/**
 * Bảng hiển thị danh mục nguyên liệu đã tạo.
 * Khác với bảng tồn kho ở chỗ dữ liệu có thể chưa phát sinh balance tại chi nhánh nào.
 */
export const InventoryIngredientCatalogTable = ({
  canEditItem = false,
  currentPage,
  items,
  onDeleteItem,
  onEditItem,
  onPageChange,
  pageSize,
  totalItems,
  totalPages,
}: InventoryIngredientCatalogTableProps) => {
  if (items.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-lg font-semibold text-text-primary">
          Không tìm thấy nguyên liệu phù hợp trong danh mục
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          Nguyên liệu vừa tạo sẽ xuất hiện tại đây kể cả khi chưa có nhập kho.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-cream">
            <TableHead>Nguyên liệu</TableHead>
            <TableHead>Đơn vị</TableHead>
            <TableHead>Trạng thái kho</TableHead>
            <TableHead>Chi nhánh đã nhập</TableHead>
            <TableHead>Tổng tồn hiện có</TableHead>
            {canEditItem ? <TableHead className="w-[180px] text-right">Thao tác</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.itemId}>
              <TableCell>
                <p className="font-semibold text-text-primary">{item.itemName}</p>
              </TableCell>
              <TableCell>{item.unit ?? 'Chưa có đơn vị'}</TableCell>
              <TableCell>{renderCatalogStatus(item)}</TableCell>
              <TableCell>{item.stockBranchCount}</TableCell>
              <TableCell>
                {item.hasStock ? formatQuantity(item.totalQuantity, item.unit) : '0'}
              </TableCell>
              {canEditItem ? (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEditItem?.(item)}
                    >
                      <PencilLine className="h-4 w-4" />
                      Sửa
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                      onClick={() => onDeleteItem?.(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </Button>
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 ? (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-text-secondary md:flex-row md:items-center md:justify-between">
          <p>
            Hiển thị {(currentPage - 1) * pageSize + 1} đến{' '}
            {Math.min((currentPage - 1) * pageSize + items.length, totalItems)} trên {totalItems}{' '}
            nguyên liệu
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
      ) : null}
    </div>
  );
};
