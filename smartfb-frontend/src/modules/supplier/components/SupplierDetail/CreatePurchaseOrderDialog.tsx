import { useMemo, useState, type FormEvent } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
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
import {
  SearchableCombobox,
  type SearchableComboboxOption,
} from '@shared/components/common/SearchableCombobox';
import { NumericInput } from '@shared/components/common/NumericInput';
import { RadioGroup, RadioGroupItem } from '@shared/components/ui/radio-group';
import { selectCurrentBranchId, useAuthStore } from '@modules/auth/stores/authStore';
import { useInventoryIngredientOptions } from '@modules/inventory/hooks/useInventoryIngredientOptions';
import {
  calculatePackagingConversion,
  formatComputedNumber,
  resolvePackageLabelSuggestions,
  resolvePackagingUnitOptions,
  resolvePackagingUnitSelection,
  type PackagingPriceMode,
} from '@modules/inventory/utils/unitConversion';
import {
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
} from '@modules/supplier/hooks/usePurchaseOrders';
import { formatVND } from '@shared/utils/formatCurrency';
import { cn } from '@shared/utils/cn';
import type {
  BackendPurchaseOrderDetail,
  CreatePurchaseOrderPayload,
} from '../../types/supplier.types';

interface CreatePurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  supplierName: string;
  purchaseOrderId?: string;
  initialOrder?: BackendPurchaseOrderDetail;
  isLoadingOrder?: boolean;
}

interface PurchaseOrderLineForm {
  localId: string;
  itemId: string;
  itemName: string;
  unit: string;
  inputMode: PurchaseOrderInputMode;
  quantity: number;
  unitPrice: number;
  packageCount: number;
  packageLabel: string;
  contentPerPackage: number;
  contentUnit: string;
  packagingPriceMode: PackagingPriceMode;
  totalCost: number;
  costPerPackage: number;
  note: string;
}

type PurchaseOrderInputMode = 'standard' | 'packaging';

