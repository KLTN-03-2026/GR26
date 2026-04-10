import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateBulkTables } from '@modules/table/hooks/useCreateBulkTables';
import type {
  CreateBulkTablesResult,
  TableArea,
} from '@modules/table/types/table.types';
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

const createBulkTablesSchema = z.object({
  zoneId: z.string().min(1, 'Vui lòng chọn khu vực'),
  namePrefix: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tiền tố tên bàn')
    .max(30, 'Tiền tố không quá 30 ký tự'),
  startNumber: z
    .number()
    .int('Số bắt đầu phải là số nguyên')
    .min(1, 'Số bắt đầu tối thiểu là 1')
    .max(9999, 'Số bắt đầu tối đa là 9999'),
  quantity: z
    .number()
    .int('Số lượng phải là số nguyên')
    .min(2, 'Tạo hàng loạt tối thiểu 2 bàn')
    .max(50, 'Mỗi lần chỉ tạo tối đa 50 bàn'),
  capacity: z
    .number()
    .int('Sức chứa phải là số nguyên')
    .min(1, 'Sức chứa tối thiểu là 1')
    .max(20, 'Sức chứa tối đa là 20'),
});

type CreateBulkTablesFormData = z.infer<typeof createBulkTablesSchema>;

interface CreateBulkTablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zones: TableArea[];
  onSuccess?: () => void;
}

export const CreateBulkTablesDialog = ({
  open,
  onOpenChange,
  zones,
  onSuccess,
}: CreateBulkTablesDialogProps) => {
  const { mutate: createBulkTables, isPending } = useCreateBulkTables();
  const {
    register,
    handleSubmit,
    clearErrors,
    control,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreateBulkTablesFormData>({
    resolver: zodResolver(createBulkTablesSchema),
    defaultValues: {
      zoneId: '',
      namePrefix: 'Bàn ',
      startNumber: 1,
      quantity: 10,
      capacity: 4,
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const selectedZoneId = useWatch({ control, name: 'zoneId' });
  const selectedStartNumber = useWatch({ control, name: 'startNumber' });
  const selectedQuantity = useWatch({ control, name: 'quantity' });
  const selectedCapacity = useWatch({ control, name: 'capacity' });
  const selectedNamePrefix = useWatch({ control, name: 'namePrefix' });

  const previewTableNames = useMemo(() => {
    const normalizedPrefix = selectedNamePrefix?.trim() || '';

    if (!normalizedPrefix || !selectedStartNumber || !selectedQuantity) {
      return [];
    }

    return Array.from({ length: selectedQuantity }, (_, index) =>
      `${normalizedPrefix}${selectedStartNumber + index}`
    );
  }, [selectedNamePrefix, selectedQuantity, selectedStartNumber]);

  const handleCreateBulkTables = (data: CreateBulkTablesFormData) => {
    createBulkTables(
      {
        zoneId: data.zoneId,
        namePrefix: data.namePrefix.trim(),
        startNumber: data.startNumber,
        quantity: data.quantity,
        capacity: data.capacity,
      },
      {
        onSuccess: (result: CreateBulkTablesResult) => {
          if (result.createdTables.length > 0) {
            onSuccess?.();
            onOpenChange(false);
            reset();
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Tạo bàn hàng loạt</DialogTitle>
          <DialogDescription>
            Sinh nhanh nhiều bàn trong cùng một khu vực theo tiền tố và số thứ tự.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleCreateBulkTables)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="bulk-zoneId">Khu vực</Label>
              <Select
                value={selectedZoneId}
                onValueChange={(value) => {
                  setValue('zoneId', value, { shouldDirty: true, shouldValidate: true });
                  clearErrors('zoneId');
                }}
              >
                <SelectTrigger id="bulk-zoneId" className="w-full">
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
                  Chưa có khu vực nào. Hãy tạo khu vực trước khi dùng chế độ tạo hàng loạt.
                </p>
              )}
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="namePrefix">Tiền tố tên bàn</Label>
              <Input id="namePrefix" {...register('namePrefix')} placeholder="Ví dụ: Bàn A-, VIP-" />
              {errors.namePrefix && (
                <p className="text-xs text-red-500">{errors.namePrefix.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="startNumber">Số bắt đầu</Label>
              <NumericInput
                id="startNumber"
                min={1}
                max={9999}
                value={selectedStartNumber}
                onValueChange={(value) => {
                  setValue('startNumber', value, { shouldDirty: true, shouldValidate: true });
                  clearErrors('startNumber');
                }}
              />
              {errors.startNumber && (
                <p className="text-xs text-red-500">{errors.startNumber.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="quantity">Số lượng bàn</Label>
              <NumericInput
                id="quantity"
                min={2}
                max={50}
                value={selectedQuantity}
                onValueChange={(value) => {
                  setValue('quantity', value, { shouldDirty: true, shouldValidate: true });
                  clearErrors('quantity');
                }}
              />
              {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="capacity">Sức chứa mỗi bàn</Label>
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

          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-800">Xem trước tên bàn</p>
            {previewTableNames.length > 0 ? (
              <>
                <div className="mt-2 flex flex-wrap gap-2">
                  {previewTableNames.slice(0, 6).map((name) => (
                    <span
                      key={name}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm"
                    >
                      {name}
                    </span>
                  ))}
                </div>
                {previewTableNames.length > 6 && (
                  <p className="mt-2 text-xs text-gray-500">
                    Và thêm {previewTableNames.length - 6} bàn nữa theo cùng quy tắc đặt tên.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2 text-xs text-gray-500">
                Nhập tiền tố, số bắt đầu và số lượng để xem trước danh sách bàn.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={!isDirty || isPending || zones.length === 0}>
              {isPending ? 'Đang tạo...' : 'Tạo hàng loạt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
