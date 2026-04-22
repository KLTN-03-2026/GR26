import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BellRing } from 'lucide-react';
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
import { Button } from '@shared/components/ui/button';
import { NumericInput } from '@shared/components/common/NumericInput';

const updateThresholdSchema = z.object({
  minLevel: z.number().min(0, 'Mức tối thiểu không được âm'),
});

type UpdateThresholdFormValues = z.infer<typeof updateThresholdSchema>;

interface UpdateThresholdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string | null;
  unit: string | null;
  currentMinLevel: number;
  isPending: boolean;
  onSubmit: (minLevel: number) => void;
}

/**
 * Dialog cập nhật mức tồn tối thiểu (ngưỡng cảnh báo low-stock).
 * Hiển thị tên nguyên liệu, đơn vị và cho phép nhập ngưỡng mới.
 */
export const UpdateThresholdDialog = ({
  open,
  onOpenChange,
  itemName,
  unit,
  currentMinLevel,
  isPending,
  onSubmit,
}: UpdateThresholdDialogProps) => {
  const form = useForm<UpdateThresholdFormValues>({
    resolver: zodResolver(updateThresholdSchema),
    defaultValues: { minLevel: currentMinLevel },
  });

  // Reset về giá trị hiện tại mỗi khi mở dialog
  useEffect(() => {
    if (open) {
      form.reset({ minLevel: currentMinLevel });
    }
  }, [open, currentMinLevel, form]);

  const handleSubmit = (values: UpdateThresholdFormValues) => {
    onSubmit(values.minLevel);
  };

  const displayName = itemName?.trim() || 'nguyên liệu này';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BellRing className="h-4 w-4 text-amber-500" />
            Cập nhật mức tối thiểu
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-text-secondary">
          Hệ thống sẽ đánh dấu <span className="font-medium text-text-primary">{displayName}</span> là
          &ldquo;Cần nhập thêm&rdquo; khi tồn kho xuống dưới ngưỡng này.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="minLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Mức tối thiểu {unit ? `(${unit})` : ''} <span className="text-red-500">*</span>
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
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Đang lưu...' : 'Lưu ngưỡng'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
