import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { Switch } from '@shared/components/ui/switch';
import { NumericInput } from '@shared/components/common/NumericInput';
import { formatVND } from '@shared/utils/formatCurrency';
import type { MenuItem, UpdateBranchMenuItemPayload } from '@modules/menu/types/menu.types';

interface BranchMenuConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu: MenuItem | null;
  branchName: string;
  onSubmit: (payload: UpdateBranchMenuItemPayload) => void;
  isPending?: boolean;
}

interface BranchMenuConfigFormValues {
  useBranchPrice: boolean;
  branchPrice: number;
  isAvailable: boolean;
}

/**
 * Dialog cấu hình giá bán và trạng thái phục vụ của món theo chi nhánh.
 */
export const BranchMenuConfigDialog = ({
  open,
  onOpenChange,
  menu,
  branchName,
  onSubmit,
  isPending = false,
}: BranchMenuConfigDialogProps) => {
  const defaultValues = useMemo<BranchMenuConfigFormValues>(() => {
    const fallbackPrice = menu?.branchPrice ?? menu?.basePrice ?? menu?.price ?? 0;

    return {
      useBranchPrice: menu?.branchPrice !== null && menu?.branchPrice !== undefined,
      branchPrice: fallbackPrice,
      isAvailable: menu?.isAvailable ?? true,
    };
  }, [menu]);

  const form = useForm<BranchMenuConfigFormValues>({
    defaultValues,
  });

  const useBranchPrice = useWatch({
    control: form.control,
    name: 'useBranchPrice',
  });
  const basePrice = menu?.basePrice ?? menu?.price ?? 0;
  const effectivePrice = menu?.effectivePrice ?? menu?.price ?? 0;

  /**
   * Reset form khi đổi món hoặc mở lại dialog để tránh sót trạng thái cũ.
   */
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  const handleSubmit = (values: BranchMenuConfigFormValues) => {
    if (!menu) {
      return;
    }

    if (values.useBranchPrice && values.branchPrice < 0) {
      form.setError('branchPrice', {
        type: 'manual',
        message: 'Giá bán tại chi nhánh không được âm',
      });
      return;
    }

    onSubmit({
      branchPrice: values.useBranchPrice ? values.branchPrice : null,
      isAvailable: values.isAvailable,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cấu hình món theo chi nhánh</DialogTitle>
          <DialogDescription>
            {menu ? `Thiết lập giá bán và trạng thái phục vụ của "${menu.name}" tại ${branchName}.` : ''}
          </DialogDescription>
        </DialogHeader>

        {menu ? (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-amber-700">Giá gốc</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{formatVND(basePrice)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-amber-700">Giá đang áp dụng</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{formatVND(effectivePrice)}</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="useBranchPrice"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                      <div className="space-y-1">
                        <FormLabel className="text-sm font-medium">Dùng giá riêng cho chi nhánh</FormLabel>
                        <p className="text-xs text-gray-500">
                          Tắt mục này nếu muốn chi nhánh dùng lại giá gốc của hệ thống.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="branchPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá bán tại chi nhánh</FormLabel>
                      <FormControl>
                        <NumericInput
                          min={0}
                          step={1000}
                          value={field.value}
                          onValueChange={field.onChange}
                          hideZeroValue
                          disabled={!useBranchPrice}
                          placeholder="Ví dụ: 52000"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        {useBranchPrice
                          ? 'Giá này chỉ áp dụng cho chi nhánh đang chọn.'
                          : 'Đang dùng giá gốc của menu toàn hệ thống.'}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                      <div className="space-y-1">
                        <FormLabel className="text-sm font-medium">Đang phục vụ tại chi nhánh</FormLabel>
                        <p className="text-xs text-gray-500">
                          Tắt nếu món tạm thời không bán ở cơ sở này nhưng vẫn giữ trong menu toàn hệ thống.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                    Hủy
                  </Button>
                  <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={isPending}>
                    {isPending ? 'Đang lưu...' : 'Lưu cấu hình chi nhánh'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
