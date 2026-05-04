import { useMemo, useState } from 'react';
import {
  SearchableCombobox,
  type SearchableComboboxOption,
} from '@shared/components/common/SearchableCombobox';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { sanitizeDecimalInputValue } from '@shared/utils/numberInput';
import type {
  RecipeIngredientOption,
  RecipeLine,
  RecipeLineFormValues,
  RecipeTargetItemType,
} from '@modules/recipe/types/recipe.types';

interface RecipeLineDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  targetItemName: string;
  /** FIX BUG: Author: HOÀNG | 16/04/2026 — thêm để biết có cần hiện field sản lượng chuẩn không */
  targetItemType: RecipeTargetItemType;
  ingredientOptions: RecipeIngredientOption[];
  initialLine?: RecipeLine | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RecipeLineFormValues) => Promise<void>;
}

// FIX BUG: Author: HOÀNG | 16/04/2026 — thêm baseOutputQuantity và baseOutputUnit vào giá trị rỗng
const EMPTY_FORM_VALUES: RecipeLineFormValues = {
  ingredientItemId: '',
  quantity: '',
  unit: '',
  baseOutputQuantity: '',
  baseOutputUnit: '',
};

/**
 * Tạo giá trị khởi tạo cho form từ dòng công thức hiện tại.
 *
 * FIX BUG: Author: HOÀNG | 16/04/2026 — map thêm baseOutputQuantity và baseOutputUnit
 * để khi mở form edit, user thấy ngay sản lượng chuẩn đã lưu trước đó.
 */
const buildInitialFormValues = (line?: RecipeLine | null): RecipeLineFormValues => {
  if (!line) {
    return EMPTY_FORM_VALUES;
  }

  return {
    ingredientItemId: line.ingredientItemId,
    quantity: String(line.quantity),
    unit: line.unit,
    // FIX BUG: Author: HOÀNG | 16/04/2026
    baseOutputQuantity: line.baseOutputQuantity != null ? String(line.baseOutputQuantity) : '',
    baseOutputUnit: line.baseOutputUnit ?? '',
  };
};

/**
 * Dialog thêm hoặc sửa một dòng công thức.
 *
 * FIX BUG: Author: HOÀNG | 16/04/2026
 * Khi targetItemType = SUB_ASSEMBLY, hiển thị thêm 2 field:
 *   - Sản lượng đầu ra chuẩn (baseOutputQuantity)
 *   - Đơn vị sản lượng (baseOutputUnit)
 * Đây là thông tin bắt buộc để BE tính đúng scaleFactor khi ghi nhận mẻ sản xuất.
 */
