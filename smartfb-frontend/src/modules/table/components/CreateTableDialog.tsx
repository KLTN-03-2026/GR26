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

// Backend table vẫn yêu cầu capacity, FE cố định 1 vì thẻ gọi khách không dùng thông tin này.
const DEFAULT_PAGER_CARD_CAPACITY = 1;

const createTableSchema = z.object({
  name: z.string().min(2, 'Mã thẻ phải có ít nhất 2 ký tự').max(50, 'Mã thẻ không quá 50 ký tự'),
  zoneId: z.string().min(1, 'Vui lòng chọn máy gọi thẻ'),
  capacity: z.number().int().min(1).max(20),
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
      capacity: DEFAULT_PAGER_CARD_CAPACITY,
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const selectedZoneId = useWatch({ control, name: 'zoneId' });

  const onSubmit = (data: CreateTableFormData) => {
    createTable(
      {
        name: data.name,
        zoneId: data.zoneId,
        capacity: DEFAULT_PAGER_CARD_CAPACITY,
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
          <DialogTitle>Thêm thẻ gọi khách</DialogTitle>
          <DialogDescription>
            Nhập mã thẻ và máy gọi thẻ để thêm vào hệ thống.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <Label htmlFor="name">Mã/tên thẻ</Label>
              <Input id="name" {...register('name')} placeholder="Ví dụ: Thẻ 01, A-01" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
                <Label htmlFor="zoneId">Máy gọi thẻ</Label>
              <Select
                value={selectedZoneId}
                onValueChange={(value) => {
                  setValue('zoneId', value, { shouldDirty: true, shouldValidate: true });
                  clearErrors('zoneId');
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn máy gọi thẻ" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name} {zone.floorNumber ? `(Máy ${zone.floorNumber})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.zoneId && <p className="text-xs text-red-500">{errors.zoneId.message}</p>}
              {zones.length === 0 && (
                <p className="text-xs text-amber-600">
                  Chưa có máy gọi thẻ nào. Hãy tạo máy gọi thẻ trước khi thêm thẻ.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={!isDirty || isPending || zones.length === 0}>
              {isPending ? 'Đang tạo...' : 'Thêm thẻ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