const createEmptyLine = (): PurchaseOrderLineForm => ({
  localId: `line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  itemId: '',
  itemName: '',
  unit: '',
  inputMode: 'standard',
  quantity: 1,
  unitPrice: 0,
  packageCount: 1,
  packageLabel: '',
  contentPerPackage: 1,
  contentUnit: '',
  packagingPriceMode: 'total',
  totalCost: 0,
  costPerPackage: 0,
  note: '',
});

const mapOrderToLines = (order?: BackendPurchaseOrderDetail): PurchaseOrderLineForm[] => {
  if (!order?.items.length) {
    return [createEmptyLine()];
  }

  return order.items.map((item) => ({
    ...createEmptyLine(),
    itemId: item.itemId,
    itemName: item.itemName,
    unit: item.unit ?? '',
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    totalCost: Number(item.totalPrice),
    note: '',
  }));
};

const getPackagingValues = (line: PurchaseOrderLineForm) => {
  return calculatePackagingConversion({
    packageCount: line.packageCount,
    contentPerPackage: line.contentPerPackage,
    contentUnit: line.contentUnit,
    standardUnit: line.unit,
    packagingPriceMode: line.packagingPriceMode,
    totalCost: line.totalCost,
    costPerPackage: line.costPerPackage,
  });
};

const getLineTotal = (line: PurchaseOrderLineForm) => {
  if (line.inputMode === 'packaging') {
    return getPackagingValues(line).totalCost;
  }

  return line.quantity * line.unitPrice;
};

const buildPackagingNote = (line: PurchaseOrderLineForm) => {
  if (line.inputMode !== 'packaging') {
    return line.note.trim() || undefined;
  }

  const packagingValues = getPackagingValues(line);
  const packageLabel = line.packageLabel.trim() || 'kiện';
  const baseNote = line.note.trim();
  const packagingNote = `Quy cách: ${formatComputedNumber(line.packageCount)} ${packageLabel} x ${formatComputedNumber(line.contentPerPackage)} ${packagingValues.contentUnitLabel}; quy đổi ${formatComputedNumber(packagingValues.quantity)} ${line.unit || 'đơn vị chuẩn'}.`;

  return baseNote ? `${baseNote} | ${packagingNote}` : packagingNote;
};

const hasLineError = (errors: Record<string, string>, localId: string) =>
  Object.keys(errors).some((key) => key.endsWith(`-${localId}`));

/**
 * Dialog tạo hoặc cập nhật đơn mua hàng nháp cho một nhà cung cấp.
 */
export const CreatePurchaseOrderDialog = ({
  open,
  onOpenChange,
  supplierId,
  supplierName,
  purchaseOrderId,
  initialOrder,
  isLoadingOrder = false,
}: CreatePurchaseOrderDialogProps) => {
  const currentBranchId = useAuthStore(selectCurrentBranchId);
  const { data: ingredientOptions = [], isLoading: isLoadingIngredients } = useInventoryIngredientOptions();
  const createPurchaseOrder = useCreatePurchaseOrder();
  const updatePurchaseOrder = useUpdatePurchaseOrder();
  const [expectedDate, setExpectedDate] = useState(() => initialOrder?.expectedDate ?? '');
  const [note, setNote] = useState(() => initialOrder?.note ?? '');
  const [lines, setLines] = useState<PurchaseOrderLineForm[]>(() => mapOrderToLines(initialOrder));
  const [openLineIds, setOpenLineIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditMode = Boolean(purchaseOrderId);
  const isSubmitting = createPurchaseOrder.isPending || updatePurchaseOrder.isPending;
  const effectiveBranchId = initialOrder?.branchId ?? currentBranchId ?? undefined;

  const comboboxOptions = useMemo<SearchableComboboxOption[]>(
    () =>
      ingredientOptions.map((item) => ({
        value: item.itemId,
        label: item.itemName,
        description: item.unit ? `Đơn vị: ${item.unit}` : 'Chưa có đơn vị chuẩn',
        keywords: [item.itemId, item.unit ?? ''],
      })),
    [ingredientOptions],
  );

  const totalAmount = useMemo(
    () =>
      lines.reduce((sum, line) => {
        return sum + getLineTotal(line);
      }, 0),
    [lines],
  );

  const resetForm = () => {
    setExpectedDate('');
    setNote('');
    setLines([createEmptyLine()]);
    setOpenLineIds([]);
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
          unit: selectedItem?.unit ?? '',
          contentUnit: selectedItem?.unit ?? '',
        };
      }),
    );
  };

  const toggleLineDetails = (localId: string) => {
    setOpenLineIds((prev) =>
      prev.includes(localId)
        ? prev.filter((id) => id !== localId)
        : [...prev, localId],
    );
  };

  const handleAddLine = () => {
    const nextLine = createEmptyLine();
    setLines((prev) => [...prev, nextLine]);
    setOpenLineIds((prev) => [...prev, nextLine.localId]);
  };

  const handleRemoveLine = (localId: string) => {
    setLines((prev) => {
      if (prev.length === 1) {
        return prev;
      }

      return prev.filter((line) => line.localId !== localId);
    });
    setOpenLineIds((prev) => prev.filter((id) => id !== localId));
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!effectiveBranchId) {
      nextErrors.branch = isEditMode
        ? 'Không xác định được chi nhánh của đơn mua hàng'
        : 'Vui lòng chọn một chi nhánh làm việc trước khi tạo đơn mua hàng';
    }

    lines.forEach((line, index) => {
      if (!line.itemId) {
        nextErrors[`item-${line.localId}`] = `Dòng ${index + 1}: Chưa chọn nguyên liệu`;
      }

      if (!line.unit.trim()) {
        nextErrors[`unit-${line.localId}`] = `Dòng ${index + 1}: Nguyên liệu chưa có đơn vị chuẩn để quy đổi`;
      }

      if (line.inputMode === 'standard' && line.quantity <= 0) {
        nextErrors[`quantity-${line.localId}`] = `Dòng ${index + 1}: Số lượng phải lớn hơn 0`;
      }

      if (line.inputMode === 'standard' && line.unitPrice < 0) {
        nextErrors[`unitPrice-${line.localId}`] = `Dòng ${index + 1}: Đơn giá không được âm`;
      }

      if (line.inputMode === 'packaging') {
        const packagingValues = getPackagingValues(line);
        const resolvedUnitOption = resolvePackagingUnitSelection(line.contentUnit, line.unit);

        if (line.packageCount <= 0) {
          nextErrors[`packageCount-${line.localId}`] = `Dòng ${index + 1}: Số kiện phải lớn hơn 0`;
        }

        if (!line.packageLabel.trim()) {
          nextErrors[`packageLabel-${line.localId}`] = `Dòng ${index + 1}: Chưa nhập đơn vị kiện`;
        }

        if (line.contentPerPackage <= 0) {
          nextErrors[`contentPerPackage-${line.localId}`] = `Dòng ${index + 1}: Lượng trong mỗi kiện phải lớn hơn 0`;
        }

        if (!resolvedUnitOption) {
          nextErrors[`contentUnit-${line.localId}`] = `Dòng ${index + 1}: Đơn vị quy đổi phải trùng hoặc cùng hệ với đơn vị chuẩn`;
        }

        if (line.packagingPriceMode === 'total' && line.totalCost < 0) {
          nextErrors[`totalCost-${line.localId}`] = `Dòng ${index + 1}: Tổng tiền lô không được âm`;
        }

        if (line.packagingPriceMode === 'per-package' && line.costPerPackage < 0) {
          nextErrors[`costPerPackage-${line.localId}`] = `Dòng ${index + 1}: Giá mỗi kiện không được âm`;
        }

        if (packagingValues.quantity <= 0) {
          nextErrors[`convertedQuantity-${line.localId}`] = `Dòng ${index + 1}: Số lượng quy đổi phải lớn hơn 0`;
        }
      }
    });

    setErrors(nextErrors);
    setOpenLineIds((prev) =>
      Array.from(
        new Set([
          ...prev,
          ...lines.filter((line) => hasLineError(nextErrors, line.localId)).map((line) => line.localId),
        ]),
      ),
    );
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (): CreatePurchaseOrderPayload => ({
    branchId: effectiveBranchId,
    supplierId,
    note: note.trim() || undefined,
    expectedDate: expectedDate || undefined,
    items: lines.map((line) => {
      const packagingValues = getPackagingValues(line);
      const quantity = line.inputMode === 'packaging' ? packagingValues.quantity : line.quantity;
      const unitPrice = line.inputMode === 'packaging' ? packagingValues.unitPrice : line.unitPrice;

      return {
        itemId: line.itemId,
        itemName: line.itemName.trim(),
        unit: line.unit.trim() || undefined,
        quantity,
        unitPrice,
        note: buildPackagingNote(line),
      };
    }),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const payload = buildPayload();
    const onSuccess = () => {
      resetForm();
      onOpenChange(false);
    };

    if (purchaseOrderId) {
      updatePurchaseOrder.mutate({ id: purchaseOrderId, payload }, { onSuccess });
      return;
    }

    createPurchaseOrder.mutate(payload, { onSuccess });
  };

  const firstError = Object.values(errors)[0];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-0 sm:max-w-[1100px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Sửa đơn mua hàng' : 'Tạo đơn mua hàng'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Cập nhật đơn nháp của nhà cung cấp ${supplierName}.`
              : `Tạo đơn nháp cho nhà cung cấp ${supplierName}.`}
          </DialogDescription>
        </DialogHeader>

        {isLoadingOrder ? (
          <div className="py-10 text-center text-sm text-gray-500">Đang tải thông tin đơn mua hàng...</div>
        ) : (
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
              {lines.map((line, index) => {
                const standardUnitLabel = line.unit.trim() || 'đơn vị';
                const packagingValues = getPackagingValues(line);
                const packagingUnitOptions = resolvePackagingUnitOptions(line.unit);
                const packageLabelOptions = resolvePackageLabelSuggestions(line.unit).map((packageLabel) => ({
                  value: packageLabel,
                  label: packageLabel,
                }));
                const contentUnitOptions = packagingUnitOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                  keywords: [...(option.keywords ?? [])],
                }));
                const isDetailsOpen = openLineIds.includes(line.localId);
                const lineHasValidationError = hasLineError(errors, line.localId);

                return (
                  <div
                    key={line.localId}
                    className={cn(
                      'space-y-4 rounded-lg border bg-gray-50 p-3',
                      lineHasValidationError ? 'border-red-200 bg-red-50/40' : 'border-gray-200',
                    )}
                  >
                    <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_150px_200px_40px_40px]">
                      <div className="space-y-1.5">
                        <Label>Nguyên liệu {index + 1}</Label>
                        <SearchableCombobox
                          value={line.itemId}
                          options={comboboxOptions}
                          placeholder={isLoadingIngredients ? 'Đang tải nguyên liệu...' : 'Chọn nguyên liệu'}
                          searchPlaceholder="Tìm nguyên liệu"
                          emptyMessage="Không có nguyên liệu phù hợp"
                          disabled={isLoadingIngredients || isSubmitting}
                          onValueChange={(value) => handleSelectIngredient(line.localId, value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Đơn vị kho</Label>
                        <div className="flex h-10 items-center rounded-md border sm:text-nowrap border-gray-200 bg-white px-3 text-sm text-gray-700">
                          {standardUnitLabel}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Thành tiền</Label>
                        <div className="flex h-10 items-center justify-end rounded-md border border-orange-100 bg-white px-3 text-sm font-semibold text-orange-700">
                          {formatVND(getLineTotal(line))}
                        </div>
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 w-full justify-between px-3"
                          onClick={() => toggleLineDetails(line.localId)}
                        >
                          {isDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-0"
                          disabled={lines.length === 1 || isSubmitting}
                          onClick={() => handleRemoveLine(line.localId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {isDetailsOpen ? (
                      <>
                        <RadioGroup
                          value={line.inputMode}
                          onValueChange={(value) =>
                            updateLine(line.localId, 'inputMode', value as PurchaseOrderInputMode)
                          }
                          className="grid gap-3 md:grid-cols-2"
                        >
                          <label
                            htmlFor={`po-standard-${line.localId}`}
                            className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 bg-white px-3 py-3"
                          >
                            <RadioGroupItem value="standard" id={`po-standard-${line.localId}`} className="mt-0.5" />
                            <span className="text-sm font-medium text-gray-800">Theo đơn vị kho</span>
                          </label>

                          <label
                            htmlFor={`po-packaging-${line.localId}`}
                            className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 bg-white px-3 py-3"
                          >
                            <RadioGroupItem value="packaging" id={`po-packaging-${line.localId}`} className="mt-0.5" />
                            <span className="text-sm font-medium text-gray-800">Theo quy cách đóng gói</span>
                          </label>
                        </RadioGroup>

                        {line.inputMode === 'standard' ? (
                          <div className="grid gap-3 md:grid-cols-[140px_170px_minmax(180px,1fr)]">
                            <div className="space-y-1.5">
                              <Label>Số lượng</Label>
                              <NumericInput
                                allowDecimal
                                min={0.0001}
                                step="0.0001"
                                value={line.quantity}
                                disabled={isSubmitting}
                                onValueChange={(value) => updateLine(line.localId, 'quantity', value)}
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label>Đơn giá / {standardUnitLabel}</Label>
                              <NumericInput
                                allowDecimal
                                min={0}
                                step="0.0001"
                                value={line.unitPrice}
                                disabled={isSubmitting}
                                onValueChange={(value) => updateLine(line.localId, 'unitPrice', value)}
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label>Ghi chú dòng</Label>
                              <Input
                                value={line.note}
                                onChange={(event) => updateLine(line.localId, 'note', event.target.value)}
                                placeholder="Tùy chọn"
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4 rounded-md border border-amber-200 bg-amber-50 p-4">
                            <div className="grid gap-3 md:grid-cols-[110px_150px_150px_140px]">
                              <div className="space-y-1.5">
                                <Label>Số kiện</Label>
                                <NumericInput
                                  allowDecimal
                                  min={0.0001}
                                  step="0.0001"
                                  value={line.packageCount}
                                  disabled={isSubmitting}
                                  onValueChange={(value) => updateLine(line.localId, 'packageCount', value)}
                                />
                              </div>

                              <div className="space-y-1.5">
                                <Label>Đơn vị kiện</Label>
                                <SearchableCombobox
                                  value={line.packageLabel}
                                  options={packageLabelOptions}
                                  placeholder="VD: thùng"
                                  searchPlaceholder="Tìm hoặc nhập đơn vị kiện"
                                  emptyMessage="Nhập đơn vị kiện để sử dụng"
                                  allowCustomValue
                                  disabled={isSubmitting}
                                  onValueChange={(value) => updateLine(line.localId, 'packageLabel', value)}
                                />
                              </div>

                              <div className="space-y-1.5">
                                <Label>Lượng / kiện</Label>
                                <NumericInput
                                  allowDecimal
                                  min={0.0001}
                                  step="0.0001"
                                  value={line.contentPerPackage}
                                  disabled={isSubmitting}
                                  onValueChange={(value) => updateLine(line.localId, 'contentPerPackage', value)}
                                />
                              </div>

                              <div className="space-y-1.5">
                                <Label>Đơn vị quy đổi</Label>
                                <SearchableCombobox
                                  value={line.contentUnit}
                                  options={contentUnitOptions}
                                  placeholder="Chọn đơn vị"
                                  searchPlaceholder="Tìm đơn vị"
                                  emptyMessage="Không có đơn vị phù hợp"
                                  allowCustomValue
                                  disabled={isSubmitting}
                                  onValueChange={(value) => {
                                    const resolvedUnitOption = resolvePackagingUnitSelection(value, line.unit);
                                    updateLine(line.localId, 'contentUnit', resolvedUnitOption?.value ?? value);
                                  }}
                                />
                              </div>
                            </div>

                            <RadioGroup
                              value={line.packagingPriceMode}
                              onValueChange={(value) =>
                                updateLine(line.localId, 'packagingPriceMode', value as PackagingPriceMode)
                              }
                              className="grid gap-3 md:grid-cols-2"
                            >
                              <label
                                htmlFor={`po-total-price-${line.localId}`}
                                className="flex cursor-pointer items-start gap-3 rounded-md border border-amber-200 bg-white px-3 py-3"
                              >
                                <RadioGroupItem value="total" id={`po-total-price-${line.localId}`} className="mt-0.5" />
                                <span className="text-sm font-medium text-gray-800">Nhập theo tổng tiền lô</span>
                              </label>

                              <label
                                htmlFor={`po-package-price-${line.localId}`}
                                className="flex cursor-pointer items-start gap-3 rounded-md border border-amber-200 bg-white px-3 py-3"
                              >
                                <RadioGroupItem value="per-package" id={`po-package-price-${line.localId}`} className="mt-0.5" />
                                <span className="text-sm font-medium text-gray-800">Nhập theo giá mỗi kiện</span>
                              </label>
                            </RadioGroup>

                            <div className="grid gap-3 md:grid-cols-[170px_minmax(180px,1fr)]">
                              {line.packagingPriceMode === 'total' ? (
                                <div className="space-y-1.5">
                                  <Label>Tổng tiền lô</Label>
                                  <NumericInput
                                    allowDecimal
                                    min={0}
                                    step="0.0001"
                                    value={line.totalCost}
                                    disabled={isSubmitting}
                                    onValueChange={(value) => updateLine(line.localId, 'totalCost', value)}
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  <Label>Giá mỗi {line.packageLabel.trim() || 'kiện'}</Label>
                                  <NumericInput
                                    allowDecimal
                                    min={0}
                                    step="0.0001"
                                    value={line.costPerPackage}
                                    disabled={isSubmitting}
                                    onValueChange={(value) => updateLine(line.localId, 'costPerPackage', value)}
                                  />
                                </div>
                              )}

                              <div className="space-y-1.5">
                                <Label>Ghi chú dòng</Label>
                                <Input
                                  value={line.note}
                                  onChange={(event) => updateLine(line.localId, 'note', event.target.value)}
                                  placeholder="Tùy chọn"
                                  disabled={isSubmitting}
                                />
                              </div>
                            </div>

                            <div className="grid gap-2 rounded-md border border-amber-200 bg-white px-3 py-3 text-sm text-amber-900 md:grid-cols-3">
                              <p>Số lượng quy đổi: {formatComputedNumber(packagingValues.quantity)} {standardUnitLabel}</p>
                              <p>Đơn giá quy đổi: {formatComputedNumber(packagingValues.unitPrice)} / {standardUnitLabel}</p>
                              <p>Tổng tiền: {formatVND(packagingValues.totalCost)}</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                );
              })}
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
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoadingIngredients}>
              {isSubmitting ? 'Đang xử lý...' : isEditMode ? 'Cập nhật đơn' : 'Tạo đơn nháp'}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