export const RecipeLineDialog = ({
  open,
  mode,
  targetItemName,
  targetItemType,
  ingredientOptions,
  initialLine,
  isPending,
  onOpenChange,
  onSubmit,
}: RecipeLineDialogProps) => {
  // Chỉ hiển thị section sản lượng chuẩn với recipe SUB_ASSEMBLY
  const isSubAssemblyTarget = targetItemType === 'SUB_ASSEMBLY';
  const [formValues, setFormValues] = useState<RecipeLineFormValues>(() => buildInitialFormValues(initialLine));
  const [formError, setFormError] = useState('');

  const resolvedIngredientOptions = useMemo(() => {
    if (!initialLine) {
      return ingredientOptions;
    }

    const hasCurrentIngredient = ingredientOptions.some(
      (option) => option.itemId === initialLine.ingredientItemId
    );

    if (hasCurrentIngredient) {
      return ingredientOptions;
    }

    return [
      {
        itemId: initialLine.ingredientItemId,
        itemName: initialLine.ingredientName,
        itemType: initialLine.ingredientType === 'UNKNOWN' ? 'INGREDIENT' : initialLine.ingredientType,
        itemTypeLabel: initialLine.ingredientTypeLabel,
        unit: initialLine.unit,
        branchIds: [],
        quantity: initialLine.availableQuantity,
      },
      ...ingredientOptions,
    ];
  }, [ingredientOptions, initialLine]);

  const selectedIngredient = useMemo(() => {
    return resolvedIngredientOptions.find((option) => option.itemId === formValues.ingredientItemId) ?? null;
  }, [formValues.ingredientItemId, resolvedIngredientOptions]);

  const ingredientComboboxOptions = useMemo<SearchableComboboxOption[]>(() => {
    return resolvedIngredientOptions.map((ingredient) => ({
      value: ingredient.itemId,
      label: ingredient.itemName,
      description: `${ingredient.itemTypeLabel}${ingredient.unit ? ` • ${ingredient.unit}` : ''}`,
      keywords: [ingredient.itemId, ingredient.itemTypeLabel, ingredient.unit],
    }));
  }, [resolvedIngredientOptions]);

  const dialogTitle = mode === 'create' ? 'Thêm thành phần vào công thức' : 'Cập nhật định lượng';

  const dialogDescription =
    mode === 'create'
      ? `Thiết lập định lượng thành phần cho ${targetItemName}.`
      : `Chỉnh sửa lượng dùng cho ${targetItemName}.`;

  const handleIngredientChange = (value: string) => {
    const nextIngredient = ingredientOptions.find((option) => option.itemId === value) ?? null;

    // Đồng bộ đơn vị mặc định từ thành phần để giảm thao tác nhập tay.
    setFormValues((currentValues) => ({
      ...currentValues,
      ingredientItemId: value,
      unit: nextIngredient?.unit ?? currentValues.unit,
    }));
    setFormError('');
  };

  const handleSubmit = async () => {
    const parsedQuantity = Number(formValues.quantity);

    if (!formValues.ingredientItemId.trim()) {
      setFormError('Vui lòng chọn thành phần');
      return;
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setFormError('Định lượng phải lớn hơn 0');
      return;
    }

    if (!formValues.unit.trim()) {
      setFormError('Vui lòng nhập đơn vị tính');
      return;
    }

    // FIX BUG: Author: HOÀNG | 16/04/2026
    // Validate bắt buộc sản lượng chuẩn với SUB_ASSEMBLY recipe.
    // Thiếu field này sẽ khiến BE tính sai lượng nguyên liệu khi ghi nhận mẻ sản xuất.
    if (isSubAssemblyTarget) {
      const parsedBaseOutput = Number(formValues.baseOutputQuantity);
      if (!formValues.baseOutputQuantity.trim() || !Number.isFinite(parsedBaseOutput) || parsedBaseOutput <= 0) {
        setFormError('Vui lòng nhập sản lượng đầu ra chuẩn (phải lớn hơn 0)');
        return;
      }
      if (!formValues.baseOutputUnit.trim()) {
        setFormError('Vui lòng nhập đơn vị sản lượng đầu ra chuẩn');
        return;
      }
    }

    setFormError('');

    await onSubmit({
      ingredientItemId: formValues.ingredientItemId,
      quantity: String(parsedQuantity),
      unit: formValues.unit.trim(),
      // FIX BUG: Author: HOÀNG | 16/04/2026 — truyền sản lượng chuẩn nếu là SUB_ASSEMBLY
      baseOutputQuantity: isSubAssemblyTarget ? formValues.baseOutputQuantity : '',
      baseOutputUnit: isSubAssemblyTarget ? formValues.baseOutputUnit.trim() : '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipe-ingredient">Thành phần</Label>
            <SearchableCombobox
              id="recipe-ingredient"
              disabled={isPending || mode === 'edit' || resolvedIngredientOptions.length === 0}
              value={formValues.ingredientItemId}
              options={ingredientComboboxOptions}
              placeholder="Chọn nguyên liệu hoặc bán thành phẩm"
              searchPlaceholder="Tìm thành phần theo tên, loại hoặc đơn vị"
              emptyMessage="Không tìm thấy thành phần phù hợp."
              onValueChange={handleIngredientChange}
            />
            {selectedIngredient ? (
              <div className="space-y-1">
                <p className="text-xs text-gray-500">
                  Loại thành phần: {selectedIngredient.itemTypeLabel}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedIngredient.quantity === null
                    ? 'Thành phần này chưa có dữ liệu tồn kho tham chiếu. Bạn vẫn có thể thêm vào công thức.'
                    : `Tồn khả dụng tham chiếu: ${selectedIngredient.quantity.toLocaleString('vi-VN')} ${selectedIngredient.unit || 'đơn vị'}`}
                </p>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipe-quantity">Định lượng</Label>
              <Input
                id="recipe-quantity"
                type="text"
                inputMode="decimal"
                value={formValues.quantity}
                onChange={(event) => {
                  setFormValues((currentValues) => ({
                    ...currentValues,
                    quantity: sanitizeDecimalInputValue(event.target.value),
                  }));
                  setFormError('');
                }}
                placeholder="Ví dụ: 25.5"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipe-unit">Đơn vị tính</Label>
              <Input
                id="recipe-unit"
                value={formValues.unit}
                onChange={(event) => {
                  setFormValues((currentValues) => ({
                    ...currentValues,
                    unit: event.target.value,
                  }));
                  setFormError('');
                }}
                placeholder="gram, ml, cái..."
                disabled={isPending}
              />
            </div>
          </div>

          {/* FIX BUG: Author: HOÀNG | 16/04/2026
              Hiển thị thêm section sản lượng chuẩn khi cấu hình công thức cho bán thành phẩm.
              Đây là thông tin bắt buộc để BE tính đúng: scaleFactor = expectedOutput / baseOutputQuantity.
              Ví dụ: 1000g nguyên liệu → 2000ml Cà phê pin: nhập "2000" và đơn vị "ml".
          */}
          {isSubAssemblyTarget ? (
            <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">Sản lượng đầu ra chuẩn của công thức</p>
                <p className="text-xs text-blue-700">
                  Công thức này tạo ra bao nhiêu bán thành phẩm mỗi mẻ?
                  Ví dụ: nếu 1000g nguyên liệu pha được 2000ml, hãy nhập <strong>2000</strong> và đơn vị <strong>ml</strong>.
                  Backend dùng thông tin này để tính đúng lượng nguyên liệu cần trừ kho.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recipe-base-output-quantity">Sản lượng chuẩn <span className="text-red-500">*</span></Label>
                  <Input
                    id="recipe-base-output-quantity"
                    type="text"
                    inputMode="decimal"
                    value={formValues.baseOutputQuantity}
                    onChange={(event) => {
                      setFormValues((currentValues) => ({
                        ...currentValues,
                        baseOutputQuantity: sanitizeDecimalInputValue(event.target.value),
                      }));
                      setFormError('');
                    }}
                    placeholder="Ví dụ: 2000"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipe-base-output-unit">Đơn vị sản lượng <span className="text-red-500">*</span></Label>
                  <Input
                    id="recipe-base-output-unit"
                    value={formValues.baseOutputUnit}
                    onChange={(event) => {
                      setFormValues((currentValues) => ({
                        ...currentValues,
                        baseOutputUnit: event.target.value,
                      }));
                      setFormError('');
                    }}
                    placeholder="ml, lít, gram..."
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {formError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          {mode === 'edit' ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Backend hiện chỉ hỗ trợ sửa định lượng và đơn vị. Muốn đổi thành phần, hãy xóa dòng hiện tại rồi tạo dòng mới.
            </div>
          ) : null}

          {resolvedIngredientOptions.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Chưa có item `INGREDIENT` hoặc `SUB_ASSEMBLY` nào khả dụng để đưa vào công thức. Hãy tạo dữ liệu trước rồi quay lại cấu hình.
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Hủy
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isPending || resolvedIngredientOptions.length === 0}
          >
            {mode === 'create' ? 'Thêm vào công thức' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
