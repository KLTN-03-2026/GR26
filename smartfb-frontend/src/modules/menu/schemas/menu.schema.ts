import { z } from 'zod';
import { MENU_CATEGORIES } from '@modules/menu/constants/menu.constants';

/**
 * Schema cho việc tạo mới món ăn
 */
export const createMenuSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên món ăn không được để trống')
    .max(100, 'Tên món ăn không được vượt quá 100 ký tự'),

  category: z.enum(
    ['ca-phe', 'tra-trai-cay', 'banh-ngot', 'da-ep', 'sua-hat', 'khac'] as const,
    { required_error: 'Vui lòng chọn danh mục' }
  ),

  price: z
    .number()
    .min(1000, 'Giá bán tối thiểu là 1.000đ')
    .max(10000000, 'Giá bán tối đa là 10.000.000đ'),

  cost: z
    .number()
    .min(0, 'Giá vốn không được âm')
    .optional()
    .or(z.literal(0).optional()),

  description: z
    .string()
    .max(500, 'Mô tả không được vượt quá 500 ký tự')
    .optional(),

  ingredients: z
    .array(z.string())
    .optional(),

  image: z
    .string()
    .url('URL ảnh không hợp lệ')
    .optional()
    .or(z.literal('').optional()),

  tags: z
    .array(z.enum(['moi', 'hot', 'bestseller', 'recommend'] as const))
    .optional(),
});

/**
 * Schema cho việc cập nhật món ăn
 */
export const updateMenuSchema = createMenuSchema.partial().extend({
  status: z.enum(['selling', 'hidden', 'pending'] as const).optional(),
  isAvailable: z.boolean().optional(),
});

/**
 * Schema cho việc toggle trạng thái bán
 */
export const toggleMenuStatusSchema = z.object({
  id: z.string().uuid('ID không hợp lệ'),
  isAvailable: z.boolean(),
});

/**
 * Type inference
 */
export type CreateMenuFormValues = z.infer<typeof createMenuSchema>;
export type UpdateMenuFormValues = z.infer<typeof updateMenuSchema>;

/**
 * Helper function để tính GP%
 */
export const calculateGpPercent = (price: number, cost?: number): number => {
  if (!cost || cost <= 0 || price <= 0) return 0;
  return Math.round(((price - cost) / price) * 100);
};

/**
 * Helper function để tính giá vốn từ GP%
 */
export const calculateCostFromGpPercent = (price: number, gpPercent: number): number => {
  if (gpPercent <= 0 || price <= 0) return 0;
  return Math.round(price * (1 - gpPercent / 100));
};
