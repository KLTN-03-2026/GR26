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
import { useEditTable } from '../hooks/useEditTable';
import type { TableItem, TableArea, UpdateTablePayload } from '../types/table.types';
import { TableStatusValues } from '../types/table.types';

const editTableSchema = z.object({
  name: z.string().min(2, 'Tên bàn phải có ít nhất 2 ký tự').max(50, 'Tên bàn không quá 50 ký tự'),
  areaName: z.string().min(1, 'Vui lòng chọn khu vực'),
  capacity: z
    .number()
    .int('Sức chứa phải là số nguyên')
    .min(1, 'Sức chứa phải lớn hơn 0')
    .max(20, 'Sức chứa không quá 20'),
  status: z.enum(['active', 'inactive']),
});

type EditTableFormData = z.infer<typeof editTableSchema>;

interface EditTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableItem;
  areas: TableArea[];
  onSuccess?: () => void;
}

export const EditTableDialog = ({ open, onOpenChange, table, areas, onSuccess }: EditTableDialogProps) => {
  const { mutate: editTable, isPending, isError } = useEditTable();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EditTableFormData>({
    resolver: zodResolver(editTableSchema),
    defaultValues: {
      name: table.name,
      areaName: table.areaName,
      capacity: table.capacity,
      status: table.status,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: table.name,
        areaName: table.areaName,
        capacity: table.capacity,
        status: table.status,
      });
    }
  }, [open, table, reset]);

  const selectedStatus = useWatch({ control, name: 'status' });
  const selectedAreaName = useWatch({ control, name: 'areaName' });
  const selectedCapacity = useWatch({ control, name: 'capacity' });

  const onSubmit = (data: EditTableFormData) => {
    const selectedArea = areas.find((item) => item.name === data.areaName);

    const payload: UpdateTablePayload = {
      name: data.name,
      areaId: selectedArea?.id ?? table.areaId,
      capacity: data.capacity,
      branchId: table.branchId,
      status: data.status,
    };
    editTable(
      { id: table.id, payload },
      {
        onSuccess: () => {
          onSuccess?.();
          onOpenChange(false);
        },
      }
    );
  };

  const areaOptions = areas.map((area) => (
    <SelectItem key={area.id} value={area.name}>
      {area.name}
    </SelectItem>
  ));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa bàn</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin bàn <strong>{table.name}</strong>
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
              <Label htmlFor="areaName">Khu vực</Label>
              <Select
                value={selectedAreaName}
                onValueChange={(value) => setValue('areaName', value, { shouldDirty: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn khu vực" />
                </SelectTrigger>
                <SelectContent>{areaOptions}</SelectContent>
              </Select>
              {errors.areaName && <p className="text-xs text-red-500">{errors.areaName.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="capacity">Sức chứa</Label>
              <NumericInput
                id="capacity"
                min={1}
                max={20}
                value={selectedCapacity}
                onValueChange={(value) =>
                  setValue('capacity', value, { shouldDirty: true, shouldValidate: true })
                }
              />
              {errors.capacity && <p className="text-xs text-red-500">{errors.capacity.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="status">Trạng thái hoạt động</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setValue('status', value as 'active' | 'inactive', { shouldDirty: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TableStatusValues.ACTIVE}>Hoạt động</SelectItem>
                  <SelectItem value={TableStatusValues.INACTIVE}>Ngưng hoạt động</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
            </div>
          </div>

          {isError && (
            <p className="text-xs text-red-500">Đã có lỗi, vui lòng kiểm tra lại thông tin.</p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={!isDirty || isPending}>
              {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
