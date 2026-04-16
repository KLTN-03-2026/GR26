import { z } from 'zod';

export const createVoucherSchema = z.object({
    code: z
        .string()
        .trim()
        .min(1, 'Mã voucher không được để trống')
        .max(50, 'Mã voucher không vượt quá 50 ký tự')
        .regex(/^[A-Z0-9]+$/, 'Mã voucher chỉ gồm chữ hoa và số'),

    name: z
        .string()
        .trim()
        .min(1, 'Tên chương trình không được để trống')
        .max(100, 'Tên chương trình không vượt quá 100 ký tự'),

    discountType: z.enum(['PERCENT', 'FIXED_AMOUNT']),

    discountValue: z
        .number()
        .min(1, 'Giá trị giảm phải lớn hơn 0'),

    minOrderValue: z.number().nullable(),

    startDate: z
        .string()
        .min(1, 'Vui lòng chọn ngày bắt đầu'),

    endDate: z
        .string()
        .min(1, 'Vui lòng chọn ngày kết thúc'),
});

export type CreateVoucherFormValues = z.infer<typeof createVoucherSchema>;

export const editVoucherSchema = createVoucherSchema;
export type EditVoucherFormValues = CreateVoucherFormValues;