import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useCreateZone } from '@modules/table/hooks/useCreateZone';
import { useEditZone } from '@modules/table/hooks/useEditZone';
import type { TableArea } from '@modules/table/types/table.types';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { NumericInput } from '@shared/components/common/NumericInput';
import { DeleteZoneDialog } from './DeleteZoneDialog';

const zoneManagementSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Tên khu vực phải có ít nhất 2 ký tự')
    .max(100, 'Tên khu vực không quá 100 ký tự'),
  floorNumber: z
    .number()
    .int('Số tầng phải là số nguyên')
    .min(1, 'Số tầng tối thiểu là 1')
    .max(99, 'Số tầng tối đa là 99'),
});

type ZoneManagementFormData = z.infer<typeof zoneManagementSchema>;

interface ZoneManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zones: Array<TableArea & { tableCount: number }>;
  isLoading: boolean;
  isError: boolean;
  isFetching?: boolean;
  onRetry: () => void;
}

const buildCreateValues = (): ZoneManagementFormData => ({
  name: '',
  floorNumber: 1,
});

const buildEditValues = (zone: TableArea): ZoneManagementFormData => ({
  name: zone.name,
  floorNumber: zone.floorNumber,
});

/**
 * Modal quản lý khu vực theo pattern form bên trái, danh sách bên phải.
 */
