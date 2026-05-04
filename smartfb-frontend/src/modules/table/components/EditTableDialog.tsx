import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
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

// SỬA: Schema dùng zoneId thay vì areaName
const editTableSchema = z.object({
  name: z.string().min(2, 'Tên bàn phải có ít nhất 2 ký tự').max(50, 'Tên bàn không quá 50 ký tự'),
  zoneId: z.string().min(1, 'Vui lòng chọn khu vực'),  // ĐỔI: areaName -> zoneId
  capacity: z
    .number()
    .int('Sức chứa phải là số nguyên')
    .min(1, 'Sức chứa phải lớn hơn 0')
    .max(20, 'Sức chứa không quá 20'),
  isActive: z.boolean(),  // ĐỔI: status string -> isActive boolean
});

type EditTableFormData = z.infer<typeof editTableSchema>;

interface EditTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableItem;
  zones: TableArea[];  // ĐỔI: areas -> zones
  onSuccess?: () => void;
}

export const EditTableDialog = ({ open, onOpenChange, table, zones, onSuccess }: EditTableDialogProps) => {
  const { mutate: editTable, isPending, isError, error } = useEditTable();

  const hasActiveOrder =
    table.usageStatus === 'occupied' ||
    table.usageStatus === 'unpaid' ||
    table.usageStatus === 'reserved';

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
      zoneId: table.zoneId,  // ĐỔI: areaName -> zoneId
      capacity: table.capacity,
      isActive: table.status === 'active',  // ĐỔI: status -> isActive boolean
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: table.name,
        zoneId: table.zoneId,  // ĐỔI
        capacity: table.capacity,
        isActive: table.status === 'active',  // ĐỔI
      });
    }
  }, [open, table, reset]);

  const selectedIsActive = useWatch({ control, name: 'isActive' });  // ĐỔI
  const selectedZoneId = useWatch({ control, name: 'zoneId' });  // ĐỔI
  const selectedCapacity = useWatch({ control, name: 'capacity' });

  const onSubmit = (data: EditTableFormData) => {
    if (hasActiveOrder) return;
    const payload: UpdateTablePayload = {
      name: data.name,
      zoneId: data.zoneId,
      capacity: data.capacity,
      isActive: data.isActive,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa bàn</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin bàn <strong>{table.name}</strong>
          </DialogDescription>
        </DialogHeader>

        {hasActiveOrder && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">Không thể chỉnh sửa bàn này</p>
              <p className="mt-0.5 text-amber-700">
                Bàn đang có đơn hàng ({table.usageStatus === 'unpaid' ? 'chờ thanh toán' : table.usageStatus === 'reserved' ? 'đã đặt trước' : 'đang phục vụ'}).
                Vui lòng hoàn tất hoặc hủy đơn trước khi chỉnh sửa.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <Label htmlFor="name">Tên bàn</Label>
              <Input id="name" {...register('name')} disabled={hasActiveOrder} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="zoneId">Khu vực</Label>  {/* ĐỔI */}
              <Select
                value={selectedZoneId}
                onValueChange={(value) => setValue('zoneId', value, { shouldDirty: true })}
                disabled={hasActiveOrder}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn khu vực" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (  // ĐỔI
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name} {zone.floorNumber ? `(Tầng ${zone.floorNumber})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.zoneId && <p className="text-xs text-red-500">{errors.zoneId.message}</p>}  {/* ĐỔI */}
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
                disabled={hasActiveOrder}
              />
              {errors.capacity && <p className="text-xs text-red-500">{errors.capacity.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="isActive">Trạng thái hoạt động</Label>  {/* ĐỔI */}
              <Select
                value={selectedIsActive ? 'active' : 'inactive'}
                onValueChange={(value) => 
                  setValue('isActive', value === 'active', { shouldDirty: true })
                }
                disabled={hasActiveOrder}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Ngưng hoạt động</SelectItem>
                </SelectContent>
              </Select>
              {errors.isActive && <p className="text-xs text-red-500">{errors.isActive.message}</p>}
            </div>
          </div>

          {isError && error && (
            <p className="text-xs text-red-500">
              {error instanceof Error ? error.message : 'Đã có lỗi, vui lòng kiểm tra lại thông tin.'}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={!isDirty || isPending || hasActiveOrder}>
              {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};