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

// Backend table vẫn yêu cầu capacity, FE cố định 1 vì thẻ không dùng thông tin này.
const DEFAULT_PAGER_CARD_CAPACITY = 1;

const createBulkTablesSchema = z.object({
  zoneId: z.string().min(1, 'Vui lòng chọn máy gọi thẻ'),
  namePrefix: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tiền tố mã thẻ')
    .max(30, 'Tiền tố không quá 30 ký tự'),
  startNumber: z
    .number()
    .int('Số bắt đầu phải là số nguyên')
    .min(1, 'Số bắt đầu tối thiểu là 1')
    .max(9999, 'Số bắt đầu tối đa là 9999'),
  quantity: z
    .number()
    .int('Số lượng phải là số nguyên')
    .min(2, 'Tạo hàng loạt tối thiểu 2 thẻ')
    .max(50, 'Mỗi lần chỉ tạo tối đa 50 thẻ'),
  capacity: z.number().int().min(1).max(20),
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
      namePrefix: 'Thẻ ',
      startNumber: 1,
      quantity: 10,
      capacity: DEFAULT_PAGER_CARD_CAPACITY,
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
        capacity: DEFAULT_PAGER_CARD_CAPACITY,
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
          <DialogTitle>Tạo thẻ hàng loạt</DialogTitle>
          <DialogDescription>
            Sinh nhanh nhiều thẻ theo máy gọi thẻ, tiền tố và số thứ tự.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleCreateBulkTables)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="bulk-zoneId">Máy gọi thẻ</Label>
              <Select
                value={selectedZoneId}
                onValueChange={(value) => {
                  setValue('zoneId', value, { shouldDirty: true, shouldValidate: true });
                  clearErrors('zoneId');
                }}
              >
                <SelectTrigger id="bulk-zoneId" className="w-full">
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
                  Chưa có máy gọi thẻ nào. Hãy tạo máy gọi thẻ trước khi dùng chế độ tạo hàng loạt.
                </p>
              )}
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="namePrefix">Tiền tố mã thẻ</Label>
              <Input id="namePrefix" {...register('namePrefix')} placeholder="Ví dụ: Thẻ A-, Máy A-" />
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
              <Label htmlFor="quantity">Số lượng thẻ</Label>
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
          </div>

          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-800">Xem trước mã thẻ</p>
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
                    Và thêm {previewTableNames.length - 6} thẻ nữa theo cùng quy tắc đặt mã.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2 text-xs text-gray-500">
                Nhập tiền tố, số bắt đầu và số lượng để xem trước danh sách thẻ.
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
