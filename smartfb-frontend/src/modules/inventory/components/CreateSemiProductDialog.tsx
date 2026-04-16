import { useState } from 'react';
import { Boxes } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import { useCreateSemiProduct } from '../hooks/useCreateSemiProduct';

const createSemiProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên bán thành phẩm không được để trống')
    .max(255, 'Tên không được vượt quá 255 ký tự'),
  unit: z
    .string()
    .min(1, 'Đơn vị tính không được để trống')
    .max(30, 'Đơn vị tính không được vượt quá 30 ký tự'),
  basePrice: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Giá không được âm',
    }),
});

type CreateSemiProductFormValues = z.infer<typeof createSemiProductSchema>;

// Gợi ý đơn vị thường gặp cho bán thành phẩm trong quán.
const UNIT_SUGGESTIONS = ['L', 'ml', 'kg', 'g', 'mẻ', 'khay', 'chai', 'hộp', 'ca', 'bình',"dây",];

interface CreateSemiProductDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

/**
 * Dialog tạo mới bán thành phẩm trong catalog kho.
 * Gọi POST /menu/items với type=SUB_ASSEMBLY.
 */
export const CreateSemiProductDialog = ({
  open: controlledOpen,
  onOpenChange,
  trigger,
}: CreateSemiProductDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { mutate: createSemiProduct, isPending } = useCreateSemiProduct();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const form = useForm<CreateSemiProductFormValues>({
    resolver: zodResolver(createSemiProductSchema),
    defaultValues: { name: '', unit: '', basePrice: '' },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Delay reset để animation đóng dialog hoàn tất trước khi clear form.
      setTimeout(() => form.reset(), 300);
    }

    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  };

  const handleSubmit = (values: CreateSemiProductFormValues) => {
    createSemiProduct(
      {
        name: values.name,
        unit: values.unit,
        basePrice: values.basePrice ? Number(values.basePrice) : 0,
      },
      {
        onSuccess: () => {
          handleOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button type="button" variant="outline">
              <Boxes className="h-4 w-4" />
              Thêm bán thành phẩm
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            Thêm bán thành phẩm mới
          </DialogTitle>
          <DialogDescription>
            Tạo item `SUB_ASSEMBLY` trong catalog kho. Sau khi tạo, bạn có thể nhập tồn ban đầu
            hoặc theo dõi số lượng hiện có trong tab Bán thành phẩm.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên bán thành phẩm *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: Kem cheese, Cốt cà phê phin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đơn vị tính *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: ml, L, mẻ, chai" {...field} />
                  </FormControl>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {UNIT_SUGGESTIONS.map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => form.setValue('unit', unit, { shouldValidate: true })}
                        className="rounded-full border border-border bg-cream px-2.5 py-0.5 text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary"
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="basePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giá vốn tham khảo (tùy chọn)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Mặc định: 0đ"
                      {...field}
                      onChange={(event) => {
                        const sanitized = event.target.value.replace(/[^0-9]/g, '');
                        field.onChange(sanitized);
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-text-secondary">
                    Dùng cho bán thành phẩm đã có giá vốn tham chiếu ngay từ khâu sơ chế hoặc pha chế.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Đang tạo...' : 'Tạo bán thành phẩm'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
