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
import { Input } from '@shared/components/ui/input';
import { NumericInput } from '@shared/components/common/NumericInput';
import { Label } from '@shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@shared/components/ui/radio-group';
import { Textarea } from '@shared/components/ui/textarea';
import type {
  AdjustStockPayload,
  InventoryCatalogItemType,
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
  keywords?: string[];
}

const COMMON_PACKAGE_LABELS = ['thùng', 'hộp', 'chai', 'can', 'bao', 'gói', 'bịch', 'túi', 'dây', 'vỉ'] as const;
const VOLUME_PACKAGE_LABEL_SET = new Set(['thùng', 'hộp', 'chai', 'can', 'bịch']);
const WEIGHT_PACKAGE_LABEL_SET = new Set(['bao', 'gói', 'hộp', 'túi', 'can']);
const COUNT_PACKAGE_LABEL_SET = new Set(['dây', 'gói', 'thùng', 'hộp', 'túi']);

interface UnitFamilyOption {
  normalizedValue: string;
  label: string;
  factorToBase: number;
  aliases: string[];
}

// Nhóm đơn vị thể tích có quy đổi cố định về cùng hệ.
const VOLUME_UNIT_OPTIONS: UnitFamilyOption[] = [
  { normalizedValue: 'ml', label: 'ml', factorToBase: 1, aliases: ['ml', 'mililit', 'millilit', 'milliliter'] },
  { normalizedValue: 'l', label: 'L', factorToBase: 1000, aliases: ['l', 'lit', 'liter', 'litre'] },
];

// Nhóm đơn vị khối lượng có quy đổi cố định về cùng hệ.
const WEIGHT_UNIT_OPTIONS: UnitFamilyOption[] = [
  { normalizedValue: 'g', label: 'g', factorToBase: 1, aliases: ['g', 'gr', 'gram', 'gam'] },
  { normalizedValue: 'kg', label: 'kg', factorToBase: 1000, aliases: ['kg', 'kilogram', 'kilo', 'ky', 'ki'] },
];

// Các đơn vị đếm chỉ quy đổi 1:1 với chính đơn vị chuẩn đang lưu trong DB.
const COUNT_UNIT_OPTIONS: UnitFamilyOption[] = [
  { normalizedValue: 'cai', label: 'cái', factorToBase: 1, aliases: ['cai', 'chiec'] },
  { normalizedValue: 'qua', label: 'quả', factorToBase: 1, aliases: ['qua', 'trai'] },
  { normalizedValue: 'chai', label: 'chai', factorToBase: 1, aliases: ['chai'] },
  { normalizedValue: 'lon', label: 'lon', factorToBase: 1, aliases: ['lon'] },
  { normalizedValue: 'ly', label: 'ly', factorToBase: 1, aliases: ['ly', 'coc', 'cup'] },
  { normalizedValue: 'ong', label: 'ống', factorToBase: 1, aliases: ['ong'] },
  { normalizedValue: 'nap', label: 'nắp', factorToBase: 1, aliases: ['nap'] },
  { normalizedValue: 'muong', label: 'muỗng', factorToBase: 1, aliases: ['muong', 'thia'] },
  { normalizedValue: 'hop', label: 'hộp', factorToBase: 1, aliases: ['hop'] },
  { normalizedValue: 'goi', label: 'gói', factorToBase: 1, aliases: ['goi'] },
  { normalizedValue: 'tui', label: 'túi', factorToBase: 1, aliases: ['tui'] },
  { normalizedValue: 'bich', label: 'bịch', factorToBase: 1, aliases: ['bich'] },
  { normalizedValue: 'vi', label: 'vỉ', factorToBase: 1, aliases: ['vi'] },
  { normalizedValue: 'bao', label: 'bao', factorToBase: 1, aliases: ['bao'] },
  { normalizedValue: 'can', label: 'can', factorToBase: 1, aliases: ['can'] },
  { normalizedValue: 'binh', label: 'bình', factorToBase: 1, aliases: ['binh'] },
  { normalizedValue: 'khay', label: 'khay', factorToBase: 1, aliases: ['khay'] },
  { normalizedValue: 'me', label: 'mẻ', factorToBase: 1, aliases: ['me'] },
  { normalizedValue: 'ca', label: 'ca', factorToBase: 1, aliases: ['ca'] },
  { normalizedValue: 'day', label: 'dây', factorToBase: 1, aliases: ['day'] },
  { normalizedValue: 'bo', label: 'bó', factorToBase: 1, aliases: ['bo'] },
  { normalizedValue: 'xap', label: 'xấp', factorToBase: 1, aliases: ['xap'] },
];

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
  onImportSubmit?: (payload: ImportStockPayload) => void;
  onAdjustSubmit?: (payload: AdjustStockPayload) => void;
  onWasteSubmit?: (payload: WasteRecordPayload) => void;
}

