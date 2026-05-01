import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
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
import { useCreateTable } from '../hooks/useCreateTable';
import { mockTableDetails, mockTableAreas } from '../data/tableDetails';
import type { TableDetail } from '../types/table.types';

const createTableSchema = z.object({
  name: z.string().min(2, 'Tên bàn phải có ít nhất 2 ký tự').max(50, 'Tên bàn không quá 50 ký tự'),
  areaId: z.string().min(1, 'Vui lòng chọn khu vực'),
  branchId: z.string().min(1, 'Vui lòng chọn chi nhánh'),
  capacity: z.number().int('Sức chứa phải là số nguyên').min(1, 'Sức chứa tối thiểu 1').max(20, 'Sức chứa tối đa 20'),
});

type CreateTableFormData = z.infer<typeof createTableSchema>;

interface CreateTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateTableDialog = ({ open, onOpenChange, onSuccess }: CreateTableDialogProps) => {
  const { mutate: createTable, isPending } = useCreateTable();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreateTableFormData>({
    resolver: zodResolver(createTableSchema),
    defaultValues: {
      name: '',
      areaId: '',
      branchId: '',
      capacity: 4,
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const branches = useMemo(() => {
    const branchMap = new Map<string, string>();
    mockTableDetails.forEach((table) => {
      if (!branchMap.has(table.branchId)) {
        branchMap.set(table.branchId, table.branchName);
      }
    });
    return Array.from(branchMap.entries()).map(([id, name]) => ({ id, name }));
  }, []);

  const areas = mockTableAreas;
  const selectedAreaId = watch('areaId');
  const selectedBranchId = watch('branchId');

  const onSubmit = (data: CreateTableFormData) => {
    const duplicate = mockTableDetails.find(
      (table) =>
        table.name.toLowerCase() === data.name.toLowerCase() &&
        table.areaId === data.areaId &&
        table.branchId === data.branchId
    );

    if (duplicate) {
      setError('name', { type: 'manual', message: 'Tên bàn đã tồn tại trong khu vực này' });
      return;
    }

    // const area = mockTableAreas.find(a => a.id === data.areaId);
    // const branch = branches.find(b => b.id === data.branchId);

    createTable(
      {
        name: data.name,
        areaId: data.areaId,
        capacity: data.capacity,
        branchId: data.branchId,
        description: '',
      },
      {
        onSuccess: (_newTable: TableDetail) => {
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
              <Label htmlFor="areaId">Khu vực</Label>
              <Select
                value={selectedAreaId}
                onValueChange={(value) => {
                  setValue('areaId', value);
                  clearErrors('areaId');
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn khu vực" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.areaId && <p className="text-xs text-red-500">{errors.areaId.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="branchId">Chi nhánh</Label>
              <Select
                value={selectedBranchId}
                onValueChange={(value) => {
                  setValue('branchId', value);
                  clearErrors('branchId');
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn chi nhánh" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.branchId && <p className="text-xs text-red-500">{errors.branchId.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="capacity">Sức chứa</Label>
              <Input
                id="capacity"
                type="number"
                {...register('capacity', { valueAsNumber: true })}
              />
              {errors.capacity && <p className="text-xs text-red-500">{errors.capacity.message}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={!isDirty || isPending}>
              {isPending ? 'Đang tạo...' : 'Thêm bàn'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};