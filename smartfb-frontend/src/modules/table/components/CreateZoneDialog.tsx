import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateZone } from '@modules/table/hooks/useCreateZone';
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

const createZoneSchema = z.object({
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

type CreateZoneFormData = z.infer<typeof createZoneSchema>;

interface CreateZoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateZoneDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateZoneDialogProps) => {
  const { mutate: createZone, isPending } = useCreateZone();
  const {
    register,
    handleSubmit,
    clearErrors,
    reset,
    setValue,
    control,
    formState: { errors, isDirty },
  } = useForm<CreateZoneFormData>({
    resolver: zodResolver(createZoneSchema),
    defaultValues: {
      name: '',
      floorNumber: 1,
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const selectedFloorNumber = useWatch({ control, name: 'floorNumber' });

  const handleCreateZone = (data: CreateZoneFormData) => {
    createZone(
      {
        name: data.name.trim(),
        floorNumber: data.floorNumber,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onOpenChange(false);
          reset();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Tạo máy gọi thẻ mới</DialogTitle>
          <DialogDescription>
            Thêm máy gọi thẻ để gán thẻ và gửi tín hiệu rung/kêu cho khách.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleCreateZone)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="zone-name">Tên máy gọi thẻ</Label>
            <Input id="zone-name" {...register('name')} placeholder="Ví dụ: Máy A, Máy B, Máy quầy chính" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="floorNumber">Số máy</Label>
            <NumericInput
              id="floorNumber"
              min={1}
              max={99}
              value={selectedFloorNumber}
              onValueChange={(value) => {
                setValue('floorNumber', value, { shouldDirty: true, shouldValidate: true });
                clearErrors('floorNumber');
              }}
            />
            <p className="text-xs text-gray-500">
              Dùng để sắp xếp máy gọi thẻ trên danh sách.
            </p>
            {errors.floorNumber && (
              <p className="text-xs text-red-500">{errors.floorNumber.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={!isDirty || isPending}>
              {isPending ? 'Đang tạo...' : 'Tạo máy gọi thẻ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
