import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { NumericInput } from '@shared/components/common/NumericInput';
import { Label } from '@shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { useCreateTable } from '@modules/table/hooks/useCreateTable';
import type { TableArea } from '@modules/table/types/table.types';

const createTableSchema = z.object({
  name: z.string().min(2, 'Tên bàn phải có ít nhất 2 ký tự').max(50, 'Tên bàn không quá 50 ký tự'),
  zoneId: z.string().min(1, 'Vui lòng chọn khu vực'),
  capacity: z.number().int('Sức chứa phải là số nguyên').min(1, 'Sức chứa tối thiểu 1').max(20, 'Sức chứa tối đa 20'),
});

type CreateTableFormData = z.infer<typeof createTableSchema>;

interface CreateTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  zones?: TableArea[];
}

export const CreateTableDialog = ({ open, onOpenChange, onSuccess, zones = [] }: CreateTableDialogProps) => {
  const { mutate: createTable, isPending } = useCreateTable();

  const {
    register,
    handleSubmit,
    clearErrors,
    control,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreateTableFormData>({
    resolver: zodResolver(createTableSchema),
    defaultValues: {
      name: '',
      zoneId: '',
      capacity: 4,
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const selectedZoneId = useWatch({ control, name: 'zoneId' });
  const selectedCapacity = useWatch({ control, name: 'capacity' });

  const onSubmit = (data: CreateTableFormData) => {
    createTable(
      {
        name: data.name,
        zoneId: data.zoneId,
        capacity: data.capacity,
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
          <DialogTitle>Thêm bàn mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin bàn ăn để thêm vào hệ thống
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <Label htmlFor="name">Tên bàn</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
                <Label htmlFor="zoneId">Khu vực</Label>
              <Select
                value={selectedZoneId}
                onValueChange={(value) => {
                  setValue('zoneId', value, { shouldDirty: true, shouldValidate: true });
                  clearErrors('zoneId');
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn khu vực" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name} {zone.floorNumber ? `(Tầng ${zone.floorNumber})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.zoneId && <p className="text-xs text-red-500">{errors.zoneId.message}</p>}
              {zones.length === 0 && (
                <p className="text-xs text-amber-600">
                  Chưa có khu vực nào. Hãy tạo khu vực trước khi thêm bàn.
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="capacity">Sức chứa</Label>
              <NumericInput
                id="capacity"
                min={1}
                max={20}
                value={selectedCapacity}
                onValueChange={(value) => {
                  setValue('capacity', value, { shouldDirty: true, shouldValidate: true });
                  clearErrors('capacity');
                }}
              />
              {errors.capacity && <p className="text-xs text-red-500">{errors.capacity.message}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={!isDirty || isPending || zones.length === 0}>
              {isPending ? 'Đang tạo...' : 'Thêm bàn'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
