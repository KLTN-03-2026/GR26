import { z } from 'zod';

/**
 * Schema validate cho form tạo role trong trang cơ cấu nhân sự.
 */
export const roleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Tên vai trò phải có ít nhất 2 ký tự')
    .max(100, 'Tên vai trò không được vượt quá 100 ký tự'),
  description: z
    .string()
    .trim()
    .max(255, 'Mô tả không được vượt quá 255 ký tự'),
});

export type RoleFormValues = z.infer<typeof roleSchema>;
