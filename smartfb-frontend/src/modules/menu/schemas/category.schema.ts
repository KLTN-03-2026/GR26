import { z } from 'zod';

/**
 * Schema cho việc tạo mới danh mục món ăn.
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên danh mục không được để trống')
    .max(100, 'Tên danh mục tối đa 100 ký tự'),

  description: z
    .string()
    .max(500, 'Mô tả tối đa 500 ký tự')
    .optional()
    .or(z.literal('').optional()),

  displayOrder: z
    .number()
    .int('Thứ tự hiển thị phải là số nguyên')
    .min(0, 'Thứ tự hiển thị không được âm'),
});

/**
 * Type inference cho form tạo danh mục.
 */
export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;
