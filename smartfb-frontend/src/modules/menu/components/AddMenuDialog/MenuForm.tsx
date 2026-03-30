import { type FC } from 'react';

import type { UseFormReturn } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';
import type { CreateMenuFormValues } from '@modules/menu/schemas/menu.schema';
import { MENU_CATEGORIES } from '@modules/menu/constants/menu.constants';

interface MenuFormProps {
  form: UseFormReturn<CreateMenuFormValues>;
  onSubmit: (values: CreateMenuFormValues) => void;
  isPending?: boolean;
  className?: string;
}

export const MenuForm: FC<MenuFormProps> = ({
  form,
  onSubmit,
  isPending = false,
  className,
}) => {
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MENU_CATEGORIES.map((cat) => (
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

        {/* Giá bán và Giá vốn */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Giá bán *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0đ"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Giá vốn</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0đ"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Mô tả */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Mô tả ngắn về món ăn"
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Thành phần */}
        <FormField
          control={form.control}
          name="ingredients"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thành phần</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Các thành phần chính (phân cách bằng dấu phẩy)"
                  className="resize-none"
                  rows={3}
                  value={field.value?.join(', ') || ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        {/* Tags */}
        <div className="space-y-2">
          <FormLabel>Tags</FormLabel>
          <div className="flex flex-wrap gap-2">
            {['moi', 'hot', 'bestseller', 'recommend'].map((tag) => (
              <FormField
                key={tag}
                control={form.control}
                name="tags"
                render={({ field }) => {
                  const isSelected = field.value?.includes(tag as 'moi' | 'hot' | 'bestseller' | 'recommend');
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const newTags = isSelected
                          ? field.value?.filter((t) => t !== tag)
                          : [...(field.value || []), tag as 'moi' | 'hot' | 'bestseller' | 'recommend'];
                        field.onChange(newTags);
                      }}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-amber-600'
                      )}
                    >
                      {tag === 'moi' && 'Mới'}
                      {tag === 'hot' && 'Hot'}
                      {tag === 'bestseller' && 'Bán chạy'}
                      {tag === 'recommend' && 'Đề xuất'}
                    </button>
                  );
                }}
              />
            ))}
          </div>
          <FormMessage />
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isPending} className="w-full bg-amber-600 hover:bg-amber-700">
          {isPending ? 'Đang lưu...' : 'Lưu món ăn'}
        </Button>
      </form>
    </Form>
  );
};
