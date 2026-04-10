import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useCreateCategory } from '@modules/menu/hooks/useCreateCategory';
import { useUpdateCategory } from '@modules/menu/hooks/useUpdateCategory';
import {
  createCategorySchema,
  type CreateCategoryFormValues,
} from '@modules/menu/schemas/category.schema';
import type { MenuCategoryInfo } from '@modules/menu/types/menu.types';
import { cn } from '@shared/utils/cn';
import { CategoryForm } from './CategoryForm';

interface CategoryCreateFormProps {
  nextDisplayOrder: number;
  editingCategory?: MenuCategoryInfo | null;
  onCancelEdit?: () => void;
}

/**
 * Tạo default values cho form danh mục.
 */
const buildCreateValues = (nextDisplayOrder: number): CreateCategoryFormValues => ({
  name: '',
  description: '',
  displayOrder: nextDisplayOrder,
});

/**
 * Chuyển dữ liệu danh mục hiện tại sang form values để chỉnh sửa.
 */
const buildEditValues = (category: MenuCategoryInfo): CreateCategoryFormValues => ({
  name: category.name,
  description: category.description ?? '',
  displayOrder: category.displayOrder ?? 0,
});

/**
 * Form tạo mới hoặc chỉnh sửa danh mục thực đơn.
 */
export const CategoryCreateForm = ({
  nextDisplayOrder,
  editingCategory = null,
  onCancelEdit,
}: CategoryCreateFormProps) => {
  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();
  const defaultValues = useMemo(
    () => buildCreateValues(nextDisplayOrder),
    [nextDisplayOrder]
  );
  const editingValues = useMemo(
    () => (editingCategory ? buildEditValues(editingCategory) : null),
    [editingCategory]
  );
  const isEditing = Boolean(editingCategory);
  const isPending = isCreating || isUpdating;

  const form = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues,
  });

  useEffect(() => {
    if (editingValues) {
      form.reset(editingValues);
      return;
    }

    if (!form.formState.isDirty) {
      form.reset(defaultValues);
    }
  }, [defaultValues, editingValues, form]);

  const resetToCreateMode = () => {
    form.reset(buildCreateValues(nextDisplayOrder));
    onCancelEdit?.();
  };

  const handleSubmit = (values: CreateCategoryFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      displayOrder: values.displayOrder,
    };

    if (editingCategory) {
      updateCategory(
        {
          id: editingCategory.id,
          currentCategory: editingCategory,
          payload: {
            ...payload,
            isActive: editingCategory.isActive !== false,
          },
        },
        {
          onSuccess: () => {
            resetToCreateMode();
          },
        }
      );
      return;
    }

    createCategory(payload, {
      onSuccess: () => {
        form.reset(buildCreateValues(nextDisplayOrder));
      },
    });
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-gray-900">
          {isEditing ? 'Sửa danh mục' : 'Tạo danh mục mới'}
        </h3>
        <p
          className={cn(
            'text-sm',
            isEditing ? 'text-sky-700' : 'text-gray-500'
          )}
        >
          {isEditing
            ? 'Bạn đang chỉnh sửa danh mục đã chọn. Lưu xong sẽ quay lại chế độ tạo mới.'
            : 'Điền thông tin danh mục để nhóm món ăn rõ ràng hơn trong trang menu.'}
        </p>
      </div>

      <CategoryForm
        form={form}
        onSubmit={handleSubmit}
        isPending={isPending}
        submitLabel={isEditing ? 'Lưu chỉnh sửa' : 'Tạo danh mục'}
        secondaryActionLabel={isEditing ? 'Hủy sửa' : undefined}
        onSecondaryAction={isEditing ? resetToCreateMode : undefined}
      />
    </div>
  );
};
