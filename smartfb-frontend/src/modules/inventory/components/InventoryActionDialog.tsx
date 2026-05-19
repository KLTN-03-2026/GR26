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
import {
  SearchableCombobox,
  type SearchableComboboxOption,
} from '@shared/components/common/SearchableCombobox';
import { DateTimePicker } from '@shared/components/common/DateTimePicker';
import { Input } from '@shared/components/ui/input';
import { NumericInput } from '@shared/components/common/NumericInput';
import { Label } from '@shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@shared/components/ui/radio-group';
import { Textarea } from '@shared/components/ui/textarea';
import {
  calculatePackagingConversion,
  formatComputedCurrency,
  formatComputedNumber,
  resolvePackageLabelSuggestions,
  resolvePackagingUnitOptions,
  resolvePackagingUnitSelection,
  type PackagingPriceMode,
} from '@modules/inventory/utils/unitConversion';
import type {
  AdjustStockPayload,
  InventoryCatalogItemType,
  ImportStockFlowPayload,
  InventoryItemOption,
  WasteRecordPayload,
} from '../types/inventory.types';

const inventoryUuidMessage = 'ID nguyên liệu phải đúng định dạng UUID';

type InventoryActionMode = 'import' | 'adjust' | 'waste';
type ImportInputMode = 'standard' | 'packaging';

const importStockSchema = z
  .object({
    itemId: z.string().uuid(inventoryUuidMessage),
    supplierId: z.union([z.string().uuid('ID nhà cung cấp phải đúng định dạng UUID'), z.literal('')]),
    inputMode: z.enum(['standard', 'packaging']),
    quantity: z.number().min(0.0001, 'Số lượng nhập phải lớn hơn 0'),
    costPerUnit: z.number().min(0, 'Đơn giá không được âm'),
    packageCount: z.number(),
    packageLabel: z.string(),
    contentPerPackage: z.number(),
    contentUnit: z.string(),
    packagingPriceMode: z.enum(['total', 'per-package']),
    totalCost: z.number(),
    costPerPackage: z.number(),
    expiresAt: z.string(),
    note: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.inputMode !== 'packaging') {
      return;
    }

    if (values.packageCount < 0.0001) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['packageCount'],
        message: 'Số kiện nhập phải lớn hơn 0',
      });
    }

    if (!values.packageLabel.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['packageLabel'],
        message: 'Vui lòng nhập đơn vị kiện như thùng, hộp hoặc gói',
      });
    }

    if (values.contentPerPackage < 0.0001) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contentPerPackage'],
        message: 'Lượng trong mỗi kiện phải lớn hơn 0',
      });
    }

    if (!values.contentUnit.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contentUnit'],
        message: 'Vui lòng chọn đơn vị quy đổi',
      });
    }

    if (values.packagingPriceMode === 'total' && values.totalCost < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['totalCost'],
        message: 'Tổng tiền lô không được âm',
      });
    }

    if (values.packagingPriceMode === 'per-package' && values.costPerPackage < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['costPerPackage'],
        message: 'Giá mỗi kiện không được âm',
      });
    }
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

type ImportStockFormValues = z.infer<typeof importStockSchema>;
type AdjustStockFormValues = z.infer<typeof adjustStockSchema>;
type WasteRecordFormValues = z.infer<typeof wasteRecordSchema>;

interface InventoryActionDialogProps {
  mode: InventoryActionMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemOptions: InventoryItemOption[];
  itemLabel: string;
  itemType: InventoryCatalogItemType;
  importActionLabel?: string;
  selectedBranchName: string | null;
  defaultItemId?: string;
  isPending: boolean;
  onImportSubmit?: (payload: ImportStockFlowPayload) => void;
  onAdjustSubmit?: (payload: AdjustStockPayload) => void;
  onWasteSubmit?: (payload: WasteRecordPayload) => void;
}

const capitalizeLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const buildInventoryActionCopy = (
  mode: InventoryActionMode,
  itemLabel: string,
  importActionLabel: string,
) => {
  switch (mode) {
    case 'import':
      return {
        title: `${importActionLabel} ${itemLabel}`,
        description:
          ` ` ,
        submitLabel: `Xác nhận ${importActionLabel.toLowerCase()}`,
      };
    case 'adjust':
      return {
        title: `Điều chỉnh tồn kho ${itemLabel}`,
        description:
          `Đặt lại số lượng tồn kho thực tế của ${itemLabel} sau kiểm kê. `,
        submitLabel: 'Lưu điều chỉnh',
      };
    default:
      return {
        title: `Ghi nhận hao hụt ${itemLabel}`,
        description:
          `Ghi nhận ${itemLabel} hỏng, đổ vỡ hoặc cần loại bỏ để trừ khỏi tồn kho của chi nhánh hiện tại.`,
        submitLabel: 'Lưu hao hụt',
      };
  }
};

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
  itemLabel,
  itemType,
  importActionLabel = 'Nhập kho',
  selectedBranchName,
  defaultItemId,
  isPending,
  onImportSubmit,
  onAdjustSubmit,
  onWasteSubmit,
}: InventoryActionDialogProps) => {
  const copy = buildInventoryActionCopy(mode, itemLabel, importActionLabel);
  const itemLabelTitle = capitalizeLabel(itemLabel);

  const importForm = useForm<ImportStockFormValues>({
    resolver: zodResolver(importStockSchema),
    defaultValues: {
      itemId: defaultItemId ?? '',
      supplierId: '',
      inputMode: 'standard',
      quantity: 1,
      costPerUnit: 0,
      packageCount: 1,
      packageLabel: '',
      contentPerPackage: 1,
      contentUnit: '',
      packagingPriceMode: 'total',
      totalCost: 0,
      costPerPackage: 0,
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
        inputMode: 'standard',
        quantity: 1,
        costPerUnit: 0,
        packageCount: 1,
        packageLabel: '',
        contentPerPackage: 1,
        contentUnit: '',
        packagingPriceMode: 'total',
        totalCost: 0,
        costPerPackage: 0,
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
  const watchedImportInputMode = useWatch({ control: importForm.control, name: 'inputMode' });
  const watchedImportQuantity = useWatch({ control: importForm.control, name: 'quantity' });
  const watchedImportCostPerUnit = useWatch({ control: importForm.control, name: 'costPerUnit' });
  const watchedPackageCount = useWatch({ control: importForm.control, name: 'packageCount' });
  const watchedPackageLabel = useWatch({ control: importForm.control, name: 'packageLabel' });
  const watchedContentPerPackage = useWatch({ control: importForm.control, name: 'contentPerPackage' });
  const watchedContentUnit = useWatch({ control: importForm.control, name: 'contentUnit' });
  const watchedPackagingPriceMode = useWatch({ control: importForm.control, name: 'packagingPriceMode' });
  const watchedTotalCost = useWatch({ control: importForm.control, name: 'totalCost' });
  const watchedCostPerPackage = useWatch({ control: importForm.control, name: 'costPerPackage' });
  const watchedExpiryDateTime = useWatch({ control: importForm.control, name: 'expiresAt' });
  const watchedAdjustItemId = useWatch({ control: adjustForm.control, name: 'itemId' });
  const watchedAdjustNewQuantity = useWatch({ control: adjustForm.control, name: 'newQuantity' });
  const watchedWasteItemId = useWatch({ control: wasteForm.control, name: 'itemId' });
  const watchedWasteQuantity = useWatch({ control: wasteForm.control, name: 'quantity' });

  const selectedImportItem = useMemo(() => {
    return itemOptions.find((item) => item.itemId === watchedImportItemId) ?? null;
  }, [itemOptions, watchedImportItemId]);

  const standardUnitLabel = selectedImportItem?.unit?.trim() || 'Đơn vị';
  const packagingUnitOptions = useMemo(() => {
    return resolvePackagingUnitOptions(selectedImportItem?.unit);
  }, [selectedImportItem?.unit]);
  const packageLabelSuggestions = useMemo(() => {
    return resolvePackageLabelSuggestions(selectedImportItem?.unit);
  }, [selectedImportItem?.unit]);
  const packageLabelComboboxOptions = useMemo<SearchableComboboxOption[]>(() => {
    return packageLabelSuggestions.map((packageLabel) => ({
      value: packageLabel,
      label: packageLabel,
    }));
  }, [packageLabelSuggestions]);
  const contentUnitComboboxOptions = useMemo<SearchableComboboxOption[]>(() => {
    return packagingUnitOptions.map((option) => ({
      value: option.value,
      label: option.label,
      keywords: [...(option.keywords ?? [])],
    }));
  }, [packagingUnitOptions]);
  const itemComboboxOptions = useMemo<SearchableComboboxOption[]>(() => {
    return itemOptions.map((item) => ({
      value: item.itemId,
      label: item.itemName,
      description: item.unit ? `Đơn vị: ${item.unit}` : 'Chưa có Đơn vị',
      keywords: [item.itemId, item.unit ?? ''],
    }));
  }, [itemOptions]);

  useEffect(() => {
    const nextContentUnit = packagingUnitOptions[0]?.value;

    if (!nextContentUnit) {
      return;
    }

    const currentContentUnit = importForm.getValues('contentUnit');
    const hasCurrentOption = packagingUnitOptions.some((option) => option.value === currentContentUnit);

    if (!hasCurrentOption) {
      importForm.setValue('contentUnit', nextContentUnit, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
    importForm.clearErrors('contentUnit');
  }, [importForm, packagingUnitOptions]);

  const packagingConversion = calculatePackagingConversion({
    packageCount: watchedPackageCount,
    contentPerPackage: watchedContentPerPackage,
    contentUnit: watchedContentUnit,
    standardUnit: selectedImportItem?.unit,
    packagingPriceMode: watchedPackagingPriceMode,
    totalCost: watchedTotalCost,
    costPerPackage: watchedCostPerPackage,
  });
  const selectedPackagingUnitLabel = packagingConversion.contentUnitLabel || standardUnitLabel;
  const derivedPackagingQuantity = packagingConversion.quantity;
  const derivedPackagingTotalCost = packagingConversion.totalCost;
  const derivedPackagingCostPerUnit = packagingConversion.unitPrice;

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
    const emptyStateMessage =
      mode === 'import'
        ? `Chưa có ${itemLabel} nào trong danh mục. Tạo item \`${itemType}\` trước rồi quay lại thao tác.`
        : `Chưa có ${itemLabel} khả dụng trong kho của chi nhánh hiện tại.`;

    const helperMessage =
      mode === 'import'
        ? `Chọn ${itemLabel} đã được tạo trong danh mục để nhập tồn lần đầu hoặc nhập thêm lô mới.`
        : `Chọn ${itemLabel} đã có tồn kho tại chi nhánh hiện tại để thực hiện thao tác.`;

    return (
      <div className="space-y-1.5">
        <Label htmlFor={`${mode}-item-id`}>
          {itemLabelTitle} <span className="text-red-500">*</span>
        </Label>
        <SearchableCombobox
          id={`${mode}-item-id`}
          value={itemId}
          options={itemComboboxOptions}
          placeholder={`Chọn ${itemLabel}`}
          searchPlaceholder={`Tìm ${itemLabel} theo tên, mã hoặc đơn vị`}
          emptyMessage={`Không tìm thấy ${itemLabel} phù hợp.`}
          disabled={itemOptions.length === 0}
          onValueChange={onItemChange}
        />
        {selectedItemLabel && <p className="text-xs text-text-secondary">Đã chọn: {selectedItemLabel}</p>}
        {!selectedItemLabel && itemOptions.length > 0 && (
          <p className="text-xs text-text-secondary">{helperMessage}</p>
        )}
        {itemOptions.length === 0 && (
          <p className="text-xs text-text-secondary">{emptyStateMessage}</p>
        )}
        {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] border-0 overflow-y-auto sm:max-w-xl">
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
              const importPayload =
                values.inputMode === 'packaging'
                  ? {
                      itemId: values.itemId,
                      supplierId: values.supplierId || null,
                      quantity: derivedPackagingQuantity,
                      costPerUnit: derivedPackagingCostPerUnit,
                      expiresAt: values.expiresAt || null,
                      note: values.note || null,
                    }
                  : {
                      itemId: values.itemId,
                      supplierId: values.supplierId || null,
                      quantity: values.quantity,
                      costPerUnit: values.costPerUnit,
                      expiresAt: values.expiresAt || null,
                      note: values.note || null,
                    };

              onImportSubmit?.({
                stockPayload: importPayload,
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

            <div className="space-y-2 rounded-card border border-border bg-cream/70 p-4">
              <Label>Cách nhập</Label>
              <RadioGroup
                value={watchedImportInputMode}
                onValueChange={(value) => {
                  importForm.setValue('inputMode', value as ImportInputMode, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                className="grid gap-3 md:grid-cols-2"
              >
                <label
                  htmlFor="import-mode-standard"
                  className="flex cursor-pointer items-start gap-3 rounded-card border border-border bg-card px-3 py-3"
                >
                  <RadioGroupItem value="standard" id="import-mode-standard" className="mt-0.5" />
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-text-primary">Theo Đơn vị</span>
                    
                  </span>
                </label>

                <label
                  htmlFor="import-mode-packaging"
                  className="flex cursor-pointer items-start gap-3 rounded-card border border-border bg-card px-3 py-3"
                >
                  <RadioGroupItem value="packaging" id="import-mode-packaging" className="mt-0.5" />
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-text-primary">Theo quy cách đóng gói</span>
                   
                  </span>
                </label>
              </RadioGroup>
            </div>

            {watchedImportInputMode === 'standard' ? (
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
                  <p className="text-xs text-text-secondary">Đơn vị hiện tại: {standardUnitLabel}.</p>
                  {importForm.formState.errors.quantity && (
                    <p className="text-xs text-red-500">{importForm.formState.errors.quantity.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="import-cost">
                    Đơn giá nhập / 1 {standardUnitLabel} <span className="text-red-500">*</span>
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
            ) : (
              <div className="space-y-4 rounded-card border border-border bg-card p-4">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
                  <div className="space-y-1.5">
                    <Label htmlFor="import-package-count">
                      Số kiện nhập <span className="text-red-500">*</span>
                    </Label>
                    <NumericInput
                      id="import-package-count"
                      allowDecimal
                      min={0.0001}
                      step="0.0001"
                      value={watchedPackageCount}
                      onValueChange={(value) => {
                        importForm.setValue('packageCount', value, { shouldDirty: true, shouldValidate: true });
                      }}
                    />
                    {importForm.formState.errors.packageCount && (
                      <p className="text-xs text-red-500">{importForm.formState.errors.packageCount.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="import-package-label">
                      Đơn vị kiện <span className="text-red-500">*</span>
                    </Label>
                    <SearchableCombobox
                      id="import-package-label"
                      value={watchedPackageLabel}
                      options={packageLabelComboboxOptions}
                      placeholder="Chọn hoặc nhập đơn vị kiện"
                      searchPlaceholder="Tìm hoặc nhập đơn vị kiện"
                      emptyMessage="Không có gợi ý phù hợp. Nhập đơn vị mới để dùng giá trị này."
                      allowCustomValue
                      onValueChange={(value) => {
                        importForm.setValue('packageLabel', value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                    {importForm.formState.errors.packageLabel && (
                      <p className="text-xs text-red-500">{importForm.formState.errors.packageLabel.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
                  <div className="space-y-1.5">
                    <Label htmlFor="import-content-per-package">
                      Lượng trong 1 {watchedPackageLabel?.trim() || 'kiện'} <span className="text-red-500">*</span>
                    </Label>
                    <NumericInput
                      id="import-content-per-package"
                      allowDecimal
                      min={0.0001}
                      step="0.0001"
                      value={watchedContentPerPackage}
                      onValueChange={(value) => {
                        importForm.setValue('contentPerPackage', value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
           
                    {importForm.formState.errors.contentPerPackage && (
                      <p className="text-xs text-red-500">{importForm.formState.errors.contentPerPackage.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="import-content-unit">
                      Đơn vị quy đổi <span className="text-red-500">*</span>
                    </Label>
                    <SearchableCombobox
                      id="import-content-unit"
                      value={watchedContentUnit}
                      options={contentUnitComboboxOptions}
                      placeholder="Chọn đơn vị quy đổi"
                      searchPlaceholder="Tìm đơn vị quy đổi"
                      emptyMessage="Không có đơn vị quy đổi khả dụng cho nguyên liệu này."
                      allowCustomValue
                      onValueChange={(value) => {
                        const resolvedUnitOption = resolvePackagingUnitSelection(value, selectedImportItem?.unit);

                        if (!resolvedUnitOption) {
                          importForm.setError('contentUnit', {
                            type: 'manual',
                            message: selectedImportItem?.unit
                              ? `Đơn vị quy đổi phải trùng hoặc cùng hệ với đơn vị chuẩn ${standardUnitLabel} của item.`
                              : 'Vui lòng chọn một đơn vị hợp lệ từ danh sách.',
                          });
                          return;
                        }

                        importForm.clearErrors('contentUnit');
                        importForm.setValue('contentUnit', resolvedUnitOption.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                   
                    {importForm.formState.errors.contentUnit && (
                      <p className="text-xs text-red-500">{importForm.formState.errors.contentUnit.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 rounded-card border border-border bg-cream/70 p-4">
                  <Label>Giá nhập</Label>
                  <RadioGroup
                    value={watchedPackagingPriceMode}
                    onValueChange={(value) => {
                      importForm.setValue('packagingPriceMode', value as PackagingPriceMode, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    className="grid gap-3 md:grid-cols-2"
                  >
                    <label
                      htmlFor="import-price-total"
                      className="flex cursor-pointer items-start gap-3 rounded-card border border-border bg-card px-3 py-3"
                    >
                      <RadioGroupItem value="total" id="import-price-total" className="mt-0.5" />
                      <span className="space-y-1">
                        <span className="block text-sm font-medium text-text-primary">Nhập theo tổng tiền lô</span>
                      
                      </span>
                    </label>

                    <label
                      htmlFor="import-price-package"
                      className="flex cursor-pointer items-start gap-3 rounded-card border border-border bg-card px-3 py-3"
                    >
                      <RadioGroupItem value="per-package" id="import-price-package" className="mt-0.5" />
                      <span className="space-y-1">
                        <span className="block text-sm font-medium text-text-primary">Nhập theo giá mỗi kiện</span>
                 
                      </span>
                    </label>
                  </RadioGroup>
                </div>

                {watchedPackagingPriceMode === 'total' ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="import-total-cost">
                      Tổng tiền lô <span className="text-red-500">*</span>
                    </Label>
                    <NumericInput
                      id="import-total-cost"
                      allowDecimal
                      min={0}
                      step="0.0001"
                      value={watchedTotalCost}
                      onValueChange={(value) => {
                        importForm.setValue('totalCost', value, { shouldDirty: true, shouldValidate: true });
                      }}
                    />
                    {importForm.formState.errors.totalCost && (
                      <p className="text-xs text-red-500">{importForm.formState.errors.totalCost.message}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="import-cost-per-package">
                      Giá mỗi {watchedPackageLabel?.trim() || 'kiện'} <span className="text-red-500">*</span>
                    </Label>
                    <NumericInput
                      id="import-cost-per-package"
                      allowDecimal
                      min={0}
                      step="0.0001"
                      value={watchedCostPerPackage}
                      onValueChange={(value) => {
                        importForm.setValue('costPerPackage', value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                    {importForm.formState.errors.costPerPackage && (
                      <p className="text-xs text-red-500">{importForm.formState.errors.costPerPackage.message}</p>
                    )}
                  </div>
                )}

                <div className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="mt-2 grid gap-2 text-sm text-amber-900 md:grid-cols-2">
                    <p>Đơn vị của kho: {standardUnitLabel}</p>
                    <p>Quy cách hiện tại: {formatComputedNumber(watchedPackageCount)} {watchedPackageLabel?.trim() || 'kiện'}</p>
                    <p>
                      Lượng trong mỗi kiện: {formatComputedNumber(watchedContentPerPackage)} {selectedPackagingUnitLabel}
                    </p>
                    <p>Số lượng : {formatComputedNumber(derivedPackagingQuantity)} {standardUnitLabel}</p>
                    <p>Tổng tiền 1 kiên: {formatComputedCurrency(derivedPackagingTotalCost)}</p>
                    <p>
                      Đơn giá : {formatComputedNumber(derivedPackagingCostPerUnit)} / {standardUnitLabel}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                <DateTimePicker
                  id="import-expiry"
                  value={watchedExpiryDateTime}
                  onChange={(value) => {
                    importForm.setValue('expiresAt', value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  placeholder="Chọn ngày giờ hết hạn"
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="import-note">Ghi chú</Label>
              <Textarea
                id="import-note"
                rows={3}
                {...importForm.register('note')}
                className=' resize-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary'
                placeholder={`Ví dụ: ${importActionLabel.toLowerCase()} lô đầu tuần từ nhà cung cấp A`}
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
