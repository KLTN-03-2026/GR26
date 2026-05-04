import { useMemo, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { SearchableCombobox } from '@shared/components/common/SearchableCombobox';
import { useInventoryIngredientOptions } from '@modules/inventory/hooks/useInventoryIngredientOptions';
import { useCreatePurchaseOrder } from '@modules/supplier/hooks/usePurchaseOrders';
import { formatVND } from '@shared/utils/formatCurrency';
import type { CreatePurchaseOrderPayload } from '../../types/supplier.types';

interface CreatePurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  supplierName: string;
}

interface PurchaseOrderLineForm {
  localId: string;
  itemId: string;
  itemName: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  note: string;
}

const createEmptyLine = (): PurchaseOrderLineForm => ({
  localId: `line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  itemId: '',
  itemName: '',
  unit: '',
  quantity: '1',
  unitPrice: '0',
  note: '',
});

const toPositiveNumber = (value: string): number => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

/**
 * Dialog tạo đơn mua hàng nháp cho một nhà cung cấp.
 */
export const CreatePurchaseOrderDialog = ({
  open,
  onOpenChange,
  supplierId,
  supplierName,
}: CreatePurchaseOrderDialogProps) => {
  const { data: ingredientOptions = [], isLoading: isLoadingIngredients } = useInventoryIngredientOptions();
  const createPurchaseOrder = useCreatePurchaseOrder();
  const [expectedDate, setExpectedDate] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<PurchaseOrderLineForm[]>(() => [createEmptyLine()]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const comboboxOptions = useMemo(
    () =>
      ingredientOptions.map((item) => ({
        value: item.itemId,
        label: item.itemName,
        description: item.unit ? `Đơn vị: ${item.unit}` : 'Chưa có đơn vị chuẩn',
        keywords: [item.unit],
      })),
    [ingredientOptions],
  );

  const totalAmount = useMemo(
    () =>
      lines.reduce((sum, line) => {
        return sum + toPositiveNumber(line.quantity) * toPositiveNumber(line.unitPrice);
      }, 0),
    [lines],
  );

  const resetForm = () => {
    setExpectedDate('');
    setNote('');
    setLines([createEmptyLine()]);
    setErrors({});
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  };

  const updateLine = <K extends keyof PurchaseOrderLineForm>(
    localId: string,
    field: K,
    value: PurchaseOrderLineForm[K],
  ) => {
    setLines((prev) =>
      prev.map((line) => (line.localId === localId ? { ...line, [field]: value } : line)),
    );
  };

  const handleSelectIngredient = (localId: string, itemId: string) => {
    const selectedItem = ingredientOptions.find((item) => item.itemId === itemId);

    setLines((prev) =>
      prev.map((line) => {
        if (line.localId !== localId) {
          return line;
        }

        return {
          ...line,
          itemId,
          itemName: selectedItem?.itemName ?? '',
          unit: selectedItem?.unit ?? line.unit,
        };
      }),
    );
  };

  const handleAddLine = () => {
    setLines((prev) => [...prev, createEmptyLine()]);
  };

  const handleRemoveLine = (localId: string) => {
    setLines((prev) => {
      if (prev.length === 1) {
        return prev;
      }

      return prev.filter((line) => line.localId !== localId);
    });
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    lines.forEach((line, index) => {
      if (!line.itemId) {
        nextErrors[`item-${line.localId}`] = `Dòng ${index + 1}: Chưa chọn nguyên liệu`;
      }

      if (toPositiveNumber(line.quantity) <= 0) {
        nextErrors[`quantity-${line.localId}`] = `Dòng ${index + 1}: Số lượng phải lớn hơn 0`;
      }

      if (toPositiveNumber(line.unitPrice) < 0) {
        nextErrors[`unitPrice-${line.localId}`] = `Dòng ${index + 1}: Đơn giá không được âm`;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (): CreatePurchaseOrderPayload => ({
    supplierId,
    note: note.trim() || undefined,
    expectedDate: expectedDate || undefined,
    items: lines.map((line) => ({
      itemId: line.itemId,
      itemName: line.itemName.trim(),
      unit: line.unit.trim() || undefined,
      quantity: toPositiveNumber(line.quantity),
      unitPrice: toPositiveNumber(line.unitPrice),
      note: line.note.trim() || undefined,
    })),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    createPurchaseOrder.mutate(buildPayload(), {
      onSuccess: () => {
        resetForm();
        onOpenChange(false);
      },
    });
  };

  const firstError = Object.values(errors)[0];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[920px]">
        <DialogHeader>
          <DialogTitle>Tạo đơn mua hàng</DialogTitle>
          <DialogDescription>
            Tạo đơn nháp cho nhà cung cấp {supplierName}. Sau khi tạo có thể gửi đơn ở bước tiếp theo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              <Label htmlFor="purchase-expected-date">Ngày dự kiến nhận</Label>
              <Input
                id="purchase-expected-date"
                type="date"
                value={expectedDate}
                onChange={(event) => setExpectedDate(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase-note">Ghi chú</Label>
              <Textarea
                id="purchase-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="VD: Nhập nguyên liệu cho tuần này"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label>Nguyên liệu đặt mua</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
                <Plus className="mr-2 h-4 w-4" />
                Thêm dòng
              </Button>
            </div>

            <div className="space-y-3">
              {lines.map((line, index) => (
                <div
                  key={line.localId}
                  className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 md:grid-cols-[minmax(220px,1fr)_90px_110px_130px_minmax(160px,1fr)_40px]"
                >
                  <div className="space-y-1.5">
                    <Label>Nguyên liệu {index + 1}</Label>
                    <SearchableCombobox
                      value={line.itemId}
                      options={comboboxOptions}
                      placeholder={isLoadingIngredients ? 'Đang tải nguyên liệu...' : 'Chọn nguyên liệu'}
                      searchPlaceholder="Tìm nguyên liệu"
                      emptyMessage="Không có nguyên liệu phù hợp"
                      disabled={isLoadingIngredients || createPurchaseOrder.isPending}
                      onValueChange={(value) => handleSelectIngredient(line.localId, value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Đơn vị</Label>
                    <Input
                      value={line.unit}
                      onChange={(event) => updateLine(line.localId, 'unit', event.target.value)}
                      placeholder="kg"
                      disabled={createPurchaseOrder.isPending}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Số lượng</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.quantity}
                      onChange={(event) => updateLine(line.localId, 'quantity', event.target.value)}
                      disabled={createPurchaseOrder.isPending}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Đơn giá</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      value={line.unitPrice}
                      onChange={(event) => updateLine(line.localId, 'unitPrice', event.target.value)}
                      disabled={createPurchaseOrder.isPending}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Ghi chú dòng</Label>
                    <Input
                      value={line.note}
                      onChange={(event) => updateLine(line.localId, 'note', event.target.value)}
                      placeholder="Tùy chọn"
                      disabled={createPurchaseOrder.isPending}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 p-0"
                      disabled={lines.length === 1 || createPurchaseOrder.isPending}
                      onClick={() => handleRemoveLine(line.localId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {firstError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{firstError}</p>
          ) : null}

          <div className="flex items-center justify-between rounded-lg bg-orange-50 px-4 py-3">
            <span className="text-sm font-medium text-orange-700">Tổng giá trị dự kiến</span>
            <span className="text-lg font-bold text-orange-700">{formatVND(totalAmount)}</span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createPurchaseOrder.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={createPurchaseOrder.isPending || isLoadingIngredients}>
              {createPurchaseOrder.isPending ? 'Đang tạo...' : 'Tạo đơn nháp'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
