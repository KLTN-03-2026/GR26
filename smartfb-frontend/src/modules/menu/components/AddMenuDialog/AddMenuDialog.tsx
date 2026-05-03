import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMenuSchema, type CreateMenuFormValues } from '@modules/menu/schemas/menu.schema';
import { MenuForm } from './MenuForm';
import { useCreateMenu } from '@modules/menu/hooks/useCreateMenu';
import { useUpdateMenu } from '@modules/menu/hooks/useUpdateMenu';
import type { MenuCategoryInfo, MenuItem } from '@modules/menu/types/menu.types';
import { NO_MENU_CATEGORY_VALUE } from '@modules/menu/constants/menu.constants';
import { optimizeMenuImageForUpload } from '@modules/menu/utils/menuImageUpload';
import { useToast } from '@shared/hooks/useToast';

interface AddMenuDialogProps {
  categories: MenuCategoryInfo[];
  menu?: MenuItem | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  triggerClassName?: string;
  branchId?: string | null;
}

/**
 * Dialog để tạo mới món ăn
 */
export const AddMenuDialog = ({
  categories,
  menu = null,
  open,
  onOpenChange,
  onSuccess,
  triggerClassName,
  branchId = null,
}: AddMenuDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { mutateAsync: createMenu, isPending: isCreating } = useCreateMenu();
  const { mutateAsync: updateMenu, isPending: isUpdating } = useUpdateMenu();
  const { error } = useToast();

  const isEditMode = Boolean(menu);
  const isControlled = typeof open === 'boolean';
  const dialogOpen = isControlled ? open : internalOpen;
  const isPending = isCreating || isUpdating;
  const shouldRenderTrigger = !isControlled && !isEditMode;

  const defaultValues = useMemo<CreateMenuFormValues>(() => {
    return {
      name: menu?.name ?? '',
      category: menu?.category ?? categories[0]?.id ?? NO_MENU_CATEGORY_VALUE,
      price: menu?.price ?? 0,
      unit: menu?.unit ?? '',
      imageFile: undefined,
      isSyncDelivery: menu?.isSyncDelivery ?? false,
    };
  }, [categories, menu]);

  const form = useForm<CreateMenuFormValues>({
    resolver: zodResolver(createMenuSchema),
    defaultValues,
  });

  /**
   * Đồng bộ form khi đổi mode, đổi item đang sửa hoặc mở lại dialog.
   */
  useEffect(() => {
    if (dialogOpen) {
      form.reset(defaultValues);
    }
  }, [defaultValues, dialogOpen, form]);

  /**
   * Đồng bộ trạng thái mở dialog cho cả mode controlled và uncontrolled.
   */
  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    if (!nextOpen) {
      form.reset(defaultValues);
    }

    onOpenChange?.(nextOpen);
  };

  const handleSubmit = async (values: CreateMenuFormValues) => {
    let optimizedImageFile: File | null | undefined = values.imageFile;

    if (values.imageFile) {
      try {
        optimizedImageFile = await optimizeMenuImageForUpload(values.imageFile);
      } catch (optimizationError) {
        error(
          'Không thể xử lý ảnh trước khi tải lên',
          optimizationError instanceof Error ? optimizationError.message : 'Vui lòng thử lại với ảnh khác'
        );
        return;
      }
    }

    const payload = {
      name: values.name.trim(),
      category: values.category,
      price: values.price,
      unit: values.unit?.trim() || undefined,
      imageFile: optimizedImageFile,
      isSyncDelivery: Boolean(values.isSyncDelivery),
    };

    if (isEditMode && menu) {
      try {
        await updateMenu({
          id: menu.id,
          payload: {
            ...payload,
            isActive: menu.isActive ?? menu.isAvailable ?? true,
          },
        });
        handleOpenChange(false);
        onSuccess?.();
      } catch {
        return;
      }

      return;
    }

    try {
      // Author: Hoàng | date: 2026-05-02 | note: Khi đang quản lý một chi nhánh, tạo món kèm branchId để BE bật món ở chi nhánh đó và tắt ở chi nhánh khác.
      await createMenu({ payload, branchId });
      handleOpenChange(false);
      onSuccess?.();
    } catch {
      return;
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {shouldRenderTrigger && (
        <DialogTrigger asChild>
          <Button className={cn('bg-amber-600 hover:bg-amber-700', triggerClassName)}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm món mới
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className=" max-h-[90vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto p-4 sm:p-6 ">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditMode ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {isEditMode
              ? 'Cập nhật thông tin món ăn, bao gồm ảnh, giá bán và trạng thái đồng bộ.'
              : 'Nhập thông tin món ăn và chọn ảnh nếu cần trước khi lưu vào thực đơn.'}
          </DialogDescription>
        </DialogHeader>
        <MenuForm
          form={form}
          categories={categories}
          existingImageUrl={menu?.image}
          onSubmit={handleSubmit}
          isPending={isPending}
          submitLabel={isEditMode ? 'Lưu thay đổi' : 'Lưu món ăn'}
        />
      </DialogContent>
    </Dialog>
  );
};
