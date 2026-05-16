import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEditZone } from '@modules/table/hooks/useEditZone';
import type { TableArea } from '@modules/table/types/table.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { NumericInput } from '@shared/components/common/NumericInput';

const editZoneSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Tên máy gọi thẻ phải có ít nhất 2 ký tự')
    .max(100, 'Tên máy gọi thẻ không quá 100 ký tự'),
  floorNumber: z
    .number()
    .int('Số máy phải là số nguyên')
    .min(1, 'Số máy tối thiểu là 1')
    .max(99, 'Số máy tối đa là 99'),
});

type EditZoneFormData = z.infer<typeof editZoneSchema>;

interface EditZoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: TableArea | null;
  onSuccess?: () => void;
}

export const EditZoneDialog = ({
  open,
  onOpenChange,
  zone,
  onSuccess,
}: EditZoneDialogProps) => {
  const { mutate: editZone, isPending } = useEditZone();
  const {
    register,
    handleSubmit,
    clearErrors,
    control,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EditZoneFormData>({
    resolver: zodResolver(editZoneSchema),
    defaultValues: {
      name: '',
      floorNumber: 1,
    },
  });

  useEffect(() => {
    if (open && zone) {
      reset({
        name: zone.name,
        floorNumber: zone.floorNumber,
      });
      return;
    }

    if (!open) {
      reset({
        name: '',
        floorNumber: 1,
      });
    }
  }, [open, reset, zone]);

  const selectedFloorNumber = useWatch({ control, name: 'floorNumber' });

  const handleEditZone = (data: EditZoneFormData) => {
    if (!zone) {
      return;
    }

    editZone(
      {
        id: zone.id,
        payload: {
          name: data.name.trim(),
          floorNumber: data.floorNumber,
        },
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa máy gọi thẻ</DialogTitle>
          <DialogDescription>
            Cập nhật tên máy gọi thẻ và số máy để đồng bộ danh sách thẻ hiện tại.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleEditZone)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="edit-zone-name">Tên máy gọi thẻ</Label>
            <Input id="edit-zone-name" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-floorNumber">Số máy</Label>
            <NumericInput
              id="edit-floorNumber"
              min={1}
              max={99}
              value={selectedFloorNumber}
              onValueChange={(value) => {
                setValue('floorNumber', value, { shouldDirty: true, shouldValidate: true });
                clearErrors('floorNumber');
              }}
            />
            {errors.floorNumber && (
              <p className="text-xs text-red-500">{errors.floorNumber.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={!zone || !isDirty || isPending}>
              {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
