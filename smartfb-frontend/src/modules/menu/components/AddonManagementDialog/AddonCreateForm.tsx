import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useCreateAddon } from '@modules/menu/hooks/useCreateAddon';
import { useUpdateAddon } from '@modules/menu/hooks/useUpdateAddon';
import { createAddonSchema, type CreateAddonFormValues } from '@modules/menu/schemas/addon.schema';
import type { MenuAddonInfo } from '@modules/menu/types/menu.types';
import { AddonForm } from './AddonForm';

interface AddonCreateFormProps {
  editingAddon?: MenuAddonInfo | null;
  onCancelEdit?: () => void;
}

/**
 * Tạo default values cho form topping.
 */
const buildCreateValues = (): CreateAddonFormValues => ({
  name: '',
  extraPrice: 0,
});

/**
 * Chuyển dữ liệu topping hiện tại sang form values để chỉnh sửa.
 */
const buildEditValues = (addon: MenuAddonInfo): CreateAddonFormValues => ({
  name: addon.name,
  extraPrice: addon.extraPrice,
});

/**
 * Form tạo mới hoặc chỉnh sửa topping trong trang menu.
 */
export const AddonCreateForm = ({
  editingAddon = null,
  onCancelEdit,
}: AddonCreateFormProps) => {
  const { mutate: createAddon, isPending: isCreating } = useCreateAddon();
  const { mutate: updateAddon, isPending: isUpdating } = useUpdateAddon();
  const defaultValues = useMemo(() => buildCreateValues(), []);
  const editingValues = useMemo(
    () => (editingAddon ? buildEditValues(editingAddon) : null),
    [editingAddon]
  );
  const isEditing = Boolean(editingAddon);
  const isPending = isCreating || isUpdating;

  const form = useForm<CreateAddonFormValues>({
    resolver: zodResolver(createAddonSchema),
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
    form.reset(buildCreateValues());
    onCancelEdit?.();
  };

  const handleSubmit = (values: CreateAddonFormValues) => {
    const payload = {
      name: values.name.trim(),
      extraPrice: values.extraPrice,
    };

    if (editingAddon) {
      updateAddon(
        {
          id: editingAddon.id,
          currentAddon: editingAddon,
          payload: {
            ...payload,
            isActive: editingAddon.isActive !== false,
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

    createAddon(payload, {
      onSuccess: () => {
        form.reset(buildCreateValues());
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
          Topping
        </span>
        <h3 className="text-base font-semibold text-gray-900">
        {isEditing ? 'Sửa topping' : 'Tạo topping mới'}
        </h3>
      </div>

      <AddonForm
        form={form}
        onSubmit={handleSubmit}
        isPending={isPending}
        submitLabel={isEditing ? 'Lưu thay đổi' : 'Tạo topping'}
        secondaryActionLabel={isEditing ? 'Hủy sửa' : undefined}
        onSecondaryAction={isEditing ? resetToCreateMode : undefined}
      />
    </div>
  );
};