const roundInventoryNumber = (value: number) => Number(value.toFixed(4));

const formatComputedNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(value);

const formatComputedCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);

const normalizeUnitValue = (unit: string | null | undefined) =>
  unit
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .toLowerCase() ?? '';

const capitalizeLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const buildUnitKeywords = (keywords: Array<string | null | undefined>) =>
  Array.from(
    new Set(
      keywords
        .map((keyword) => keyword?.trim())
        .filter((keyword): keyword is string => Boolean(keyword)),
    ),
  );

const buildPackagingUnitOption = (
  value: string,
  label: string,
  factorToStandard: number,
  keywords: Array<string | null | undefined> = [],
): PackagingUnitOption => ({
  value,
  label,
  factorToStandard,
  keywords: buildUnitKeywords([value, label, ...keywords]),
});

const dedupePackagingUnitOptions = (options: PackagingUnitOption[]) => {
  const seenValues = new Set<string>();

  return options.filter((option) => {
    const normalizedValue = normalizeUnitValue(option.value);

    if (!normalizedValue || seenValues.has(normalizedValue)) {
      return false;
    }

    seenValues.add(normalizedValue);
    return true;
  });
};

const filterCommonPackageLabels = (allowedLabels: ReadonlySet<string>) =>
  COMMON_PACKAGE_LABELS.filter((packageLabel) => allowedLabels.has(packageLabel));

const findUnitFamilyOption = (options: UnitFamilyOption[], normalizedUnit: string) =>
  options.find(
    (option) =>
      option.normalizedValue === normalizedUnit || option.aliases.includes(normalizedUnit),
  );

const isVolumeUnit = (normalizedUnit: string) =>
  Boolean(findUnitFamilyOption(VOLUME_UNIT_OPTIONS, normalizedUnit));

const isWeightUnit = (normalizedUnit: string) =>
  Boolean(findUnitFamilyOption(WEIGHT_UNIT_OPTIONS, normalizedUnit));

const isCountUnit = (normalizedUnit: string) =>
  Boolean(findUnitFamilyOption(COUNT_UNIT_OPTIONS, normalizedUnit));

const buildConvertiblePackagingUnitOptions = (
  standardUnit: string | null | undefined,
  options: UnitFamilyOption[],
): PackagingUnitOption[] | null => {
  const standardUnitLabel = standardUnit?.trim();
  const normalizedStandardUnit = normalizeUnitValue(standardUnit);
  const matchedStandardUnit = findUnitFamilyOption(options, normalizedStandardUnit);

  if (!standardUnitLabel || !matchedStandardUnit) {
    return null;
  }

  const standardOption = buildPackagingUnitOption(
    standardUnitLabel,
    standardUnitLabel,
    1,
    [matchedStandardUnit.label, ...matchedStandardUnit.aliases],
  );

  const alternateOptions = options
    .filter((option) => option.normalizedValue !== matchedStandardUnit.normalizedValue)
    .map((option) =>
      buildPackagingUnitOption(
        option.label,
        option.label,
        option.factorToBase / matchedStandardUnit.factorToBase,
        option.aliases,
      ),
    );

  return dedupePackagingUnitOptions([standardOption, ...alternateOptions]);
};

const resolveCountUnitOptions = (standardUnit: string | null | undefined): PackagingUnitOption[] | null => {
  const standardUnitLabel = standardUnit?.trim();
  const normalizedStandardUnit = normalizeUnitValue(standardUnit);
  const matchedStandardUnit = findUnitFamilyOption(COUNT_UNIT_OPTIONS, normalizedStandardUnit);

  if (!standardUnitLabel || !matchedStandardUnit) {
    return null;
  }

  return [
    buildPackagingUnitOption(
      standardUnitLabel,
      standardUnitLabel,
      1,
      [matchedStandardUnit.label, ...matchedStandardUnit.aliases],
    ),
  ];
};

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

