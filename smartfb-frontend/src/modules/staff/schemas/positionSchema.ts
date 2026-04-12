import { z } from 'zod';

/**
 * Schema validate cho form tạo/sửa chức vụ.
 */
export const positionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Tên chức vụ phải có ít nhất 2 ký tự')
    .max(100, 'Tên chức vụ không được vượt quá 100 ký tự'),
  description: z
    .string()
    .trim()
    .max(255, 'Mô tả không được vượt quá 255 ký tự'),
});

export type PositionFormValues = z.infer<typeof positionSchema>;
