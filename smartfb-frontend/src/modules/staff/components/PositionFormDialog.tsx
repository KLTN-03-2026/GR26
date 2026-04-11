import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useCreatePosition } from '@modules/staff/hooks/useCreatePosition';
import { useUpdatePosition } from '@modules/staff/hooks/useUpdatePosition';
import {
  positionSchema,
  type PositionFormValues,
} from '@modules/staff/schemas/positionSchema';
import type { StaffPosition } from '@modules/staff/types/position.types';
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
import { Textarea } from '@shared/components/ui/textarea';

interface PositionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: StaffPosition | null;
}

const buildDefaultValues = (position?: StaffPosition | null): PositionFormValues => ({
  name: position?.name ?? '',
  description: position?.description ?? '',
});

/**
 * Dialog tạo mới hoặc chỉnh sửa chức vụ.
 */
export const PositionFormDialog = ({
  open,
  onOpenChange,
  position = null,
}: PositionFormDialogProps) => {
  const { mutate: createPosition, isPending: isCreating } = useCreatePosition();
  const { mutate: updatePosition, isPending: isUpdating } = useUpdatePosition();
  const defaultValues = useMemo(() => buildDefaultValues(position), [position]);
  const isEditing = Boolean(position);
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [defaultValues, open, reset]);

  const handleFormSubmit = (values: PositionFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
    };

    if (position) {
      updatePosition(
        {
          id: position.id,
          data: payload,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
      return;
    }

    createPosition(payload, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Chỉnh sửa chức vụ' : 'Tạo chức vụ mới'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Cập nhật tên và mô tả để chức vụ hiển thị rõ ràng hơn trong quản lý nhân sự.'
              : 'Tạo chức vụ để owner gán cho nhân viên khi lập hồ sơ hoặc rà soát cơ cấu nhân sự.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="position-name">Tên chức vụ</Label>
            <Input
              id="position-name"
              placeholder="Ví dụ: Thu ngân, Phục vụ ca tối, Quản lý chi nhánh"
              {...register('name')}
            />
            {errors.name ? <p className="text-xs text-red-500">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="position-description">Mô tả</Label>
            <Textarea
              id="position-description"
              rows={4}
              placeholder="Mô tả ngắn trách nhiệm chính của chức vụ này"
              {...register('description')}
            />
            <p className="text-xs text-text-secondary">
              Mô tả này giúp owner phân biệt chức vụ khi gán cho nhân viên mới.
            </p>
            {errors.description ? (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending || (isEditing && !isDirty)}>
              {isPending
                ? isEditing
                  ? 'Đang lưu...'
                  : 'Đang tạo...'
                : isEditing
                  ? 'Lưu thay đổi'
                  : 'Tạo chức vụ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
