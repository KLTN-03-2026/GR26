import { useEffect, useMemo } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Factory, TrendingDown, TrendingUp } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
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
import { cn } from '@shared/utils/cn';
import type { InventoryItemOption, RecordProductionBatchPayload } from '@modules/inventory/types/inventory.types';

const recordProductionBatchSchema = z.object({
  subAssemblyItemId: z.string().uuid('ID bán thành phẩm phải đúng định dạng UUID'),
  expectedOutputQuantity: z.number().min(0.0001, 'Sản lượng kế hoạch phải lớn hơn 0'),
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

const formatNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(value);

/**
 * Tính tỉ lệ hiệu suất: thực tế / kế hoạch * 100.
 * Trả về null nếu kế hoạch = 0.
 */
const calcYieldRate = (actual: number, expected: number): number | null => {
  if (expected <= 0) return null;
  return Math.round((actual / expected) * 100);
};

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

  const watchedItemId = useWatch({ control: form.control, name: 'subAssemblyItemId' });
  const watchedExpected = useWatch({ control: form.control, name: 'expectedOutputQuantity' });
  const watchedActual = useWatch({ control: form.control, name: 'actualOutputQuantity' });
  const watchedUnit = useWatch({ control: form.control, name: 'unit' });

  const selectedItem = useMemo(
    () => itemOptions.find((item) => item.itemId === watchedItemId) ?? null,
    [itemOptions, watchedItemId],
  );

  const itemComboboxOptions = useMemo<SearchableComboboxOption[]>(
    () =>
      itemOptions.map((item) => ({
        value: item.itemId,
        label: item.itemName,
        description: item.unit ? `Đơn vị: ${item.unit}` : 'Chưa có đơn vị chuẩn',
        keywords: [item.itemId, item.unit ?? ''],
      })),
    [itemOptions],
  );

  const yieldRate = calcYieldRate(watchedActual, watchedExpected);

  // Màu badge hiệu suất theo ngưỡng
  const yieldBadgeStyle =
    yieldRate === null
      ? null
      : yieldRate >= 95
        ? 'bg-green-100 text-green-700 border-green-200'
        : yieldRate >= 80
          ? 'bg-amber-100 text-amber-700 border-amber-200'
          : 'bg-red-100 text-red-700 border-red-200';

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

  // Tự động điền đơn vị khi chọn item
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Factory className="h-5 w-5 text-primary" />
            Ghi nhận sản xuất
          </DialogTitle>
          {selectedBranchName && (
            <p className="text-xs text-text-secondary">Chi nhánh: {selectedBranchName}</p>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

            {/* ── Bước 1: Chọn bán thành phẩm ── */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                Bán thành phẩm
              </p>
              <FormField
                control={form.control}
                name="subAssemblyItemId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SearchableCombobox
                        value={field.value}
                        options={itemComboboxOptions}
                        placeholder="Chọn bán thành phẩm cần sản xuất"
                        searchPlaceholder="Tìm theo tên hoặc đơn vị..."
                        emptyMessage="Không tìm thấy. Hãy tạo item SUB_ASSEMBLY trước."
                        disabled={isPending || itemOptions.length === 0}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Chip thông tin item đã chọn */}
              {selectedItem && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  <span className="flex-1 truncate text-sm font-medium text-text-primary">
                    {selectedItem.itemName}
                  </span>
                  {selectedItem.unit && (
                    <span className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-text-secondary">
                      {selectedItem.unit}
                    </span>
                  )}
                </div>
              )}

              {itemOptions.length === 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Chưa có bán thành phẩm nào. Hãy tạo item trước rồi quay lại.
                </div>
              )}
            </div>

            {/* ── Bước 2: Sản lượng ── */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                Sản lượng
              </p>

              <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
                {/* Kế hoạch */}
                <FormField
                  control={form.control}
                  name="expectedOutputQuantity"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Công thức
                      </FormLabel>
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
                      <p className="text-[11px] text-text-secondary">
                        Dùng để tính lượng trừ đầu vào
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mũi tên phân cách */}
                <div className="mt-7 flex justify-center">
                  <ArrowRight className="h-4 w-4 text-text-secondary" />
                </div>

                {/* Thực tế */}
                <FormField
                  control={form.control}
                  name="actualOutputQuantity"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <TrendingDown className="h-3.5 w-3.5" />
                        Thực tế
                      </FormLabel>
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
                      <p className="text-[11px] text-text-secondary">
                        Lượng thực tế cộng vào kho
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Hiệu suất và tổng kết */}
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Kết quả dự kiến</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">
                      +{formatNumber(watchedActual)} {watchedUnit || 'đơn vị'}
                    </span>
                    {yieldRate !== null && yieldBadgeStyle && (
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-xs font-medium',
                          yieldBadgeStyle,
                        )}
                      >
                        {yieldRate}%
                      </span>
                    )}
                  </div>
                </div>
                {yieldRate !== null && yieldRate < 80 && (
                  <p className="mt-1 text-xs text-amber-700">
                    Hiệu suất thấp hơn 80%. Kiểm tra lại số liệu trước khi xác nhận.
                  </p>
                )}
              </div>
            </div>

            {/* ── Đơn vị (chỉ hiện khi item chưa có unit) ── */}
            {selectedItem && !selectedItem.unit && (
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Đơn vị đầu ra <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ví dụ: ml, L, mẻ, chai, hộp"
                        disabled={isPending}
                      />
                    </FormControl>
                    <p className="text-xs text-text-secondary">
                      Item chưa có đơn vị chuẩn. Nhập đơn vị để ghi vào lịch sử giao dịch.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* ── Ghi chú ── */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">Ghi chú (tùy chọn)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Ví dụ: Mẻ sáng, pha cốt ca đầu ngày, hao hụt nhẹ do lọc..."
                      rows={3}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isPending || itemOptions.length === 0 || !watchedItemId}>
                {isPending ? 'Đang ghi nhận...' : 'Xác nhận sản xuất'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
