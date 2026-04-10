import { useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import type {
  RecipeIngredientOption,
  RecipeLine,
  RecipeLineFormValues,
} from '@modules/recipe/types/recipe.types';

interface RecipeLineDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  targetItemName: string;
  ingredientOptions: RecipeIngredientOption[];
  initialLine?: RecipeLine | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RecipeLineFormValues) => Promise<void>;
}

const EMPTY_FORM_VALUES: RecipeLineFormValues = {
  ingredientItemId: '',
  quantity: '',
  unit: '',
};

/**
 * Tạo giá trị khởi tạo cho form từ dòng công thức hiện tại.
 */
const buildInitialFormValues = (line?: RecipeLine | null): RecipeLineFormValues => {
  if (!line) {
    return EMPTY_FORM_VALUES;
  }

  return {
    ingredientItemId: line.ingredientItemId,
    quantity: String(line.quantity),
    unit: line.unit,
  };
};

/**
 * Dialog thêm hoặc sửa một dòng công thức.
 */
export const RecipeLineDialog = ({
  open,
  mode,
  targetItemName,
  ingredientOptions,
  initialLine,
  isPending,
  onOpenChange,
  onSubmit,
}: RecipeLineDialogProps) => {
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
        unit: initialLine.unit,
        branchIds: [],
        quantity: initialLine.availableQuantity ?? 0,
      },
      ...ingredientOptions,
    ];
  }, [ingredientOptions, initialLine]);

  const selectedIngredient = useMemo(() => {
    return resolvedIngredientOptions.find((option) => option.itemId === formValues.ingredientItemId) ?? null;
  }, [formValues.ingredientItemId, resolvedIngredientOptions]);

  const dialogTitle = mode === 'create' ? 'Thêm nguyên liệu vào công thức' : 'Cập nhật định lượng';

  const dialogDescription =
    mode === 'create'
      ? `Thiết lập định lượng nguyên liệu cho món ${targetItemName}.`
      : `Chỉnh sửa lượng dùng cho món ${targetItemName}.`;

  const handleIngredientChange = (value: string) => {
    const nextIngredient = ingredientOptions.find((option) => option.itemId === value) ?? null;

    // Đồng bộ đơn vị mặc định từ nguyên liệu để giảm thao tác nhập tay.
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
      setFormError('Vui lòng chọn nguyên liệu');
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

    setFormError('');

    await onSubmit({
      ingredientItemId: formValues.ingredientItemId,
      quantity: String(parsedQuantity),
      unit: formValues.unit.trim(),
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
            <Label htmlFor="recipe-ingredient">Nguyên liệu</Label>
            <Select
              disabled={isPending || mode === 'edit' || resolvedIngredientOptions.length === 0}
              value={formValues.ingredientItemId}
              onValueChange={handleIngredientChange}
            >
              <SelectTrigger id="recipe-ingredient">
                <SelectValue placeholder="Chọn nguyên liệu từ kho" />
              </SelectTrigger>
              <SelectContent>
                {resolvedIngredientOptions.map((ingredient) => (
                  <SelectItem key={ingredient.itemId} value={ingredient.itemId}>
                    {ingredient.itemName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedIngredient ? (
              <p className="text-xs text-gray-500">
                Tồn khả dụng tham chiếu: {selectedIngredient.quantity.toLocaleString('vi-VN')} {selectedIngredient.unit || 'đơn vị'}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipe-quantity">Định lượng</Label>
              <Input
                id="recipe-quantity"
                type="number"
                min="0.0001"
                step="0.0001"
                value={formValues.quantity}
                onChange={(event) => {
                  setFormValues((currentValues) => ({
                    ...currentValues,
                    quantity: event.target.value,
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

          {formError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          {mode === 'edit' ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Backend hiện chỉ hỗ trợ sửa định lượng và đơn vị. Muốn đổi nguyên liệu, hãy xóa dòng hiện tại rồi tạo dòng mới.
            </div>
          ) : null}

          {resolvedIngredientOptions.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Chưa có nguyên liệu khả dụng từ dữ liệu tồn kho. Hãy nhập kho trước hoặc bổ sung API catalog nguyên liệu từ backend.
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
