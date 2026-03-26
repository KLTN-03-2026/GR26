import { z } from 'zod';

/**
 * Zod schema validation cho Step 1: Thông tin cơ bản
 */
export const step1Schema = z.object({
  name: z.string().min(1, 'Tên chi nhánh không được để trống').max(100, 'Tên chi nhánh quá dài'),
  code: z.string().min(1, 'Mã chi nhánh không được để trống').regex(/^CN-\d{2}-\d{3}$/, 'Mã chi nhánh phải theo định dạng CN-XX-XXX'),
  address: z.string().min(5, 'Địa chỉ quá ngắn').max(200, 'Địa chỉ quá dài'),
  city: z.string().min(1, 'Vui lòng chọn thành phố'),
  phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ (phải là 10 số, bắt đầu bằng 0)'),
  managerId: z.string().optional(),
  taxCode: z.string().regex(/^\d{10}(-\d{3})?$/, 'Mã số thuế không hợp lệ').optional().or(z.literal('')),
  notes: z.string().max(500, 'Ghi chú quá dài').optional(),
  image: z.any().optional(),
});

export type Step1FormValues = z.infer<typeof step1Schema>;
