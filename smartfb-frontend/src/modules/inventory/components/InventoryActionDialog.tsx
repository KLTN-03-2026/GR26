import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@shared/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { Textarea } from '@shared/components/ui/textarea';
import { cn } from '@shared/utils/cn';
import type {
  AdjustStockPayload,
  ImportStockPayload,
  InventoryItemOption,
  WasteRecordPayload,
} from '../types/inventory.types';

const inventoryUuidMessage = 'ID nguyên liệu phải đúng định dạng UUID';

type InventoryActionMode = 'import' | 'adjust' | 'waste';
type ImportInputMode = 'standard' | 'packaging';
type PackagingPriceMode = 'total' | 'per-package';

interface PackagingUnitOption {
  value: string;
  label: string;
  factorToStandard: number;
}

interface ComboboxOption {
  value: string;
  label: string;
}

const COMMON_PACKAGE_LABELS = ['thùng', 'hộp', 'chai', 'can', 'bao', 'gói', 'bịch', 'túi', 'dây'] as const;

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
  selectedBranchName: string | null;
  defaultItemId?: string;
  isPending: boolean;
  onImportSubmit?: (payload: ImportStockPayload) => void;
  onAdjustSubmit?: (payload: AdjustStockPayload) => void;
  onWasteSubmit?: (payload: WasteRecordPayload) => void;
}

