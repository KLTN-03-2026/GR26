import { z } from 'zod';

const VIETNAM_PHONE_PATTERN = /^0\d{8,10}$/;

/**
 * Zod schema validation cho form tạo chi nhánh.
 * Chỉ validate các field mà backend hiện đang hỗ trợ ở endpoint tạo mới.
 */
export const step1Schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên chi nhánh không được để trống')
    .max(100, 'Tên chi nhánh không vượt quá 100 ký tự'),
  code: z
    .string()
    .trim()
    .min(1, 'Mã chi nhánh không được để trống')
    .max(50, 'Mã chi nhánh không vượt quá 50 ký tự'),
  address: z
    .string()
    .trim()
    .max(255, 'Địa chỉ không vượt quá 255 ký tự'),
  phone: z
    .string()
    .trim()
    .max(20, 'Số điện thoại không vượt quá 20 ký tự')
    .refine(
      (phone) => phone.length === 0 || VIETNAM_PHONE_PATTERN.test(phone),
      'Số điện thoại phải có 9-11 số và bắt đầu bằng 0'
    ),
  latitude: z
    .number()
    .min(-90, 'Vĩ độ không hợp lệ')
    .max(90, 'Vĩ độ không hợp lệ')
    .nullable(),
  longitude: z
    .number()
    .min(-180, 'Kinh độ không hợp lệ')
    .max(180, 'Kinh độ không hợp lệ')
    .nullable(),
}).strict();

export type Step1FormValues = z.infer<typeof step1Schema>;
