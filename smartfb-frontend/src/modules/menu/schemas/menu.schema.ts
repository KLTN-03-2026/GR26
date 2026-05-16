import { z } from 'zod';
import { menuImageUploadConstraints } from '@modules/menu/utils/menuImageUpload';

/**
 * Schema cho việc tạo mới món ăn
 */
export const createMenuSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên món ăn không được để trống')
    .max(255, 'Tên món ăn không được vượt quá 255 ký tự'),

  category: z.string().min(1, 'Vui lòng chọn danh mục'),

  price: z
    .number()
    .min(0, 'Giá bán không được âm')
    .max(100000000, 'Giá bán không được vượt quá 100.000.000đ'),

  unit: z
    .string()
    .max(30, 'Đơn vị tính không được vượt quá 30 ký tự')
    .optional()
    .or(z.literal('').optional()),

  imageFile: z
    .custom<File | null | undefined>((value) => value == null || value instanceof File, {
      message: 'File ảnh không hợp lệ',
    })
    .refine(
      (value) => !value || value.size <= menuImageUploadConstraints.maxRawSizeBytes,
      'Ảnh gốc không được vượt quá 15MB'
    )
    .refine(
      (value) => !value || menuImageUploadConstraints.accept.split(',').includes(value.type),
      'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP'
    )
    .optional(),

  isSyncDelivery: z.boolean().optional(),
});

/**
 * Type inference
 */
export type CreateMenuFormValues = z.infer<typeof createMenuSchema>;
