import { z } from 'zod';

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateInput = (value: string): boolean => {
    if (!DATE_INPUT_PATTERN.test(value)) {
        return false;
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};

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

    minOrderValue: z
        .number()
        .min(0, 'Giá trị đơn tối thiểu không được âm')
        .nullable(),

    startDate: z
        .string()
        .min(1, 'Vui lòng chọn ngày bắt đầu')
        .refine(isValidDateInput, 'Ngày bắt đầu không hợp lệ'),

    endDate: z
        .string()
        .min(1, 'Vui lòng chọn ngày kết thúc')
        .refine(isValidDateInput, 'Ngày kết thúc không hợp lệ'),
}).strict()
    .superRefine((value, context) => {
        if (value.discountType === 'PERCENT' && value.discountValue > 100) {
            context.addIssue({
                code: 'custom',
                path: ['discountValue'],
                message: 'Giá trị giảm phần trăm không được vượt quá 100',
            });
        }

        if (
            isValidDateInput(value.startDate) &&
            isValidDateInput(value.endDate) &&
            value.startDate > value.endDate
        ) {
            context.addIssue({
                code: 'custom',
                path: ['endDate'],
                message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
            });
        }
    });

export type CreateVoucherFormValues = z.infer<typeof createVoucherSchema>;

export const editVoucherSchema = createVoucherSchema;
export type EditVoucherFormValues = CreateVoucherFormValues;