export const ZoneManagementDialog = ({
  open,
  onOpenChange,
  zones,
  isLoading,
  isError,
  isFetching = false,
  onRetry,
}: ZoneManagementDialogProps) => {
  const [editingZone, setEditingZone] = useState<TableArea | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<{
    id: string;
    name: string;
    tableCount: number;
  } | null>(null);
  const { mutate: createZone, isPending: isCreatingZone } = useCreateZone();
  const { mutate: editZone, isPending: isEditingZone } = useEditZone();
  const defaultValues = useMemo(() => buildCreateValues(), []);
  const editingValues = useMemo(
    () => (editingZone ? buildEditValues(editingZone) : null),
    [editingZone]
  );
  const isEditing = Boolean(editingZone);
  const isPending = isCreatingZone || isEditingZone;

  const form = useForm<ZoneManagementFormData>({
    resolver: zodResolver(zoneManagementSchema),
    defaultValues,
  });
  const selectedFloorNumber = useWatch({
    control: form.control,
    name: 'floorNumber',
  });

  useEffect(() => {
    if (editingValues) {
      form.reset(editingValues);
      return;
    }

    if (!form.formState.isDirty) {
      form.reset(defaultValues);
    }
  }, [defaultValues, editingValues, form]);

  const sortedZones = useMemo(() => {
    return [...zones].sort((left, right) => {
      if (left.floorNumber !== right.floorNumber) {
        return left.floorNumber - right.floorNumber;
      }

      return left.name.localeCompare(right.name, 'vi');
    });
  }, [zones]);

  const activeZoneCount = sortedZones.length;

  const resetToCreateMode = () => {
    setEditingZone(null);
    form.reset(buildCreateValues());
  };

  const handleSubmit = (values: ZoneManagementFormData) => {
    const payload = {
      name: values.name.trim(),
      floorNumber: values.floorNumber,
    };

    if (editingZone) {
      editZone(
        {
          id: editingZone.id,
          payload,
        },
        {
          onSuccess: () => {
            resetToCreateMode();
          },
        }
      );
      return;
    }

    createZone(payload, {
      onSuccess: () => {
        form.reset(buildCreateValues());
      },
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          onOpenChange(nextOpen);

          if (!nextOpen) {
            setEditingZone(null);
            setZoneToDelete(null);
            form.reset(defaultValues);
          }
        }}
      >
        <DialogContent className="flex h-[min(800px,90vh)] w-[calc(100vw-1rem)] max-w-7xl flex-col overflow-hidden border-0 p-0">
          <DialogHeader className="shrink-0 border-b border-amber-100 px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
            <DialogTitle className="text-lg text-gray-900 sm:text-xl">Quản lý khu vực</DialogTitle>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 gap-4 overflow-hidden px-4 pb-4 pt-2 sm:gap-6 sm:px-6 sm:pb-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div
              className={`min-h-0 overflow-y-auto rounded-3xl border p-4 sm:p-5 ${
                isEditing ? 'border-sky-200 bg-sky-50/70' : 'border-amber-100 bg-amber-50/50'
              }`}
            >
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Khu vực
                  </span>
                  <h3 className="text-base font-semibold text-gray-900">
                    {isEditing ? 'Sửa khu vực' : 'Tạo khu vực mới'}
                  </h3>
                </div>

                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="zone-management-name">Tên khu vực</Label>
                    <Input
                      id="zone-management-name"
                      {...form.register('name')}
                      placeholder="Ví dụ: Tầng 1, Sân vườn, VIP"
                    />
                    {form.formState.errors.name && (
                      <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="zone-management-floor">Số tầng</Label>
                    <NumericInput
                      id="zone-management-floor"
                      min={1}
                      max={99}
                      value={selectedFloorNumber}
                      onValueChange={(value) => {
                        form.setValue('floorNumber', value, { shouldDirty: true, shouldValidate: true });
                        form.clearErrors('floorNumber');
                      }}
                    />
                    {form.formState.errors.floorNumber && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.floorNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                      {isPending ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo khu vực'}
                    </Button>
                    {isEditing && (
                      <Button type="button" variant="outline" onClick={resetToCreateMode}>
                        Hủy sửa
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            <div className="min-h-0 overflow-y-auto rounded-3xl border border-amber-100 bg-white p-4 sm:p-5">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`zone-skeleton-${index}`}
                      className="h-28 animate-pulse rounded-2xl bg-amber-50"
                    />
                  ))}
                </div>
              ) : isError ? (
                <div className="flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-red-200 bg-red-50/60 px-6 text-center">
                  <p className="text-sm font-medium text-red-700">Không thể tải danh sách khu vực</p>
                  <Button variant="outline" className="mt-4" onClick={onRetry}>
                    Tải lại
                  </Button>
                </div>
              ) : sortedZones.length === 0 ? (
                <div className="flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-amber-200 bg-amber-50/60 px-6 text-center">
                  <p className="text-sm font-medium text-amber-900">Chưa có khu vực nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-gray-900">
                      Danh sách khu vực
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        {activeZoneCount} mục
                      </span>
                    </h3>
                    {isFetching ? (
                      <span className="text-sm text-gray-500">Đang đồng bộ...</span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {sortedZones.map((zone) => {
                      const canDelete = zone.tableCount === 0;

                      return (
                        <article
                          key={zone.id}
                          className="flex min-h-32 flex-col rounded-2xl border border-sky-200 bg-sky-50/85 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-semibold text-gray-900 sm:text-base">
                                {zone.name}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                                <span className="rounded-full bg-white px-2.5 py-1 font-medium text-gray-600">
                                  Tầng {zone.floorNumber}
                                </span>
                                <span className="rounded-full bg-sky-100 px-2.5 py-1 font-medium text-sky-700">
                                  {zone.tableCount} bàn
                                </span>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0 rounded-xl text-gray-500 hover:bg-white/80"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  onSelect={(event) => {
                                    event.preventDefault();
                                    setEditingZone(zone);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-700"
                                  onSelect={(event) => {
                                    event.preventDefault();
                                    setZoneToDelete({
                                      id: zone.id,
                                      name: zone.name,
                                      tableCount: zone.tableCount,
                                    });
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Xóa khu vực
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <p className="mt-auto pt-4 text-xs text-gray-500">
                            {canDelete
                              ? 'Khu vực đang trống, có thể xóa.'
                              : `Khu vực đang có ${zone.tableCount} bàn được gán.`}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteZoneDialog
        open={Boolean(zoneToDelete)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setZoneToDelete(null);
          }
        }}
        zoneId={zoneToDelete?.id ?? ''}
        zoneName={zoneToDelete?.name ?? ''}
        tableCount={zoneToDelete?.tableCount ?? 0}
      />
    </>
  );
};