interface SimpleComboboxProps {
  id: string;
  value: string;
  options: ComboboxOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  allowCustomValue?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const inventoryActionCopy = {
  import: {
    title: 'Nhập kho nguyên liệu',
    description:
      'Tạo lô nhập mới cho chi nhánh đang làm việc. Có thể nhập trực tiếp theo đơn vị chuẩn hoặc nhập theo thùng, hộp, gói rồi để frontend tự quy đổi trước khi gửi backend.',
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

const roundInventoryNumber = (value: number) => Number(value.toFixed(4));

const formatComputedNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(value);

const formatComputedCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);

const normalizeUnitValue = (unit: string | null | undefined) => unit?.trim().toLowerCase() ?? '';

const resolveItemLabel = (itemOptions: InventoryItemOption[], itemId: string) => {
  const matchedItem = itemOptions.find((item) => item.itemId === itemId);

  if (!matchedItem) {
    return null;
  }

  return matchedItem.unit ? `${matchedItem.itemName} (${matchedItem.unit})` : matchedItem.itemName;
};

const SimpleCombobox = ({
  id,
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  allowCustomValue = false,
  disabled = false,
  onChange,
}: SimpleComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const normalizedSearch = searchValue.trim().toLowerCase();
  const selectedOption = options.find((option) => option.value === value);
  const triggerLabel = selectedOption?.label ?? (value || placeholder);
  const filteredOptions =
    normalizedSearch.length === 0
      ? options
      : options.filter((option) => option.label.toLowerCase().includes(normalizedSearch));
  const canUseCustomValue =
    allowCustomValue &&
    normalizedSearch.length > 0 &&
    !options.some((option) => option.value.toLowerCase() === normalizedSearch);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setSearchValue(value);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          <span className={cn('truncate', !value && 'text-text-secondary')}>
            {triggerLabel}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
        <div className="space-y-2">
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={searchPlaceholder}
          />
          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length === 0 && !canUseCustomValue ? (
              <p className="px-2 py-3 text-sm text-text-secondary">{emptyMessage}</p>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="ghost"
                    className="w-full justify-between"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">{option.label}</span>
                    <Check className={cn('h-4 w-4', option.value === value ? 'opacity-100' : 'opacity-0')} />
                  </Button>
                ))}
                {canUseCustomValue ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-between"
                    onClick={() => {
                      onChange(searchValue.trim());
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">Dùng "{searchValue.trim()}"</span>
                    <Check className="h-4 w-4 opacity-0" />
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/**
 * FE quy đổi đơn vị nhập thực tế về đơn vị chuẩn mà backend đang lưu kho.
 * Ví dụ: item chuẩn là `ml`, user nhập `10 hộp x 1 L` thì FE sẽ gửi `10000 ml`.
 */
const resolvePackagingUnitOptions = (standardUnit: string | null | undefined): PackagingUnitOption[] => {
  const normalizedStandardUnit = normalizeUnitValue(standardUnit);

  if (normalizedStandardUnit === 'ml' || normalizedStandardUnit === 'l') {
    const standardFactor = normalizedStandardUnit === 'ml' ? 1 : 1000;

    return [
      { value: 'ml', label: 'ml', factorToStandard: 1 / standardFactor },
      { value: 'l', label: 'L', factorToStandard: 1000 / standardFactor },
    ];
  }

  if (normalizedStandardUnit === 'g' || normalizedStandardUnit === 'kg') {
    const standardFactor = normalizedStandardUnit === 'g' ? 1 : 1000;

    return [
      { value: 'g', label: 'g', factorToStandard: 1 / standardFactor },
      { value: 'kg', label: 'kg', factorToStandard: 1000 / standardFactor },
    ];
  }

  const fallbackLabel = standardUnit?.trim() || 'đơn vị chuẩn';
  const fallbackValue = normalizedStandardUnit || 'standard-unit';

  return [{ value: fallbackValue, label: fallbackLabel, factorToStandard: 1 }];
};

/**
 * Gợi ý đơn vị đóng gói thường gặp theo loại nguyên liệu trong quán.
 */
const resolvePackageLabelSuggestions = (standardUnit: string | null | undefined) => {
  const normalizedStandardUnit = normalizeUnitValue(standardUnit);

  if (normalizedStandardUnit === 'ml' || normalizedStandardUnit === 'l') {
    return ['thùng', 'hộp', 'chai', 'can', 'bịch'] as const;
  }

  if (normalizedStandardUnit === 'g' || normalizedStandardUnit === 'kg') {
    return ['bao', 'gói', 'hộp', 'túi', 'can'] as const;
  }

  if (normalizedStandardUnit === 'cái') {
    return ['dây', 'gói', 'thùng', 'hộp', 'túi'] as const;
  }

  return COMMON_PACKAGE_LABELS;
};

/**
 * Gợi ý quy cách thường gặp theo đơn vị đóng gói để user nhập tổng lượng chuẩn trong 1 kiện.
 */
const resolvePackageLabelHint = (packageLabel: string, standardUnit: string | null | undefined) => {
  const normalizedPackageLabel = packageLabel.trim().toLowerCase();
  const unitLabel = standardUnit?.trim() || 'đơn vị chuẩn';

  switch (normalizedPackageLabel) {
    case 'thùng':
      return `Thùng không có quy đổi cố định. Hãy nhập tổng lượng chuẩn có trong 1 thùng, ví dụ 24 L/thùng hoặc 120 hộp x 180 ml đã cộng sẵn ra ${unitLabel}.`;
    case 'hộp':
      return `Hộp không cố định. Với sữa thường gặp 180 ml/hộp hoặc 1 L/hộp; hãy nhập đúng tổng ${unitLabel} trong 1 hộp.`;
    case 'chai':
      return 'Chai thường quy đổi theo ml hoặc L, ví dụ 750 ml/chai hoặc 1 L/chai.';
    case 'can':
      return 'Can thường quy đổi theo L hoặc kg, ví dụ 5 L/can hoặc 20 kg/can.';
    case 'bao':
      return 'Bao thường dùng cho đường, bột hoặc đá, ví dụ 25 kg/bao hoặc 50 kg/bao.';
    case 'gói':
      return 'Gói có thể quy đổi theo g hoặc cái, ví dụ 18 g/gói hoặc 100 cái/gói.';
    case 'bịch':
      return 'Bịch có thể quy đổi theo ml hoặc g tùy loại nguyên liệu.';
    case 'túi':
      return 'Túi có thể quy đổi theo g hoặc cái tùy loại.';
    case 'dây':
      return 'Dây thường dùng cho ly, nắp ly hoặc ống hút và thường quy đổi về cái.';
    default:
      return `Nhập tổng lượng chuẩn có trong 1 ${packageLabel.trim() || 'kiện'} theo đơn vị ${unitLabel}.`;
  }
};

const resolveStandardUnitGuide = (standardUnit: string | null | undefined) => {
  const normalizedStandardUnit = normalizeUnitValue(standardUnit);

  if (normalizedStandardUnit === 'ml' || normalizedStandardUnit === 'l') {
    return 'Thường gặp: sữa tươi theo hộp/thùng, syrup theo chai, nước trái cây theo chai, bịch hoặc can.';
  }

  if (normalizedStandardUnit === 'g' || normalizedStandardUnit === 'kg') {
    return 'Thường gặp: cà phê, bột, đường, sữa bột, topping khô theo bao, gói, hộp hoặc túi.';
  }

  if (normalizedStandardUnit === 'cái') {
    return 'Thường gặp: ly, nắp ly, ống hút, muỗng theo dây, gói, hộp hoặc thùng.';
  }

  return 'Nếu đơn vị đóng gói không cố định, hãy nhập tổng lượng chuẩn có trong 1 kiện để frontend tự quy đổi.';
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
  const watchedAdjustItemId = useWatch({ control: adjustForm.control, name: 'itemId' });
  const watchedAdjustNewQuantity = useWatch({ control: adjustForm.control, name: 'newQuantity' });
  const watchedWasteItemId = useWatch({ control: wasteForm.control, name: 'itemId' });
  const watchedWasteQuantity = useWatch({ control: wasteForm.control, name: 'quantity' });

  const selectedImportItem = useMemo(() => {
    return itemOptions.find((item) => item.itemId === watchedImportItemId) ?? null;
  }, [itemOptions, watchedImportItemId]);

  const standardUnitLabel = selectedImportItem?.unit?.trim() || 'đơn vị chuẩn';
  const packagingUnitOptions = useMemo(() => {
    return resolvePackagingUnitOptions(selectedImportItem?.unit);
  }, [selectedImportItem?.unit]);
  const packageLabelSuggestions = useMemo(() => {
    return resolvePackageLabelSuggestions(selectedImportItem?.unit);
  }, [selectedImportItem?.unit]);
  const packageLabelComboboxOptions = useMemo<ComboboxOption[]>(() => {
    return packageLabelSuggestions.map((packageLabel) => ({
      value: packageLabel,
      label: packageLabel,
    }));
  }, [packageLabelSuggestions]);
  const packageLabelHint = useMemo(() => {
    return resolvePackageLabelHint(watchedPackageLabel, selectedImportItem?.unit);
  }, [selectedImportItem?.unit, watchedPackageLabel]);
  const standardUnitGuide = useMemo(() => {
    return resolveStandardUnitGuide(selectedImportItem?.unit);
  }, [selectedImportItem?.unit]);
  const contentUnitComboboxOptions = useMemo<ComboboxOption[]>(() => {
    return packagingUnitOptions.map((option) => ({
      value: option.value,
      label: option.label,
    }));
  }, [packagingUnitOptions]);

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
  }, [importForm, packagingUnitOptions]);

  const selectedPackagingUnitOption = packagingUnitOptions.find((option) => option.value === watchedContentUnit);
  const selectedPackagingUnitLabel = selectedPackagingUnitOption?.label ?? standardUnitLabel;
  const derivedPackagingQuantity = roundInventoryNumber(
    watchedPackageCount * watchedContentPerPackage * (selectedPackagingUnitOption?.factorToStandard ?? 1),
  );
  const derivedPackagingTotalCost =
    watchedPackagingPriceMode === 'per-package'
      ? roundInventoryNumber(watchedPackageCount * watchedCostPerPackage)
      : roundInventoryNumber(watchedTotalCost);
  const derivedPackagingCostPerUnit =
    derivedPackagingQuantity > 0
      ? roundInventoryNumber(derivedPackagingTotalCost / derivedPackagingQuantity)
      : 0;

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
        ? 'Chưa có nguyên liệu nào trong danh mục. Tạo item `INGREDIENT` trước rồi quay lại nhập kho.'
        : 'Chưa có nguyên liệu khả dụng trong kho của chi nhánh hiện tại.';

    const helperMessage =
      mode === 'import'
        ? 'Chọn nguyên liệu đã được tạo trong danh mục để nhập kho lần đầu hoặc nhập thêm lô mới.'
        : 'Chọn nguyên liệu đã có tồn kho tại chi nhánh hiện tại để thực hiện thao tác.';

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

              onImportSubmit?.(importPayload);
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
                    <span className="block text-sm font-medium text-text-primary">Theo đơn vị chuẩn</span>
                    <span className="block text-xs text-text-secondary">
                      Nhập trực tiếp theo `ml`, `g`, `cái` hoặc đơn vị chuẩn đang lưu trong kho.
                    </span>
                  </span>
                </label>

                <label
                  htmlFor="import-mode-packaging"
                  className="flex cursor-pointer items-start gap-3 rounded-card border border-border bg-card px-3 py-3"
                >
                  <RadioGroupItem value="packaging" id="import-mode-packaging" className="mt-0.5" />
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-text-primary">Theo quy cách đóng gói</span>
                    <span className="block text-xs text-text-secondary">
                      Nhập theo thùng, hộp, gói, bao rồi để frontend tự quy đổi trước khi gọi backend.
                    </span>
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
                  <p className="text-xs text-text-secondary">Đơn vị chuẩn hiện tại: {standardUnitLabel}.</p>
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
                <div className="rounded-card border border-border bg-cream/70 px-4 py-3 text-sm text-text-secondary">
                  <p className="font-medium text-text-primary">Quy đổi thường gặp</p>
                  <p className="mt-1">{standardUnitGuide}</p>
                </div>

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
                    <SimpleCombobox
                      id="import-package-label"
                      value={watchedPackageLabel}
                      options={packageLabelComboboxOptions}
                      placeholder="Chọn hoặc nhập đơn vị kiện"
                      searchPlaceholder="Tìm hoặc nhập đơn vị kiện"
                      emptyMessage="Không có gợi ý phù hợp. Nhập đơn vị mới để dùng giá trị này."
                      allowCustomValue
                      onChange={(value) => {
                        importForm.setValue('packageLabel', value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                    <p className="text-xs text-text-secondary">{packageLabelHint}</p>
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
                    <p className="text-xs text-text-secondary">
                      Nhập tổng lượng chuẩn có trong 1 kiện. Ví dụ: `1 L / hộp`, `24 L / thùng`, `25 kg / bao`.
                    </p>
                    {importForm.formState.errors.contentPerPackage && (
                      <p className="text-xs text-red-500">{importForm.formState.errors.contentPerPackage.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="import-content-unit">
                      Đơn vị quy đổi <span className="text-red-500">*</span>
                    </Label>
                    <SimpleCombobox
                      id="import-content-unit"
                      value={watchedContentUnit}
                      options={contentUnitComboboxOptions}
                      placeholder="Chọn đơn vị quy đổi"
                      searchPlaceholder="Tìm đơn vị quy đổi"
                      emptyMessage="Không có đơn vị quy đổi khả dụng cho nguyên liệu này."
                      onChange={(value) => {
                        importForm.setValue('contentUnit', value, { shouldDirty: true, shouldValidate: true });
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
                        <span className="block text-xs text-text-secondary">
                          FE tự chia lại thành đơn giá trên 1 {standardUnitLabel} trước khi gửi backend.
                        </span>
                      </span>
                    </label>

                    <label
                      htmlFor="import-price-package"
                      className="flex cursor-pointer items-start gap-3 rounded-card border border-border bg-card px-3 py-3"
                    >
                      <RadioGroupItem value="per-package" id="import-price-package" className="mt-0.5" />
                      <span className="space-y-1">
                        <span className="block text-sm font-medium text-text-primary">Nhập theo giá mỗi kiện</span>
                        <span className="block text-xs text-text-secondary">
                          FE nhân với số kiện rồi quy đổi về đơn giá chuẩn.
                        </span>
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
                  <p className="text-sm font-semibold text-amber-900">Preview quy đổi trước khi gửi backend</p>
                  <div className="mt-2 grid gap-2 text-sm text-amber-900 md:grid-cols-2">
                    <p>Đơn vị chuẩn của kho: {standardUnitLabel}</p>
                    <p>Quy cách hiện tại: {formatComputedNumber(watchedPackageCount)} {watchedPackageLabel?.trim() || 'kiện'}</p>
                    <p>
                      Lượng trong mỗi kiện: {formatComputedNumber(watchedContentPerPackage)} {selectedPackagingUnitLabel}
                    </p>
                    <p>Số lượng gửi BE: {formatComputedNumber(derivedPackagingQuantity)} {standardUnitLabel}</p>
                    <p>Tổng tiền lô: {formatComputedCurrency(derivedPackagingTotalCost)}</p>
                    <p>
                      Đơn giá chuẩn gửi BE: {formatComputedNumber(derivedPackagingCostPerUnit)} / {standardUnitLabel}
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
