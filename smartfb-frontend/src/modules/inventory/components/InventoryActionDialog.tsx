import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { NumericInput } from '@shared/components/common/NumericInput';
import { Label } from '@shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { Textarea } from '@shared/components/ui/textarea';
import type {
  AdjustStockPayload,
  ImportStockPayload,
  InventoryItemOption,
  WasteRecordPayload,
} from '../types/inventory.types';

const inventoryUuidMessage = 'ID nguyên liệu phải đúng định dạng UUID';

const importStockSchema = z.object({
  itemId: z.string().uuid(inventoryUuidMessage),
  supplierId: z.union([z.string().uuid('ID nhà cung cấp phải đúng định dạng UUID'), z.literal('')]),
  quantity: z.number().min(0.0001, 'Số lượng nhập phải lớn hơn 0'),
  costPerUnit: z.number().min(0, 'Đơn giá không được âm'),
  expiresAt: z.string(),
  note: z.string(),
});

const adjustStockSchema = z.object({
  itemId: z.string().uuid(inventoryUuidMessage),
  newQuantity: z.number().min(0, 'Số lượng mới không được âm'),
  reason: z.string().trim().min(3, 'Vui lòng nhập lý do điều chỉnh'),
});

const wasteRecordSchema = z.object({
  itemId: z.string().uuid(inventoryUuidMessage),
  quantity: z.number().min(0.0001, 'Số lượng hao hụt phải lớn hơn 0'),
  reason: z.string().trim().min(3, 'Vui lòng nhập lý do hao hụt'),
});

type InventoryActionMode = 'import' | 'adjust' | 'waste';

type ImportStockFormValues = z.infer<typeof importStockSchema>;
type AdjustStockFormValues = z.infer<typeof adjustStockSchema>;
type WasteRecordFormValues = z.infer<typeof wasteRecordSchema>;

interface InventoryActionDialogProps {
  mode: InventoryActionMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemOptions: InventoryItemOption[];
  selectedBranchName: string | null;
  defaultItemId?: string;
  isPending: boolean;
  onImportSubmit?: (payload: ImportStockPayload) => void;
  onAdjustSubmit?: (payload: AdjustStockPayload) => void;
  onWasteSubmit?: (payload: WasteRecordPayload) => void;
}

const inventoryActionCopy = {
  import: {
    title: 'Nhập kho nguyên liệu',
    description: 'Tạo lô nhập mới cho chi nhánh đang làm việc và cập nhật tồn kho ngay sau khi lưu.',
    submitLabel: 'Xác nhận nhập kho',
  },
  adjust: {
    title: 'Điều chỉnh tồn kho',
    description: 'Đặt lại số lượng tồn kho thực tế sau kiểm kê. Hệ thống sẽ ghi audit log kèm lý do.',
    submitLabel: 'Lưu điều chỉnh',
  },
  waste: {
    title: 'Ghi nhận hao hụt',
    description: 'Ghi nhận nguyên liệu hỏng, đổ vỡ hoặc hết hạn để trừ khỏi tồn kho của chi nhánh hiện tại.',
    submitLabel: 'Lưu hao hụt',
  },
} as const;

const resolveItemLabel = (itemOptions: InventoryItemOption[], itemId: string) => {
  const matchedItem = itemOptions.find((item) => item.itemId === itemId);

  if (!matchedItem) {
    return null;
  }

  return matchedItem.unit ? `${matchedItem.itemName} (${matchedItem.unit})` : matchedItem.itemName;
};

/**
 * Dialog thao tác nhập kho, điều chỉnh hoặc ghi hao hụt.
 */
