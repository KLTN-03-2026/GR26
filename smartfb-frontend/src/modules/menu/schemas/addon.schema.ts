import { z } from 'zod';

/**
 * Schema cho việc tạo mới addon/topping.
 */
export const createAddonSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên topping không được để trống')
    .max(100, 'Tên topping tối đa 100 ký tự'),

  extraPrice: z
    .number()
    .min(0, 'Giá phụ thu không được âm')
    .max(100000000, 'Giá phụ thu không được vượt quá 100.000.000đ'),
});

/**
 * Type inference cho form addon.
 */
export type CreateAddonFormValues = z.infer<typeof createAddonSchema>;
