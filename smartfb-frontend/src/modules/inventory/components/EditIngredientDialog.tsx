import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { PencilLine } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { menuService } from '@modules/menu/services/menuService';
import { useUpdateIngredient } from '@modules/inventory/hooks/useUpdateIngredient';
import type { InventoryIngredientCatalogRow } from '@modules/inventory/types/inventory.types';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { queryKeys } from '@shared/constants/queryKeys';

const editIngredientSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên nguyên liệu không được để trống')
    .max(255, 'Tên không được vượt quá 255 ký tự'),
  unit: z
    .string()
    .min(1, 'Đơn vị tính không được để trống')
    .max(30, 'Đơn vị tính không được vượt quá 30 ký tự'),
  basePrice: z
    .string()
    .optional()
    .refine((value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0), {
      message: 'Giá không được âm',
    }),
});

type EditIngredientFormValues = z.infer<typeof editIngredientSchema>;

interface EditIngredientDialogProps {
  ingredient: InventoryIngredientCatalogRow | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

/**
 * Dialog cập nhật thông tin danh mục của nguyên liệu.
 * Chỉ chỉnh metadata item, không can thiệp vào số lượng tồn kho hiện có.
 */
export const EditIngredientDialog = ({
  ingredient,
  onOpenChange,
  open,
}: EditIngredientDialogProps) => {
  const { mutateAsync: updateIngredient, isPending: isUpdating } = useUpdateIngredient();

  const ingredientDetailQuery = useQuery({
    queryKey: queryKeys.menu.detail(ingredient?.itemId ?? ''),
    queryFn: () => menuService.getById(ingredient?.itemId ?? ''),
    enabled: Boolean(open && ingredient?.itemId),
  });

  const defaultValues = useMemo<EditIngredientFormValues>(() => {
    const detail = ingredientDetailQuery.data?.data;

    return {
      name: detail?.name ?? ingredient?.itemName ?? '',
      unit: detail?.unit ?? ingredient?.unit ?? '',
      basePrice:
        detail?.basePrice !== undefined && detail?.basePrice !== null
          ? String(detail.basePrice)
          : '',
    };
  }, [ingredient?.itemName, ingredient?.unit, ingredientDetailQuery.data?.data]);

  const form = useForm<EditIngredientFormValues>({
    resolver: zodResolver(editIngredientSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      return;
    }

    const timeoutId = window.setTimeout(() => form.reset(defaultValues), 300);
    return () => window.clearTimeout(timeoutId);
  }, [defaultValues, form, open]);

  const handleSubmit = async (values: EditIngredientFormValues) => {
    if (!ingredient) {
      return;
    }

    const detail = ingredientDetailQuery.data?.data;

    await updateIngredient({
      id: ingredient.itemId,
      name: values.name,
      unit: values.unit,
      basePrice: values.basePrice ? Number(values.basePrice) : 0,
      category: detail?.category ?? '',
      isActive: detail?.isActive ?? true,
      isSyncDelivery: detail?.isSyncDelivery ?? false,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilLine className="h-5 w-5 text-primary" />
            Chỉnh sửa nguyên liệu
          </DialogTitle>
          <DialogDescription>
            Cập nhật tên và thông tin cơ bản của nguyên liệu trong danh mục kho. Thao tác này
            không làm thay đổi số lượng tồn kho hiện tại.
          </DialogDescription>
        </DialogHeader>

        {ingredientDetailQuery.isLoading ? (
          <div className="flex h-36 items-center justify-center">
            <div className="spinner spinner-md" />
          </div>
        ) : ingredientDetailQuery.isError ? (
          <div className="rounded-card border border-red-200 bg-red-50 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-red-700">
              Không thể tải thông tin nguyên liệu
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => void ingredientDetailQuery.refetch()}
            >
              Thử lại
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên nguyên liệu *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: Sữa tươi không đường" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đơn vị tính *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: ml, g, chai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá vốn tham khảo</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="Mặc định: 0đ"
                        {...field}
                        onChange={(event) => {
                          const sanitizedValue = event.target.value.replace(/[^0-9]/g, '');
                          field.onChange(sanitizedValue);
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-text-secondary">
                      Giá vốn dùng cho tham chiếu báo cáo, không ảnh hưởng trực tiếp đến tồn kho.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-3 pt-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUpdating}
                  onClick={() => onOpenChange(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