export const InventoryActionDialog = ({
  mode,
  open,
  onOpenChange,
  itemOptions,
  selectedBranchName,
  defaultItemId,
  isPending,
  onImportSubmit,
  onAdjustSubmit,
  onWasteSubmit,
}: InventoryActionDialogProps) => {
  const copy = inventoryActionCopy[mode];

  const importForm = useForm<ImportStockFormValues>({
    resolver: zodResolver(importStockSchema),
    defaultValues: {
      itemId: defaultItemId ?? '',
      supplierId: '',
      quantity: 1,
      costPerUnit: 0,
      expiresAt: '',
      note: '',
    },
  });

  const adjustForm = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: {
      itemId: defaultItemId ?? '',
      newQuantity: 0,
      reason: '',
    },
  });

  const wasteForm = useForm<WasteRecordFormValues>({
    resolver: zodResolver(wasteRecordSchema),
    defaultValues: {
      itemId: defaultItemId ?? '',
      quantity: 1,
      reason: '',
    },
  });

  useEffect(() => {
    if (!open) {
      importForm.reset({
        itemId: defaultItemId ?? '',
        supplierId: '',
        quantity: 1,
        costPerUnit: 0,
        expiresAt: '',
        note: '',
      });
      adjustForm.reset({
        itemId: defaultItemId ?? '',
        newQuantity: 0,
        reason: '',
      });
      wasteForm.reset({
        itemId: defaultItemId ?? '',
        quantity: 1,
        reason: '',
      });
      return;
    }

    if (defaultItemId) {
      importForm.setValue('itemId', defaultItemId);
      adjustForm.setValue('itemId', defaultItemId);
      wasteForm.setValue('itemId', defaultItemId);
    }
  }, [adjustForm, defaultItemId, importForm, open, wasteForm]);

  const watchedImportItemId = useWatch({ control: importForm.control, name: 'itemId' });
  const watchedImportQuantity = useWatch({ control: importForm.control, name: 'quantity' });
  const watchedImportCostPerUnit = useWatch({ control: importForm.control, name: 'costPerUnit' });
  const watchedAdjustItemId = useWatch({ control: adjustForm.control, name: 'itemId' });
  const watchedAdjustNewQuantity = useWatch({ control: adjustForm.control, name: 'newQuantity' });
  const watchedWasteItemId = useWatch({ control: wasteForm.control, name: 'itemId' });
  const watchedWasteQuantity = useWatch({ control: wasteForm.control, name: 'quantity' });

  const selectedItemLabel = useMemo(() => {
    const selectedItemId =
      mode === 'import'
        ? watchedImportItemId
        : mode === 'adjust'
          ? watchedAdjustItemId
          : watchedWasteItemId;

    if (!selectedItemId) {
      return null;
    }

    return resolveItemLabel(itemOptions, selectedItemId);
  }, [itemOptions, mode, watchedAdjustItemId, watchedImportItemId, watchedWasteItemId]);

  const renderItemInput = (
    itemId: string,
    onItemChange: (value: string) => void,
    errorMessage?: string,
  ) => {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`${mode}-item-id`}>
          Nguyên liệu <span className="text-red-500">*</span>
        </Label>
        <Select value={itemId} onValueChange={onItemChange}>
          <SelectTrigger id={`${mode}-item-id`}>
            <SelectValue placeholder="Chọn nguyên liệu" />
          </SelectTrigger>
          <SelectContent>
            {itemOptions.map((item) => (
              <SelectItem key={item.itemId} value={item.itemId}>
                {resolveItemLabel(itemOptions, item.itemId) ?? 'Nguyên liệu'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedItemLabel && <p className="text-xs text-text-secondary">Đã chọn: {selectedItemLabel}</p>}
        {!selectedItemLabel && itemOptions.length > 0 && (
          <p className="text-xs text-text-secondary">
            Chọn nguyên liệu từ danh sách đang có trong kho để thực hiện thao tác.
          </p>
        )}
        {itemOptions.length === 0 && (
          <p className="text-xs text-text-secondary">
            Chưa có nguyên liệu khả dụng trong kho của chi nhánh hiện tại.
          </p>
        )}
        {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            {copy.description}
            {selectedBranchName ? ` Chi nhánh hiện tại: ${selectedBranchName}.` : ''}
          </DialogDescription>
        </DialogHeader>

        {mode === 'import' && (
          <form
            onSubmit={importForm.handleSubmit((values) => {
              onImportSubmit?.({
                itemId: values.itemId,
                supplierId: values.supplierId || null,
                quantity: values.quantity,
                costPerUnit: values.costPerUnit,
                expiresAt: values.expiresAt || null,
                note: values.note || null,
              });
            })}
            className="space-y-4"
          >
            {renderItemInput(
              watchedImportItemId ?? '',
              (value) => {
                importForm.setValue('itemId', value, { shouldDirty: true, shouldValidate: true });
              },
              importForm.formState.errors.itemId?.message,
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="import-quantity">
                  Số lượng nhập <span className="text-red-500">*</span>
                </Label>
                <NumericInput
                  id="import-quantity"
                  allowDecimal
                  min={0.0001}
                  step="0.0001"
                  value={watchedImportQuantity}
                  onValueChange={(value) => {
                    importForm.setValue('quantity', value, { shouldDirty: true, shouldValidate: true });
                  }}
                />
                {importForm.formState.errors.quantity && (
                  <p className="text-xs text-red-500">{importForm.formState.errors.quantity.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="import-cost">
                  Đơn giá nhập <span className="text-red-500">*</span>
                </Label>
                <NumericInput
                  id="import-cost"
                  allowDecimal
                  min={0}
                  step="0.0001"
                  value={watchedImportCostPerUnit}
                  onValueChange={(value) => {
                    importForm.setValue('costPerUnit', value, { shouldDirty: true, shouldValidate: true });
                  }}
                />
                {importForm.formState.errors.costPerUnit && (
                  <p className="text-xs text-red-500">{importForm.formState.errors.costPerUnit.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="import-supplier">ID nhà cung cấp</Label>
                <Input id="import-supplier" {...importForm.register('supplierId')} placeholder="Tùy chọn" />
                {importForm.formState.errors.supplierId && (
                  <p className="text-xs text-red-500">{importForm.formState.errors.supplierId.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="import-expiry">Hạn sử dụng</Label>
                <Input id="import-expiry" type="datetime-local" {...importForm.register('expiresAt')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="import-note">Ghi chú</Label>
              <Textarea
                id="import-note"
                rows={3}
                {...importForm.register('note')}
                placeholder="Ví dụ: nhập lô đầu tuần từ nhà cung cấp A"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Đang xử lý...' : copy.submitLabel}
              </Button>
            </DialogFooter>
          </form>
        )}

        {mode === 'adjust' && (
          <form
            onSubmit={adjustForm.handleSubmit((values) => {
              onAdjustSubmit?.({
                itemId: values.itemId,
                newQuantity: values.newQuantity,
                reason: values.reason,
              });
            })}
            className="space-y-4"
          >
            {renderItemInput(
              watchedAdjustItemId ?? '',
              (value) => {
                adjustForm.setValue('itemId', value, { shouldDirty: true, shouldValidate: true });
              },
              adjustForm.formState.errors.itemId?.message,
            )}

            <div className="space-y-1.5">
              <Label htmlFor="adjust-new-quantity">
                Số lượng tồn mới <span className="text-red-500">*</span>
              </Label>
              <NumericInput
                id="adjust-new-quantity"
                allowDecimal
                min={0}
                step="0.0001"
                value={watchedAdjustNewQuantity}
                onValueChange={(value) => {
                  adjustForm.setValue('newQuantity', value, { shouldDirty: true, shouldValidate: true });
                }}
              />
              {adjustForm.formState.errors.newQuantity && (
                <p className="text-xs text-red-500">{adjustForm.formState.errors.newQuantity.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adjust-reason">
                Lý do điều chỉnh <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="adjust-reason"
                rows={4}
                {...adjustForm.register('reason')}
                placeholder="Ví dụ: chốt số lượng thực tế sau kiểm kê cuối ngày"
              />
              {adjustForm.formState.errors.reason && (
                <p className="text-xs text-red-500">{adjustForm.formState.errors.reason.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Đang xử lý...' : copy.submitLabel}
              </Button>
            </DialogFooter>
          </form>
        )}

        {mode === 'waste' && (
          <form
            onSubmit={wasteForm.handleSubmit((values) => {
              onWasteSubmit?.({
                itemId: values.itemId,
                quantity: values.quantity,
                reason: values.reason,
              });
            })}
            className="space-y-4"
          >
            {renderItemInput(
              watchedWasteItemId ?? '',
              (value) => {
                wasteForm.setValue('itemId', value, { shouldDirty: true, shouldValidate: true });
              },
              wasteForm.formState.errors.itemId?.message,
            )}

            <div className="space-y-1.5">
              <Label htmlFor="waste-quantity">
                Số lượng hao hụt <span className="text-red-500">*</span>
              </Label>
              <NumericInput
                id="waste-quantity"
                allowDecimal
                min={0.0001}
                step="0.0001"
                value={watchedWasteQuantity}
                onValueChange={(value) => {
                  wasteForm.setValue('quantity', value, { shouldDirty: true, shouldValidate: true });
                }}
              />
              {wasteForm.formState.errors.quantity && (
                <p className="text-xs text-red-500">{wasteForm.formState.errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="waste-reason">
                Lý do hao hụt <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="waste-reason"
                rows={4}
                {...wasteForm.register('reason')}
                placeholder="Ví dụ: nguyên liệu hỏng do quá hạn hoặc đổ vỡ"
              />
              {wasteForm.formState.errors.reason && (
                <p className="text-xs text-red-500">{wasteForm.formState.errors.reason.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Đang xử lý...' : copy.submitLabel}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
