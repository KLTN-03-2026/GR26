import { z } from 'zod';

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

  image: z
    .string()
    .url('URL ảnh không hợp lệ')
    .optional()
    .or(z.literal('').optional()),

  isSyncDelivery: z.boolean().optional(),
});

/**
 * Schema cho việc cập nhật món ăn
 */
export const updateMenuSchema = createMenuSchema.partial().extend({
  status: z.enum(['selling', 'hidden'] as const).optional(),
  isAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
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
