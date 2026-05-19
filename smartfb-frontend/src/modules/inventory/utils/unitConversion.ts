export type PackagingPriceMode = 'total' | 'per-package';

export interface PackagingUnitOption {
  value: string;
  label: string;
  factorToStandard: number;
  keywords?: string[];
}

interface UnitFamilyOption {
  normalizedValue: string;
  label: string;
  factorToBase: number;
  aliases: string[];
}

export interface PackagingConversionInput {
  packageCount: number;
  contentPerPackage: number;
  contentUnit: string;
  standardUnit: string | null | undefined;
  packagingPriceMode: PackagingPriceMode;
  totalCost: number;
  costPerPackage: number;
}

export interface PackagingConversionResult {
  quantity: number;
  totalCost: number;
  unitPrice: number;
  contentUnitLabel: string;
  unitOption: PackagingUnitOption | null;
}

// Các loại kiện thường gặp khi nhập hàng từ nhà cung cấp.
const COMMON_PACKAGE_LABELS = ['thùng', 'hộp', 'chai', 'can', 'bao', 'gói', 'bịch', 'túi', 'dây', 'vỉ'] as const;

// Nhóm kiện gợi ý cho nguyên liệu đo theo thể tích.
const VOLUME_PACKAGE_LABEL_SET = new Set(['thùng', 'hộp', 'chai', 'can', 'bịch']);

// Nhóm kiện gợi ý cho nguyên liệu đo theo khối lượng.
const WEIGHT_PACKAGE_LABEL_SET = new Set(['bao', 'gói', 'hộp', 'túi', 'can']);

// Nhóm kiện gợi ý cho nguyên liệu đo theo đơn vị đếm.
const COUNT_PACKAGE_LABEL_SET = new Set(['dây', 'gói', 'thùng', 'hộp', 'túi']);

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

export const roundInventoryNumber = (value: number) => Number(value.toFixed(4));

export const formatComputedNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(value);

export const formatComputedCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);

const normalizeUnitValue = (unit: string | null | undefined) =>
  unit
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .toLowerCase() ?? '';

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

// Danh sách đơn vị gợi ý đầy đủ khi item chưa được gán đơn vị chuẩn.
const FALLBACK_UNIT_OPTIONS: PackagingUnitOption[] = [
  ...VOLUME_UNIT_OPTIONS.map((unit) => buildPackagingUnitOption(unit.label, unit.label, 1, unit.aliases)),
  ...WEIGHT_UNIT_OPTIONS.map((unit) => buildPackagingUnitOption(unit.label, unit.label, 1, unit.aliases)),
  ...COUNT_UNIT_OPTIONS.map((unit) => buildPackagingUnitOption(unit.label, unit.label, 1, unit.aliases)),
];

/**
 * FE quy đổi đơn vị nhập thực tế về đơn vị mà backend đang lưu kho.
 * Ví dụ: item chuẩn là `ml`, user nhập `10 hộp x 1 L` thì FE sẽ gửi `10000 ml`.
 */
export const resolvePackagingUnitOptions = (standardUnit: string | null | undefined): PackagingUnitOption[] => {
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

  return FALLBACK_UNIT_OPTIONS;
};

/**
 * Chọn đơn vị quy đổi hợp lệ theo đơn vị chuẩn của nguyên liệu.
 */
export const resolvePackagingUnitSelection = (inputValue: string, standardUnit: string | null | undefined) => {
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
 * Gợi ý đơn vị đóng gói thường gặp theo loại đơn vị nguyên liệu.
 */
export const resolvePackageLabelSuggestions = (standardUnit: string | null | undefined) => {
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

  return [...COMMON_PACKAGE_LABELS];
};

/**
 * Tính số lượng và đơn giá sau quy đổi về đơn vị kho chuẩn.
 */
export const calculatePackagingConversion = ({
  packageCount,
  contentPerPackage,
  contentUnit,
  standardUnit,
  packagingPriceMode,
  totalCost,
  costPerPackage,
}: PackagingConversionInput): PackagingConversionResult => {
  const unitOption = resolvePackagingUnitSelection(contentUnit, standardUnit);
  const factorToStandard = unitOption?.factorToStandard ?? 1;
  const quantity = roundInventoryNumber(packageCount * contentPerPackage * factorToStandard);
  const resolvedTotalCost =
    packagingPriceMode === 'per-package'
      ? roundInventoryNumber(packageCount * costPerPackage)
      : roundInventoryNumber(totalCost);
  const unitPrice = quantity > 0 ? roundInventoryNumber(resolvedTotalCost / quantity) : 0;

  return {
    quantity,
    totalCost: resolvedTotalCost,
    unitPrice,
    contentUnitLabel: unitOption?.label ?? contentUnit,
    unitOption,
  };
};
