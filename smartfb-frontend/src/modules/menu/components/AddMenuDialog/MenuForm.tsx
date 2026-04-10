import { type DragEvent, type FC, useEffect, useRef, useState } from 'react';
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
import { menuImageUploadConstraints } from '@modules/menu/utils/menuImageUpload';
import { Images, Upload } from 'lucide-react';

interface MenuFormProps {
  form: UseFormReturn<CreateMenuFormValues>;
  categories: MenuCategoryInfo[];
  onSubmit: (values: CreateMenuFormValues) => void;
  isPending?: boolean;
  submitLabel: string;
  className?: string;
  existingImageUrl?: string;
  fileInputKey?: number;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const MenuForm: FC<MenuFormProps> = ({
  form,
  categories,
  onSubmit,
  isPending = false,
  submitLabel,
  className,
  existingImageUrl,
  fileInputKey = 0,
}) => {
  const selectableCategories = categories.filter((category) => category.id !== NO_MENU_CATEGORY_VALUE);
  const selectedImageFile = form.watch('imageFile');
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(null);
  const [currentFileInputKey, setCurrentFileInputKey] = useState(fileInputKey);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCurrentFileInputKey(fileInputKey);
  }, [fileInputKey]);

  useEffect(() => {
    if (!selectedImageFile) {
      setSelectedImagePreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedImageFile);
    setSelectedImagePreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [selectedImageFile]);

  const previewImageUrl = selectedImagePreviewUrl ?? existingImageUrl ?? '';
  const openFilePicker = () => {
    hiddenFileInputRef.current?.click();
  };

  const formatList = menuImageUploadConstraints.accept
    .split(',')
    .map((type) => type.replace('image/', '.'))
    .join(', ');

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

        {/* Ảnh món ăn */}
        <FormField
          control={form.control}
          name="imageFile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ảnh món ăn</FormLabel>
              <FormControl>
                <>
                  <input
                    key={currentFileInputKey}
                    accept={menuImageUploadConstraints.accept}
                    className="hidden"
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] ?? undefined;
                      field.onChange(nextFile);
                      setIsDraggingImage(false);
                    }}
                    ref={(element) => {
                      hiddenFileInputRef.current = element;
                      field.ref(element);
                    }}
                    type="file"
                  />

                  <div
                    className={cn(
                      'group relative overflow-hidden rounded-3xl border-2 border-dashed transition-all',
                      'cursor-pointer bg-gradient-to-br from-slate-50 to-white',
                      isDraggingImage
                        ? 'border-amber-400 bg-amber-50/80 shadow-[0_0_0_4px_rgba(251,191,36,0.15)]'
                        : 'border-slate-300 hover:border-amber-300 hover:bg-amber-50/40',
                      previewImageUrl ? 'min-h-[18rem]' : 'min-h-[15rem]'
                    )}
                    onClick={openFilePicker}
                    onDragEnter={(event: DragEvent<HTMLDivElement>) => {
                      event.preventDefault();
                      setIsDraggingImage(true);
                    }}
                    onDragLeave={(event: DragEvent<HTMLDivElement>) => {
                      event.preventDefault();
                      const nextTarget = event.relatedTarget;
                      if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
                        return;
                      }
                      setIsDraggingImage(false);
                    }}
                    onDragOver={(event: DragEvent<HTMLDivElement>) => {
                      event.preventDefault();
                      if (!isDraggingImage) {
                        setIsDraggingImage(true);
                      }
                    }}
                    onDrop={(event: DragEvent<HTMLDivElement>) => {
                      event.preventDefault();
                      setIsDraggingImage(false);
                      const nextFile = event.dataTransfer.files?.[0];
                      if (!nextFile) {
                        return;
                      }

                      field.onChange(nextFile);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openFilePicker();
                      }
                    }}
                  >
                    {previewImageUrl ? (
                      <>
                        <img
                          alt="Xem trước ảnh món ăn"
                          className="h-full min-h-[18rem] w-full object-cover"
                          src={previewImageUrl}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/18 backdrop-blur">
                              <Upload className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold">Nhấn hoặc kéo thả để thay ảnh món ăn</p>
                              <p className="text-xs text-white/80">
                                {selectedImageFile
                                  ? `${selectedImageFile.name} • ${formatFileSize(selectedImageFile.size)}`
                                  : 'Giữ ảnh hiện tại hoặc chọn ảnh mới để thay thế'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex min-h-[15rem] flex-col items-center justify-center px-6 py-8 text-center">
                        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-slate-100 text-slate-500 transition-colors group-hover:bg-amber-100 group-hover:text-amber-700">
                          <Images className="h-10 w-10" />
                        </div>
                        <p className="text-xl font-semibold text-slate-800">
                          Kéo thả ảnh vào đây hoặc nhấn để chọn ảnh
                        </p>
                        <p className="mt-3 text-sm text-slate-500">
                          Định dạng hỗ trợ: {formatList}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Ảnh sẽ được tối ưu trước khi gửi, backend nhận tối đa 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </>
              </FormControl>
              <div className="space-y-2 text-xs text-gray-500">
                <p>Hỗ trợ JPG, PNG, WebP. Ảnh gốc tối đa 15MB và sẽ được tối ưu trên trình duyệt trước khi upload.</p>
                {selectedImageFile ? (
                  <p>
                    Ảnh đã chọn: <span className="font-medium text-gray-700">{selectedImageFile.name}</span>
                    {' • '}
                    {formatFileSize(selectedImageFile.size)}
                  </p>
                ) : existingImageUrl ? (
                  <p>Đang dùng ảnh hiện tại của món. Chọn ảnh mới nếu bạn muốn thay thế.</p>
                ) : null}
              </div>
              {selectedImageFile ? (
                <Button
                  className="w-full"
                  onClick={() => {
                    form.setValue('imageFile', undefined, { shouldDirty: true, shouldValidate: true });
                    setCurrentFileInputKey((previousKey) => previousKey + 1);
                  }}
                  type="button"
                  variant="outline"
                >
                  Bỏ chọn ảnh mới
                </Button>
              ) : null}
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