// Danh sách đơn vị gợi ý đầy đủ khi item chưa được gán đơn vị chuẩn.
const FALLBACK_UNIT_OPTIONS: PackagingUnitOption[] = [
  ...VOLUME_UNIT_OPTIONS.map((u) => buildPackagingUnitOption(u.label, u.label, 1, u.aliases)),
  ...WEIGHT_UNIT_OPTIONS.map((u) => buildPackagingUnitOption(u.label, u.label, 1, u.aliases)),
  ...COUNT_UNIT_OPTIONS.map((u) => buildPackagingUnitOption(u.label, u.label, 1, u.aliases)),
];

/**
 * FE quy đổi đơn vị nhập thực tế về Đơn vị mà backend đang lưu kho.
 * Ví dụ: item chuẩn là `ml`, user nhập `10 hộp x 1 L` thì FE sẽ gửi `10000 ml`.
 * Nếu item chưa có đơn vị chuẩn, trả về toàn bộ đơn vị phổ biến để user tự chọn.
 */
const resolvePackagingUnitOptions = (standardUnit: string | null | undefined): PackagingUnitOption[] => {
  const normalizedStandardUnit = normalizeUnitValue(standardUnit);

  if (isVolumeUnit(normalizedStandardUnit)) {
    return buildConvertiblePackagingUnitOptions(standardUnit, VOLUME_UNIT_OPTIONS) ?? [];
  }

  if (isWeightUnit(normalizedStandardUnit)) {
    return buildConvertiblePackagingUnitOptions(standardUnit, WEIGHT_UNIT_OPTIONS) ?? [];
  }

  if (isCountUnit(normalizedStandardUnit)) {
    return resolveCountUnitOptions(standardUnit) ?? [];
  }

  // Item chưa có đơn vị chuẩn hoặc đơn vị không nhận dạng được →
  // hiển thị toàn bộ đơn vị phổ biến để user chọn phù hợp với thực tế.
  return FALLBACK_UNIT_OPTIONS;
};

/**
 * Chỉ chấp nhận custom value nếu map được về đơn vị chuẩn của item hoặc cùng hệ quy đổi hợp lệ.
 */
const resolvePackagingUnitSelection = (inputValue: string, standardUnit: string | null | undefined) => {
  const normalizedInputValue = normalizeUnitValue(inputValue);

  if (!normalizedInputValue) {
    return null;
  }

  return (
    resolvePackagingUnitOptions(standardUnit).find((option) =>
      [option.value, option.label, ...(option.keywords ?? [])].some(
        (candidate) => normalizeUnitValue(candidate) === normalizedInputValue,
      ),
    ) ?? null
  );
};

/**
 * Gợi ý đơn vị đóng gói thường gặp theo loại nguyên liệu trong quán.
 */
const resolvePackageLabelSuggestions = (standardUnit: string | null | undefined) => {
  const normalizedStandardUnit = normalizeUnitValue(standardUnit);

  if (isVolumeUnit(normalizedStandardUnit)) {
    return filterCommonPackageLabels(VOLUME_PACKAGE_LABEL_SET);
  }

  if (isWeightUnit(normalizedStandardUnit)) {
    return filterCommonPackageLabels(WEIGHT_PACKAGE_LABEL_SET);
  }

  if (isCountUnit(normalizedStandardUnit)) {
    return filterCommonPackageLabels(COUNT_PACKAGE_LABEL_SET);
  }

  return COMMON_PACKAGE_LABELS;
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
                    <p className="text-xs text-text-secondary">
                      {selectedImportItem?.unit
                        ? `Đơn vị này phải quy về đơn vị chuẩn đang lưu cho item: ${standardUnitLabel}.`
                        : 'Item chưa có đơn vị chuẩn. Chọn đơn vị phù hợp với thực tế nhập kho.'}
                    </p>
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
                <Input id="import-expiry" type="datetime-local" {...importForm.register('expiresAt')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="import-note">Ghi chú</Label>
              <Textarea
                id="import-note"
                rows={3}
                {...importForm.register('note')}
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
