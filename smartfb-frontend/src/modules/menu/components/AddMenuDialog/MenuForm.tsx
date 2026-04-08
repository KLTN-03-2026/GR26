import { type FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { NumericInput } from '@shared/components/common/NumericInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Button } from '@shared/components/ui/button';
import { Switch } from '@shared/components/ui/switch';
import { cn } from '@shared/utils/cn';
import type { CreateMenuFormValues } from '@modules/menu/schemas/menu.schema';
import type { MenuCategoryInfo } from '@modules/menu/types/menu.types';
import { NO_MENU_CATEGORY_LABEL, NO_MENU_CATEGORY_VALUE } from '@modules/menu/constants/menu.constants';

interface MenuFormProps {
  form: UseFormReturn<CreateMenuFormValues>;
  categories: MenuCategoryInfo[];
  onSubmit: (values: CreateMenuFormValues) => void;
  isPending?: boolean;
  submitLabel: string;
  className?: string;
}

export const MenuForm: FC<MenuFormProps> = ({
  form,
  categories,
  onSubmit,
  isPending = false,
  submitLabel,
  className,
}) => {
  const selectableCategories = categories.filter((category) => category.id !== NO_MENU_CATEGORY_VALUE);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
        {/* Tên món ăn */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên món ăn *</FormLabel>
              <FormControl>
                <Input placeholder="Nhập tên món ăn" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Danh mục */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Danh mục *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_MENU_CATEGORY_VALUE}>{NO_MENU_CATEGORY_LABEL}</SelectItem>
                  {selectableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Giá bán và đơn vị tính */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
              <FormLabel>Giá bán *</FormLabel>
              <FormControl>
                <NumericInput
                  min={0}
                  step={1000}
                  value={field.value}
                  onValueChange={field.onChange}
                  hideZeroValue
                  placeholder="Ví dụ: 45000"
                />
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
                <FormLabel>Đơn vị tính</FormLabel>
                <FormControl>
                  <Input placeholder="Ví dụ: ly, phần, dĩa" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* URL ảnh */}
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL ảnh</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Đồng bộ lên app giao hàng */}
        <FormField
          control={form.control}
          name="isSyncDelivery"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-3 rounded-lg border border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <FormLabel className="text-sm font-medium">Đồng bộ lên app giao hàng</FormLabel>
                <p className="text-xs text-gray-500">
                  Khi bật, món ăn sẽ được đánh dấu để đồng bộ sang kênh bán hàng bên ngoài.
                </p>
              </div>
              <FormControl>
                <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isPending} className="w-full bg-amber-600 hover:bg-amber-700">
          {isPending ? 'Đang lưu...' : submitLabel}
        </Button>
      </form>
    </Form>
  );
};
