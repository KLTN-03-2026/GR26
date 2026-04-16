import { useEffect, useMemo } from 'react';
import { Boxes, Hammer } from 'lucide-react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';
import { NumericInput } from '@shared/components/common/NumericInput';
import {
  SearchableCombobox,
  type SearchableComboboxOption,
} from '@shared/components/common/SearchableCombobox';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import type { InventoryItemOption, RecordProductionBatchPayload } from '@modules/inventory/types/inventory.types';

const recordProductionBatchSchema = z.object({
  subAssemblyItemId: z.string().uuid('ID bán thành phẩm phải đúng định dạng UUID'),
  expectedOutputQuantity: z.number().min(0.0001, 'Sản lượng chuẩn phải lớn hơn 0'),
  actualOutputQuantity: z.number().min(0, 'Sản lượng thực tế không được âm'),
  unit: z
    .string()
    .trim()
    .min(1, 'Đơn vị tính không được để trống')
    .max(30, 'Đơn vị tính tối đa 30 ký tự'),
  note: z
    .string()
    .max(1000, 'Ghi chú tối đa 1000 ký tự')
    .optional(),
});

type RecordProductionBatchFormValues = z.infer<typeof recordProductionBatchSchema>;

interface RecordProductionBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemOptions: InventoryItemOption[];
  selectedBranchName: string | null;
  defaultItemId?: string;
  isPending: boolean;
  onSubmit: (payload: RecordProductionBatchPayload) => void;
}

const buildDefaultValues = (defaultItemId?: string): RecordProductionBatchFormValues => ({
  subAssemblyItemId: defaultItemId ?? '',
  expectedOutputQuantity: 1,
  actualOutputQuantity: 1,
  unit: '',
  note: '',
});

/**
 * Dialog ghi nhận mẻ sản xuất cho bán thành phẩm.
 * Tách riêng khỏi flow nhập tồn vì backend xử lý trừ đầu vào và cộng đầu ra khác nhau.
 */
export const RecordProductionBatchDialog = ({
  open,
  onOpenChange,
  itemOptions,
  selectedBranchName,
  defaultItemId,
  isPending,
  onSubmit,
}: RecordProductionBatchDialogProps) => {
  const form = useForm<RecordProductionBatchFormValues>({
    resolver: zodResolver(recordProductionBatchSchema),
    defaultValues: buildDefaultValues(defaultItemId),
  });

  const watchedItemId = useWatch({
    control: form.control,
    name: 'subAssemblyItemId',
  });

  const selectedItem = useMemo(() => {
    return itemOptions.find((item) => item.itemId === watchedItemId) ?? null;
  }, [itemOptions, watchedItemId]);

  const itemComboboxOptions = useMemo<SearchableComboboxOption[]>(() => {
    return itemOptions.map((item) => ({
      value: item.itemId,
      label: item.itemName,
      description: item.unit ? `Đơn vị chuẩn: ${item.unit}` : 'Chưa có đơn vị chuẩn',
      keywords: [item.itemId, item.unit ?? ''],
    }));
  }, [itemOptions]);

  useEffect(() => {
    if (!open) {
      form.reset(buildDefaultValues(defaultItemId));
      return;
    }

    if (defaultItemId) {
      form.setValue('subAssemblyItemId', defaultItemId, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [defaultItemId, form, open]);

  useEffect(() => {
    if (!selectedItem?.unit?.trim()) {
      return;
    }

    form.setValue('unit', selectedItem.unit.trim(), {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [form, selectedItem?.itemId, selectedItem?.unit]);

  const handleSubmit = (values: RecordProductionBatchFormValues) => {
    onSubmit({
      subAssemblyItemId: values.subAssemblyItemId,
      expectedOutputQuantity: values.expectedOutputQuantity,
      actualOutputQuantity: values.actualOutputQuantity,
      unit: values.unit,
      note: values.note?.trim() ? values.note.trim() : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hammer className="h-5 w-5 text-primary" />
            Ghi nhận sản xuất bán thành phẩm
          </DialogTitle>
          <DialogDescription>
            Ghi nhận một mẻ sản xuất để backend tự trừ thành phần đầu vào theo công thức và cộng tồn đầu ra.
            {selectedBranchName ? ` Chi nhánh hiện tại: ${selectedBranchName}.` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Lưu ý nghiệp vụ</p>
          <p className="mt-1">
            Backend dùng <strong>sản lượng chuẩn</strong> để tính mức trừ đầu vào theo recipe, và dùng
            <strong> sản lượng thực tế</strong> để cộng tồn đầu ra. Bán thành phẩm phải có công thức trước khi ghi nhận sản xuất.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subAssemblyItemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bán thành phẩm đầu ra *</FormLabel>
                  <FormControl>
                    <SearchableCombobox
                      value={field.value}
                      options={itemComboboxOptions}
                      placeholder="Chọn bán thành phẩm cần ghi nhận sản xuất"
                      searchPlaceholder="Tìm bán thành phẩm theo tên, mã hoặc đơn vị"
                      emptyMessage="Không tìm thấy bán thành phẩm phù hợp."
                      disabled={isPending || itemOptions.length === 0}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  {selectedItem ? (
                    <p className="text-xs text-text-secondary">
                      Đang chọn: {selectedItem.itemName}
                      {selectedItem.unit ? ` • đơn vị chuẩn ${selectedItem.unit}` : ''}
                    </p>
                  ) : null}
                  {itemOptions.length === 0 ? (
                    <p className="text-xs text-text-secondary">
                      Chưa có bán thành phẩm nào trong catalog `SUB_ASSEMBLY`. Hãy tạo item trước rồi quay lại ghi nhận sản xuất.
                    </p>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="expectedOutputQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sản lượng chuẩn *</FormLabel>
                    <FormControl>
                      <NumericInput
                        allowDecimal
                        min={0.0001}
                        step="0.0001"
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                    <p className="text-xs text-text-secondary">
                      Dùng để backend suy ra mức trừ đầu vào theo công thức của bán thành phẩm.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actualOutputQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sản lượng thực tế *</FormLabel>
                    <FormControl>
                      <NumericInput
                        allowDecimal
                        min={0}
                        step="0.0001"
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                    <p className="text-xs text-text-secondary">
                      Dùng để cộng tồn đầu ra thực tế sau khi sản xuất xong.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đơn vị đầu ra *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ví dụ: ml, L, mẻ, chai"
                      disabled={isPending}
                    />
                  </FormControl>
                  <p className="text-xs text-text-secondary">
                    Mặc định lấy từ bán thành phẩm đã chọn. Chỉ sửa khi dữ liệu catalog đang thiếu hoặc sai đơn vị.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Ví dụ: Mẻ sáng, pha cốt ca đầu ngày, hao hụt nhẹ do lọc..."
                      rows={4}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-card border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="flex items-start gap-2">
                <Boxes className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <p>
                  Sau khi xác nhận, hệ thống sẽ ghi giao dịch `PRODUCTION_OUT` cho thành phần đầu vào và `PRODUCTION_IN`
                  cho bán thành phẩm đầu ra. Nếu recipe chưa tồn tại hoặc đầu vào không đủ tồn, backend sẽ từ chối.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Hủy
              </Button>
              <Button type="submit" disabled={isPending || itemOptions.length === 0}>
                {isPending ? 'Đang ghi nhận...' : 'Xác nhận sản xuất'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
