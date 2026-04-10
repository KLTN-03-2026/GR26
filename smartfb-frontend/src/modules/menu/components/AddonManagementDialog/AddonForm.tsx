import type { UseFormReturn } from 'react-hook-form';
import type { CreateAddonFormValues } from '@modules/menu/schemas/addon.schema';
import { Button } from '@shared/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { NumericInput } from '@shared/components/common/NumericInput';
import { cn } from '@shared/utils/cn';

interface AddonFormProps {
  form: UseFormReturn<CreateAddonFormValues>;
  onSubmit: (values: CreateAddonFormValues) => void;
  isPending?: boolean;
  submitLabel: string;
  className?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  isSecondaryActionDisabled?: boolean;
}

/**
 * Form dùng chung cho tạo mới và chỉnh sửa topping.
 */
export const AddonForm = ({
  form,
  onSubmit,
  isPending = false,
  submitLabel,
  className,
  secondaryActionLabel,
  onSecondaryAction,
  isSecondaryActionDisabled = false,
}: AddonFormProps) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('space-y-5', className)}>
        <div className="">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên topping *</FormLabel>
                <FormControl>
                  <Input placeholder="Ví dụ: Trân châu trắng, Kem cheese" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="extraPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Giá topping *</FormLabel>
                <FormControl>
                  <NumericInput
                    min={0}
                    step={1000}
                    value={field.value}
                    onValueChange={field.onChange}
                    hideZeroValue
                    placeholder="Ví dụ: 5000"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
