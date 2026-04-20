import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FlaskConical } from 'lucide-react';
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
import { useCreateIngredient } from '../hooks/useCreateIngredient';

// Schema Zod cho form tạo nguyên liệu
const createIngredientSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên nguyên liệu không được để trống')
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

type CreateIngredientFormValues = z.infer<typeof createIngredientSchema>;

// Gợi ý đơn vị tính phổ biến cho nguyên liệu F&B
const UNIT_SUGGESTIONS = ['kg', 'g', 'L', 'ml', 'cái', 'chai', 'gói', 'hộp', 'lon', 'túi'];

interface CreateIngredientDialogProps {
  /** Controlled open state — nếu truyền vào thì dialog hoạt động theo controlled mode */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Trigger button render bên ngoài — chỉ dùng khi không dùng controlled mode */
  trigger?: React.ReactNode;
}

/**
 * Dialog tạo nguyên liệu mới vào danh mục kho.
 * Gọi POST /menu/items với type=INGREDIENT.
 * Hỗ trợ cả controlled (open/onOpenChange) và uncontrolled (trigger) mode.
 */
export const CreateIngredientDialog = ({ open: controlledOpen, onOpenChange, trigger }: CreateIngredientDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { mutate: createIngredient, isPending } = useCreateIngredient();

  // Sync internal state khi controlled open thay đổi từ ngoài
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  useEffect(() => {
    if (!isControlled) return;
    setInternalOpen(controlledOpen);
  }, [isControlled, controlledOpen]);

  const form = useForm<CreateIngredientFormValues>({
    resolver: zodResolver(createIngredientSchema),
    defaultValues: { name: '', unit: '', basePrice: '' },
  });

  const handleSubmit = (values: CreateIngredientFormValues) => {
    createIngredient(
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

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Delay reset để animation đóng dialog hoàn tất
      setTimeout(() => form.reset(), 300);
    }
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Chỉ render trigger khi ở uncontrolled mode */}
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button type="button" variant="outline">
              <FlaskConical className="h-4 w-4" />
              Thêm nguyên liệu
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Thêm nguyên liệu mới
          </DialogTitle>
          <DialogDescription>
            Tạo nguyên liệu vào danh mục kho của tenant. Sau khi tạo, bạn có thể nhập kho
            ngay trong trang Quản lý Kho.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            {/* Tên nguyên liệu */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên nguyên liệu *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: Sữa tươi, Cà phê rang xay" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Đơn vị tính */}
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đơn vị tính *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: kg, L, cái" {...field} />
                  </FormControl>
                  {/* Gợi ý nhanh đơn vị phổ biến */}
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

            {/* Giá vốn (tùy chọn) */}
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
                      onChange={(e) => {
                        // Chỉ cho nhập số nguyên (giá tiền không cần thập phân)
                        const sanitized = e.target.value.replace(/[^0-9]/g, '');
                        field.onChange(sanitized);
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-text-secondary">
                    Giá vốn dùng để tính chi phí nguyên liệu trong báo cáo. Bỏ trống = 0đ.
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
                {isPending ? 'Đang tạo...' : 'Tạo nguyên liệu'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
