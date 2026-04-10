import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useUpdateCategory } from '@modules/menu/hooks/useUpdateCategory';
import {
  createCategorySchema,
  type CreateCategoryFormValues,
} from '@modules/menu/schemas/category.schema';
import type { MenuCategoryInfo } from '@modules/menu/types/menu.types';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/components/ui/dialog';
import { cn } from '@shared/utils/cn';
import { CategoryForm } from './CategoryForm';

interface CategoryFormDialogProps {
  category: MenuCategoryInfo;
  triggerClassName?: string;
  triggerLabel?: string;
}

/**
 * Tạo default values cho form chỉnh sửa danh mục.
 */
const buildDefaultValues = (category: MenuCategoryInfo): CreateCategoryFormValues => ({
  name: category.name,
  description: category.description ?? '',
  displayOrder: category.displayOrder ?? 0,
});

/**
 * Dialog chỉnh sửa thông tin danh mục.
 */
export const CategoryFormDialog = ({
  category,
  triggerClassName,
  triggerLabel = 'Chỉnh sửa',
}: CategoryFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const { mutate: updateCategory, isPending } = useUpdateCategory();
  const defaultValues = useMemo(() => buildDefaultValues(category), [category]);

  const form = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  const handleSubmit = (values: CreateCategoryFormValues) => {
    updateCategory(
      {
        id: category.id,
        currentCategory: category,
        payload: {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          displayOrder: values.displayOrder,
          isActive: category.isActive !== false,
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn('h-8', triggerClassName)}>
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-lg overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Chỉnh sửa danh mục
          </DialogTitle>
        </DialogHeader>

        <CategoryForm
          form={form}
          onSubmit={handleSubmit}
          isPending={isPending}
          submitLabel="Lưu thay đổi"
        />
      </DialogContent>
    </Dialog>
  );
};
