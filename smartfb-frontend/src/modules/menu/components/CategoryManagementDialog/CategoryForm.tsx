import type { UseFormReturn } from 'react-hook-form';
import type { CreateCategoryFormValues } from '@modules/menu/schemas/category.schema';
import { Button } from '@shared/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { NumericInput } from '@shared/components/common/NumericInput';
import { Textarea } from '@shared/components/ui/textarea';
import { cn } from '@shared/utils/cn';

interface CategoryFormProps {
  form: UseFormReturn<CreateCategoryFormValues>;
  onSubmit: (values: CreateCategoryFormValues) => void;
  isPending?: boolean;
  submitLabel: string;
  className?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  isSecondaryActionDisabled?: boolean;
}

/**
 * Form dùng chung cho tạo mới và chỉnh sửa danh mục.
 */
export const CategoryForm = ({
  form,
  onSubmit,
  isPending = false,
  submitLabel,
  className,
  secondaryActionLabel,
  onSecondaryAction,
  isSecondaryActionDisabled = false,
}: CategoryFormProps) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên danh mục *</FormLabel>
              <FormControl>
                <Input placeholder="Ví dụ: Cà phê pha máy" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Mô tả ngắn để dễ phân biệt nhóm món"
                  className="min-h-24"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="displayOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thứ tự hiển thị</FormLabel>
              <FormControl>
                <NumericInput
                  min={0}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Số nhỏ hơn sẽ được ưu tiên hiển thị trước trong danh sách.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          {onSecondaryAction ? (
            <Button
              type="button"
              variant="outline"
              onClick={onSecondaryAction}
              disabled={isPending || isSecondaryActionDisabled}
              className="w-full sm:flex-1"
            >
              {secondaryActionLabel ?? 'Hủy'}
            </Button>
          ) : null}

          <Button
            type="submit"
            disabled={isPending}
            className={cn(
              'w-full bg-amber-600 hover:bg-amber-700',
              onSecondaryAction ? 'sm:flex-1' : ''
            )}
          >
            {isPending ? 'Đang lưu...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
};
