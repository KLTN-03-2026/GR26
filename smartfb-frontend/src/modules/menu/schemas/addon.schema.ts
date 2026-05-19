import { z } from 'zod';

const hasAtMostTwoDecimalPlaces = (value: number): boolean => {
  return Number.isInteger(value * 100);
};

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
    .max(100000000, 'Giá phụ thu không được vượt quá 100.000.000đ')
    .refine(hasAtMostTwoDecimalPlaces, 'Giá phụ thu chỉ được có tối đa 2 chữ số thập phân'),
}).strict();

/**
 * Type inference cho form addon.
 */
export type CreateAddonFormValues = z.infer<typeof createAddonSchema>;
